import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {collectMedia} from './media-library.mjs';
import path from 'node:path';

const report = {checks: [], browserInspection: false};
const check = (name, passed) => {
  report.checks.push({name, passed});
  assert.ok(passed, name);
};
const source = await readFile('src/custom-fonts.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext}}).outputText;
const {customFonts, applyCustomFonts} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const calls = [], properties = {}, attributes = {};
globalThis.FontFace = class {
  constructor(family, source, descriptors) { Object.assign(this, {family, source, descriptors}); calls.push(this); }
  async load() { return this; }
};
globalThis.document = {
  fonts: {add() {}},
  documentElement: {
    style: {setProperty: (key, value) => properties[key] = value},
    setAttribute: (key, value) => attributes[key] = value,
  },
};
check('四个字体位置均使用用户提供的江西拙楷文件', Object.values(customFonts).every(x => x.file === '江西拙楷3.0.ttf' && x.weight === '400'));
const results = await applyCustomFonts();
check('字体加载成功后四类样式均会启用', results.every(x => x.status === 'loaded') && Object.keys(customFonts).every(role => attributes[`data-custom-font-${role}`] === 'ready' && properties[`--custom-font-${role}`].includes(`LumenCustom-${role}`)));
check('全部字体请求指向同一份本地文件', calls.every(x => x.source === 'url("/fonts/custom/%E6%B1%9F%E8%A5%BF%E6%8B%99%E6%A5%B73.0.ttf")'));
const css = await readFile('src/custom-fonts.css', 'utf8');
check('正文规则覆盖全站而非只覆盖个别页面', css.includes('html[data-custom-font-body="ready"] body *,'));
check('加载与过渡层及文字伪元素使用全局字体', css.includes('body *::before,') && css.includes('body *::after'));
check('输入提示与全部六级标题已覆盖', css.includes('::placeholder') && css.includes('h1, h2, h3, h4, h5, h6'));
const main = await readFile('src/main.tsx', 'utf8');
check('字体覆盖样式最后加载', [...main.matchAll(/import ['"]([^'"]+\.css)['"]/g)].at(-1)?.[1] === './custom-fonts.css');
const markCss = await readFile('src/brand-identity-refresh.css', 'utf8');
const polishCss = await readFile('src/experience-final-polish.css', 'utf8');
const museumCss = await readFile('src/museum-exhibit-layout.css', 'utf8');
check('Logo 外层显式保持无边框无底色无阴影', /\.footer-mark\s*\{[^}]*border: 0;[^}]*background: transparent;[^}]*box-shadow: none;/s.test(markCss));
check('移除深色章节对 Logo 额外添加的底色', !museumCss.includes('.experience-brand-mark,'));
check('移除 Logo 内阴影旧规则', !/\.flower-experience \.experience-brand-mark\s*\{[^}]*(?:background|box-shadow)/s.test(polishCss));

const base = 'http://127.0.0.1:3000';
const html = await (await fetch(base)).text();
for (const route of ['/', '/series/flower-gods', '/series/flower-gods/jingxin', '/verify']) {
  const response = await fetch(base + route);
  check(`本地页面可访问：${route}`, response.ok && (await response.text()).includes('id="root"'));
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const original = await readFile('public/fonts/custom/江西拙楷3.0.ttf');
const fontResponse = await fetch(base + '/fonts/custom/' + encodeURIComponent('江西拙楷3.0.ttf'));
check('实际返回的字体与用户原文件一致', fontResponse.ok && sha256(Buffer.from(await fontResponse.arrayBuffer())) === sha256(original));
const cssUrl = html.match(/href="([^"]+\.css)"/)?.[1];
const builtCss = await (await fetch(base + cssUrl)).text();
check('预览已包含全局字体覆盖和透明 Logo 样式', builtCss.includes('--custom-font-body') && builtCss.includes('data-custom-font-body') && builtCss.includes('box-shadow:none'));
const {entries} = await collectMedia(process.cwd());
const logoResponse = await fetch(base + entries.brandLogo.src);
check('正式 Logo 与素材库当前文件一致', logoResponse.ok && sha256(Buffer.from(await logoResponse.arrayBuffer())) === sha256(await readFile(path.join('素材库', entries.brandLogo.file))));
await mkdir('artifacts', {recursive: true});
await writeFile('artifacts/global-fonts-check.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
