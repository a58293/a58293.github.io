import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {collectMedia, digest} from './media-library.mjs';

let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
const read=file=>fs.readFile(file,'utf8');
const main=await read('src/main.tsx');
const detail=await read('src/FlowerGodsExperience.tsx');
const collection=await read('src/FlowerGodsCollection.tsx');
const transition=await read('src/UnifiedBjdSite.tsx');
await check('已移除暖调覆盖及暖调标识，仍以用户字体最后覆盖',()=>{
  assert.ok(!main.includes('flower-volume-warm'));
  for(const source of [detail,collection,transition])assert.doesNotMatch(source,/data-flower-atmosphere|data-transition-volume|var\(--flower-/);
  assert.match(main,/import '\.\/home-product-theme.css';\s*import '\.\/custom-fonts.css';/);
});
await check('四个章节恢复为改色前构建的完整色值',()=>{
  // Recorded from artifacts/collection-redesign-build-20260903, before the warm overlay.
  const expected=[
    ['prologue','#f7f6f1','#0f4841','#52766e','#c7ddd6'],
    ['details','#f5f3ed','#183f3b','#5d706a','#c8ddd6'],
    ['becoming','#f0f2ee','#173f3a','#527169','#cbded7'],
    ['verification','#deebe5','#0f443e','#4b7067','#f8f7f1'],
  ];
  const actual=[...detail.matchAll(/id: "(prologue|details|becoming|verification)",[^\n]*background: "([^"]+)", ink: "([^"]+)", muted: "([^"]+)", glow: "([^"]+)"/g)].map(m=>m.slice(1));
  assert.deepEqual(actual,expected);
});
await check('挂画悬停不整幅位移，仍有键盘焦点提示',async()=>{
  const css=await read('src/series-scrolls.css');
  const rules=[...css.matchAll(/\.volume-floral:hover \.volume-art > img\s*\{([^}]+)\}/g)];
  assert.ok(rules.length>0);
  for(const rule of rules)assert.doesNotMatch(rule[1],/transform:\s*(?:translate|scale)/);
  assert.match(css,/\.volume-floral:focus-visible \{ outline: 2px solid currentColor;/);
});
await check('卷内轻转场不显示整屏幕布，减少动态偏好得到保留',async()=>{
  const css=await read('src/unified-site-transition.css');
  assert.match(css,/data-transition-kind="soft"\] \.site-transition-curtain \{ display: none;/);
  assert.match(css,/flower-view-leave \.16s/);
  assert.match(css,/flower-view-enter \.24s/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
});
const media=await collectMedia(process.cwd());
await check('首页挂画独立换图，不改变云廊和角色原图',()=>{
  const versions={flowerPavilion:'f8c30e2b229e0abc',jingxinConcept:'abf227f2b1e6e828',jingxinPortrait:'ae2a347e750132a0'};
  for(const [id,version] of Object.entries(versions))assert.ok(media.entries[id].src.includes(version));
});
await check('本地已发布的素材仍与中文素材库逐字节一致',async()=>{
  for(const id of ['homeSeries','angelScroll','flowerPavilion']){
    const file=media.files.find(f=>f.url===media.entries[id].src);
    const response=await fetch('http://localhost:3000'+file.url,{signal:AbortSignal.timeout(10000)});
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-type'),/image\/png/);
    assert.equal(digest(Buffer.from(await response.arrayBuffer())),digest(file.bytes));
  }
});
console.log(`${checks} checks passed; source/model/HTTP only, no browser visual QA.`);
