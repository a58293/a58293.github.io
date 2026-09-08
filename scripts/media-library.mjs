import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export function inside(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw Error(`素材路径超出目录：${relative}`);
  return target;
}
export function imageInfo(bytes) {
  if (bytes.length > 32 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return {format: 'png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
  }
  if (bytes.length > 12 && bytes[0] === 255 && bytes[1] === 216) {
    let i = 2;
    while (i + 8 < bytes.length) {
      if (bytes[i++] !== 255) break;
      while (bytes[i] === 255) i++;
      const marker = bytes[i++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = bytes.readUInt16BE(i);
      if (length < 2 || i + length > bytes.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return {format: 'jpg', height: bytes.readUInt16BE(i + 3), width: bytes.readUInt16BE(i + 5)};
      }
      i += length;
    }
  }
  if (bytes.length >= 30 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP') {
    const type = bytes.toString('ascii',12,16);
    if (type === 'VP8X') return {format:'webp', width:1+bytes.readUIntLE(24,3), height:1+bytes.readUIntLE(27,3)};
    if (type === 'VP8 ') return {format:'webp', width:bytes.readUInt16LE(26)&0x3fff, height:bytes.readUInt16LE(28)&0x3fff};
    if (type === 'VP8L' && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21);
      return {format:'webp', width:1+(bits&0x3fff), height:1+((bits>>>14)&0x3fff)};
    }
  }
  throw Error('无法识别图片头，请导出有效的 PNG / JPG / WebP，不能只改扩展名。');
}
export async function collectMedia(project) {
  const root = path.join(project, '素材库');
  const slots = JSON.parse(await fs.readFile(path.join(root, '素材位配置.json'), 'utf8'));
  const entries = {};
  const files = [];
  const known = new Set();
  for (const [id, slot] of Object.entries(slots)) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(id) || typeof slot.file !== 'string' || !Array.isArray(slot.formats)) throw Error(`无效素材位：${id}`);
    const candidates = [];
    for (const ext of slot.formats) {
      if (!['png','jpg','jpeg','webp'].includes(ext)) throw Error(`不支持格式：${ext}`);
      const file = inside(root, `${slot.file}.${ext}`);
      if (known.has(file)) throw Error(`素材位路径重复：${file}`);
      known.add(file);
      try {
        const stat = await fs.lstat(file);
        if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`素材必须是普通文件：${file}`);
        const real = await fs.realpath(file);
        inside(root, path.relative(root, real));
        candidates.push({file, ext});
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    if (candidates.length > 1) throw Error(`同一素材位只能保留一种格式：${slot.file}`);
    const candidate = candidates[0];
    if (!candidate && slot.required) throw Error(`缺少必需图片：${slot.file}.${slot.formats[0]}`);
    let info = null, src = null;
    if (candidate) {
      const bytes = await fs.readFile(candidate.file);
      if (bytes.length > 24 * 1024 * 1024) throw Error(`图片超过 24 MiB，请导出网页版本：${slot.file}`);
      info = imageInfo(bytes);
      if (!info.width || !info.height || info.width > 16000 || info.height > 16000) throw Error(`图片尺寸不合法：${slot.file}`);
      if ((candidate.ext === 'jpeg' ? 'jpg' : candidate.ext) !== info.format) throw Error(`扩展名与图片内容不符：${slot.file}`);
      src = `/media/${id}-${digest(bytes).slice(0,16)}.${candidate.ext}`;
      files.push({file: candidate.file, url: src, bytes, mime: `image/${info.format === 'jpg' ? 'jpeg' : info.format}`});
    }
    entries[id] = {src, own: !!candidate, alt: slot.alt || '', file: candidate ? path.relative(root, candidate.file).split(path.sep).join('/') : null, info, slot};
  }
  async function validateFolder(dir) {
    for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if (entry.isSymbolicLink()) throw Error(`素材库不接受目录链接：${file}`);
      if (entry.isDirectory()) await validateFolder(file);
      else if (/\.(png|jpe?g|webp|avif|heic|gif|bmp|tiff?|svg|psd)$/i.test(entry.name) && !known.has(file)) {
        throw Error(`未登记的图片，请按素材位清单命名并使用小写扩展名：${path.relative(root,file)}`);
      }
    }
  }
  await validateFolder(root);
  function resolveFallback(id, visited = new Set()) {
    if (visited.has(id) || !entries[id]) throw Error(`循环或无效的图片回退：${id}`);
    const entry = entries[id];
    if (entry.src || !entry.slot.fallback) return entry.src;
    visited.add(id);
    entry.src = resolveFallback(entry.slot.fallback, visited);
    return entry.src;
  }
  for (const id of Object.keys(entries)) resolveFallback(id);
  return {entries, files};
}

// Only these original public assets remain publishable; the 889-image legacy library is not copied.
export async function collectPublicSupport(project) {
  const root = path.join(project, 'public');
  const result = [];
  async function add(file) {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`不支持的公开资源：${file}`);
    inside(root, path.relative(root, await fs.realpath(file)));
    const extension=path.extname(file).toLowerCase();
    const mime=extension==='.ttf'?'font/ttf':extension==='.woff2'?'font/woff2':extension==='.png'?'image/png':extension==='.txt'?'text/plain; charset=utf-8':'application/octet-stream';
    result.push({file, url:'/'+path.relative(root,file).split(path.sep).join('/'), bytes:await fs.readFile(file), mime});
  }
  // Publish only active support files. Duplicate and historical fonts stay in
  // the local library without adding several megabytes to every deployment.
  for (const name of [
    'fonts/custom/江西拙楷3.0.ttf',
    '_headers', '_redirects', 'robots.txt', 'favicon.png',
    '24dce09b1e7c6dc046ed86dc4718697e.txt',
  ]) await add(path.join(root,name));
  return result;
}
