import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {collectMedia,digest,inside,imageInfo} from './media-library.mjs';
import {loadSource} from './test-source-loader.mjs';

let checks=0;
async function check(name,fn) { await fn(); checks++; console.log('PASS '+name); }
const project=process.cwd();
const live=await collectMedia(project);
const {siteMedia,detailImage}=loadSource('src/media-library.ts');
await check('31 个素材位与所有生成引用一致',()=>{
  assert.equal(Object.keys(live.entries).length,31);
  for (const [id,entry] of Object.entries(live.entries)) assert.deepEqual(siteMedia[id],{src:entry.src,own:entry.own,alt:entry.alt});
});
await check('每张实际使用的图片已输出，内容与素材库一致',async()=>{
  for (const file of live.files) assert.equal(digest(await fs.readFile(path.join(project,'dist',file.url))),digest(file.bytes));
});
await check('网站产物不包含旧图片全集、中文历史副本或源库配置',async()=>{
  for (const folder of ['images','素材库','素材管理','docs','scripts']) await assert.rejects(fs.access(path.join(project,'dist',folder)));
});
await check('原来的 889 张原图和中文副本逐张校验仍然完整',async()=>{
  const manifest=JSON.parse(await fs.readFile('素材管理/中文功能映射.json','utf8'));
  assert.equal(manifest.length,889);
  for (const entry of manifest) {
    assert.equal(digest(await fs.readFile(path.join('public/images',entry.source))),entry.sha256,entry.source);
    assert.equal(digest(await fs.readFile(path.join('素材管理',entry.copy))),entry.sha256,entry.copy);
  }
});
await check('当前源文件不再散落旧图片路径',async()=>{
  for (const file of ['BjdApp.tsx','BrandLoadingScreen.tsx','FlowerGodsCollection.tsx','FlowerGodsExperience.tsx','flower-gods-catalog.ts','VerifyPage.tsx','initial-assets.ts']) {
    assert.ok(!(await fs.readFile('src/'+file,'utf8')).includes('/images/'),file);
  }
});
await check('新细节照片不再被当作全身图放大裁切；放大镜与主图引用一致',()=>{
  const id='detailFace';
  assert.equal(detailImage(id,'50% 13%',2.7).scale,2.7);
  siteMedia[id]={src:'/media/test-detail.png',own:true,alt:'测试'};
  assert.deepEqual(detailImage(id,'50% 13%',2.7),{src:'/media/test-detail.png',own:true,position:'50% 50%',scale:1});
});

// Safe isolated fixtures. No real library images are overwritten or deleted.
await fs.mkdir('artifacts',{recursive:true});
const fixture=await fs.mkdtemp(path.join(project,'artifacts','media-library-test-'));
const root=path.join(fixture,'素材库');
await fs.mkdir(root);
const png=await fs.readFile(live.files.find(x=>x.url.includes('brandLogo')).file);
const config={required:{file:'标识',formats:['png','jpg'],required:true,size:[1,1]},optional:{file:'官拍',formats:['png'],fallback:'required',size:[1,1]}};
const writeConfig=()=>fs.writeFile(path.join(root,'素材位配置.json'),JSON.stringify(config));
await writeConfig();
await fs.writeFile(path.join(root,'标识.png'),png);
await check('不存在的可选图使用登记的默认图',async()=>{
  const result=await collectMedia(fixture);
  assert.equal(result.entries.optional.src,result.entries.required.src);
});
await check('替换同名图片后网址版本改变',async()=>{
  const previous=await collectMedia(fixture);
  await fs.writeFile(path.join(root,'标识.png'),Buffer.concat([png,Buffer.from('changed-fixture')]));
  const next=await collectMedia(fixture);
  assert.notEqual(next.entries.required.src,previous.entries.required.src);
});
await check('补入可选官拍后自动接入，不用改页面代码',async()=>{
  await fs.writeFile(path.join(root,'官拍.png'),png);
  const next=await collectMedia(fixture);
  assert.equal(next.entries.optional.own,true);
  assert.notEqual(next.entries.optional.src,next.entries.required.src);
});
await check('格式重名阻止发布',async()=>{
  await fs.writeFile(path.join(root,'标识.jpg'),png);
  await assert.rejects(collectMedia(fixture),/同一素材位/);
  // Preserve fixture file; point this fixture's manifest to a fresh valid slot instead.
  config.required.formats=['jpg'];
  await writeConfig();
});
await check('假扩展名与坏文件头被识别',async()=>{
  await assert.rejects(collectMedia(fixture),/扩展名与图片内容不符/);
  assert.throws(()=>imageInfo(Buffer.from('not an image')),/无法识别/);
});
await check('路径越界、回退循环、缺失必需图阻止发布',async()=>{
  assert.throws(()=>inside(root,'../outside.png'),/超出目录/);
  config.required.file='../outside';
  await writeConfig();
  await assert.rejects(collectMedia(fixture),/超出目录/);
  config.required.file='缺失文件';
  await writeConfig();
  await assert.rejects(collectMedia(fixture),/缺少必需/);
  // Separate minimal manifest fixture for cycle validation.
  const loop=path.join(fixture,'loop');
  await fs.mkdir(path.join(loop,'素材库'),{recursive:true});
  await fs.writeFile(path.join(loop,'素材库/素材位配置.json'),JSON.stringify({a:{file:'a',formats:['png'],fallback:'b'},b:{file:'b',formats:['png'],fallback:'a'}}));
  await assert.rejects(collectMedia(loop),/循环/);
});

const mocked=structuredClone(siteMedia);
mocked.official02={src:'/media/test-official.png',own:true,alt:'测试官拍'};
mocked.collector01={src:'/media/test-collector.png',own:true,alt:'测试返图署名'};
const media=loadSource('src/media-library.ts',{'./generated/site-media':{siteMedia:mocked}});
const overrides={'./media-library':media};
await check('官拍和返图补图后的组件会显示照片并更新状态文案',()=>{
  const Detail=loadSource('src/FlowerGodsExperience.tsx',overrides).default;
  const html=renderToStaticMarkup(createElement(Detail));
  assert.ok(html.includes('/media/test-official.png'));
  assert.ok(html.includes('已收录 1 幅作品'));
  assert.equal((html.match(/IMAGE PENDING/g)||[]).length,2);
  globalThis.window={location:{hash:'#collectors'}};
  const Home=loadSource('src/BjdApp.tsx',overrides).default;
  const home=renderToStaticMarkup(createElement(Home));
  assert.ok(home.includes('/media/test-collector.png'));
  assert.ok(home.includes('测试返图署名'));
  delete globalThis.window;
});
console.log(`${checks} checks passed; browserInspection=false`);
