const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const out=path.resolve('artifacts/security-fixes-2026-09-03');
fs.mkdirSync(out,{recursive:true});
const report={checks:[],pageErrors:[],securityViolations:[]};
function check(name,passed,detail=''){report.checks.push({name,passed,detail});}
async function ready(page,route,host='http://127.0.0.1:4173'){
 await page.goto(host+route,{waitUntil:'networkidle'});
 const skip=page.getByRole('button',{name:/跳过/});
 if(await skip.isVisible())await skip.click();
 await page.locator('.brand-loader').waitFor({state:'detached',timeout:10000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(400);
}
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
  page.on('pageerror',err=>report.pageErrors.push(err.message));
  await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>{window.__cspViolations??=[];window.__cspViolations.push(e.violatedDirective)}));
  await ready(page,'/verify');
  const response=await page.request.get('http://127.0.0.1:4173/verify'),headers=response.headers();
  for(const key of ['content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'])check('Production header '+key,Boolean(headers[key]),headers[key]);
  const writes=[];
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+new URL(r.url()).pathname)});
  for(const size of [{width:1440,height:960},{width:390,height:844},{width:375,height:667}]){
   await page.setViewportSize(size);
   await ready(page,'/verify');
   check(size.width+'px real identifier inputs read-only',await page.locator('.verify-console input:not([type="radio"])').evaluateAll(xs=>xs.length===2&&xs.every(x=>x.readOnly)));
   for(const [label,result] of [['匹配样例','演示结果：匹配'],['未匹配样例','演示结果：未匹配'],['暂缓样例','演示结果：暂缓']]){
    await page.getByLabel(label,{exact:true}).check();
    await page.getByRole('button',{name:'预览演示结果',exact:true}).click();
    await page.getByRole('heading',{name:result,exact:true}).waitFor();
    check(size.width+'px '+result,true);
    await page.getByRole('button',{name:'返回选择样例',exact:true}).click({timeout:2500});
    check(size.width+'px result return is clickable',await page.getByRole('button',{name:'预览演示结果'}).isVisible());
   }
   check(size.width+'px verification does not overflow horizontally',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   check(size.width+'px never claims formal issuance',!(await page.locator('.verify-world').innerText()).includes('正式发行 · 有效'));
   await page.screenshot({path:path.join(out,'verify-'+size.width+'.png'),fullPage:true});
   report.securityViolations.push(...await page.evaluate(()=>window.__cspViolations||[]));
  }
  check('No customer submission request',writes.length===0,writes);
  await page.setViewportSize({width:1440,height:960});
  await ready(page,'/#collectors');
  check('Brand wrapper retained',await page.locator('.site-header > a.brand').count()===1);
  await page.evaluate(()=>{location.hash='series'});
  await page.waitForFunction(()=>document.querySelector('.home-experience')?.getAttribute('data-home-chapter')==='series');
  check('Hash navigation synchronized',true);
  await page.getByRole('button',{name:'前往核验',exact:true}).click();
  await page.locator('.home-chapter-final[data-state="active"]').waitFor();
  await page.screenshot({path:path.join(out,'home-verify.png')});
  await ready(page,'/series/flower-gods/jingxin');
  await page.getByRole('tab',{name:/01 原画/}).click();
  check('Original artwork still available',await page.locator('.prologue-original-art').isVisible());
  await page.getByRole('button',{name:'前往核验：AUTHENTICITY'}).click();
  await page.locator('#verification[data-state="active"]').waitFor();
  check('Lotus relief retained',await page.locator('.lotus-relief-verification').isVisible());
  await page.screenshot({path:path.join(out,'lotus-verification.png')});
  for(const invalid of ['/does-not-exist','/verify-extra','/series/flower-gods-extra']){
   await ready(page,invalid);
   check('Explicit not-found view '+invalid,await page.getByRole('heading',{name:'这一页暂未收录'}).isVisible());
  }
  await ready(page,'/verify','http://127.0.0.1:3000');
  const fontRequests=[];
  page.on('request',r=>{if(r.url().includes('/fonts/custom/'))fontRequests.push(r.url())});
  check('Only configured custom font files are requested',await page.evaluate(async()=>{
   const m=await import('/src/custom-fonts.ts');
   const configured=new Set(Object.values(m.customFonts).filter(x=>x.file).map(x=>new URL('/fonts/custom/'+encodeURIComponent(x.file),location.origin).href));
   const requested=performance.getEntriesByType('resource').filter(entry=>entry.name.includes('/fonts/custom/'));
   return requested.every(entry=>configured.has(entry.name))&&[...configured].every(url=>requested.some(entry=>entry.name===url));
  }));
  const invalid=await page.evaluate(async()=>{const m=await import('/src/custom-fonts.ts');return m.applyCustomFonts({...m.customFonts,body:{file:'../private.ttf'}})});
  check('Custom font path traversal rejected',invalid.find(x=>x.role==='body').status==='invalid-file');
  const missing=await page.evaluate(async()=>{const m=await import('/src/custom-fonts.ts');return m.applyCustomFonts({...m.customFonts,title:{file:'missing-qa-font.woff2'}})});
  check('Missing custom font falls back',missing.find(x=>x.role==='title').status==='fallback');
  const invalidWeight=await page.evaluate(async()=>{const m=await import('/src/custom-fonts.ts');return m.applyCustomFonts({...m.customFonts,title:{file:'weight-test.woff2',weight:'not-a-weight'}})});
  check('Invalid font settings do not crash',invalidWeight.find(x=>x.role==='title').status==='fallback');
  const font=fs.readFileSync('public/fonts/站酷小薇体.ttf');
  await page.route('**/fonts/custom/qa-*.ttf',route=>route.fulfill({status:200,contentType:'font/ttf',body:font}));
  const loaded=await page.evaluate(async()=>{const m=await import('/src/custom-fonts.ts');return m.applyCustomFonts(Object.fromEntries(Object.keys(m.customFonts).map(role=>[role,{file:'qa-'+role+'.ttf'}])))});
  check('All four custom font slots can load',loaded.every(x=>x.status==='loaded'),loaded);
  check('Custom title font actually applied',await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily.includes('LumenCustom-title')));
  check('Custom UI font actually applied',await page.locator('.verify-submit').evaluate(el=>getComputedStyle(el).fontFamily.includes('LumenCustom-ui')));
  check('Custom body font actually applied',await page.locator('.verify-lead').evaluate(el=>getComputedStyle(el).fontFamily.includes('LumenCustom-body')));
  check('Custom English font actually applied',await page.locator('.verify-index').evaluate(el=>getComputedStyle(el).fontFamily.includes('LumenCustom-latin')));
  for(const route of ['/docs/网站功能与安全自查.md','/素材管理/中文功能映射.json','/scripts/organize-images.mjs']){
   const response=await page.request.get('http://127.0.0.1:3000'+encodeURI(route));
   check('Dev private files blocked '+route,response.status()===403,response.status());
  }
  const inventory=JSON.parse(fs.readFileSync('素材管理/中文功能映射.json','utf8'));
  check('889 Chinese named entries',inventory.length===889&&inventory.every(x=>/[\u3400-\u9fff]/.test(x.name)));
  await page.goto(pathToFileURL(path.resolve('素材管理/图片功能索引.html')).href,{waitUntil:'load'});
  check('Local gallery has all 889 entries',await page.locator('article').count()===889);
  await page.locator('#search').fill('开场动画');
  check('Local Chinese search filters by function',await page.locator('article:not([hidden])').count()===6);
  await page.locator('#search').fill('');
  await page.locator('#group').selectOption('01_在用品牌素材/01_正式标识');
  check('Local group filter works',await page.locator('article:not([hidden])').count()===1);
  check('No page JS errors',report.pageErrors.length===0,report.pageErrors);
  check('No production CSP violations in tested flows',report.securityViolations.length===0,report.securityViolations);
 }catch(e){report.error=e.message;process.exitCode=1;}
 finally{await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.checks.some(x=>!x.passed))process.exitCode=1;}
})();
