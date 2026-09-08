import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const project = process.cwd();
const sourceRoot = path.join(project, 'public', 'images');
const outputRoot = path.join(project, '素材管理');
const copyRoot = path.join(outputRoot, '中文功能分区');
const sourceIndex = await fs.readFile(path.join(project, 'docs', '全部图片文件目录.md'), 'utf8');
const rows = sourceIndex.split('\n').filter(line => /^\| (bjd|brand|covers|graphic|illustration|installation|logo|mcn|spatial)\//.test(line)).map(line => {
  const fields = line.split('|').map(s=>s.trim());
  const [width,height] = fields[2].split(' × ').map(Number);
  return {source:fields[1],width,height,alpha:fields[4]==='有'};
});
if(rows.length !== 889) throw new Error('目录数量变化，请重新核对全量图片清单。');

const brand = {
  'bjd/lotus-goddess-concept.png': ['01_在用品牌素材/02_镜昕角色展示','镜昕_角色原画','首页首屏、系列封面、主角介绍、详情原画','在用'],
  'bjd/lotus-goddess-transparent.png': ['01_在用品牌素材/02_镜昕角色展示','镜昕_透明角色预览','详情粒子展示、造型细节、衣装区域及放大镜；待确认是否实体实拍','在用'],
  'brand/lumen-auralis-official-logo.png': ['01_在用品牌素材/01_正式标识','绘屿造物_正式品牌标识','首页、详情、核验页标识及核验入口卡片','在用'],
  'brand/lotus-relief-sides.png': ['01_在用品牌素材/04_莲花浮雕','莲花浮雕_两侧透明装饰','详情官方摄影与身份核验两侧装饰','在用'],
  'brand/brand-loader-line-art-regenerated-circle-v4.png': ['01_在用品牌素材/03_品牌开场动画','开场动画_完整圆轨底图_定稿第四版','开场动画底层及回声层','在用'],
  'brand/brand-loader-star-dot-transparent-v3.png': ['01_在用品牌素材/03_品牌开场动画','开场动画_星星与点_透明第三版','随轨道移动的星星与点','在用'],
  'bjd/lotus-goddess-cutout.png': ['02_品牌备选与参考/01_旧版角色图','镜昕_旧版抠图_无透明通道','历史备选，不宜作为透明图直接接入','未引用'],
  'bjd/lotus-goddess-cutout-v2.png': ['02_品牌备选与参考/01_旧版角色图','镜昕_旧版抠图第二版_无透明通道','历史备选，不宜作为透明图直接接入','未引用'],
  'brand/brand-loader-line-art.png': ['02_品牌备选与参考/02_旧版开场动画','开场动画_原始线稿','旧稿，仅供追溯','未引用'],
  'brand/brand-loader-line-art-split-v2.png': ['02_品牌备选与参考/02_旧版开场动画','开场动画_拆层底图第二版','旧稿，仅供追溯','未引用'],
  'brand/brand-loader-line-art-split-v3.png': ['02_品牌备选与参考/02_旧版开场动画','开场动画_拆层底图第三版','旧稿，仅供追溯','未引用'],
  'brand/brand-loader-star-transparent-v2.png': ['02_品牌备选与参考/02_旧版开场动画','开场动画_旧版透明星星第二版','旧星星图层，仅供追溯','未引用'],
  'brand/brand-relief-lotus.jpg': ['02_品牌备选与参考/03_浮雕质感参考','莲花浮雕_质感参考原图','质感参考，不是当前页面背景','未引用'],
};
const productNames = {'01':'阿祖的小院','03':'普洱茶','04':'岚_Bistro','05':'食谷者_华侨城恐龙谷','06':'茜姿兰','07':'普洱','08':'健康日记','09':'泽彝','10':'南嵩','11':'鸢尾','12':'蓬松生活','13':'云南省阜外心血管病医院','14':'孔子学院','15':'naravan','16':'中环_卡地亚','17':'十木草','18':'话说大理','19':'CORAL_CLUB','20':'丹寨万达小镇','22':'槐山脚下','23':'月咏堂','24':'应时发生','25':'RUNNING_HAM'};
const covers = {logo:'品牌标识',bjd:'球形关节人偶',spatial:'空间设计',installation:'产品设计',mcn:'模特经纪',graphic:'平面设计',illustration:'商业海报'};
const clean = s=>s.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'');
function classify(file) {
  if(brand[file]) return brand[file];
  const pieces=file.split('/'), folder=pieces[0], stem=path.basename(file,path.extname(file));
  const variant=path.extname(file)==='.webp'?'移动版':'桌面版';
  const [projectId, detail] = stem.split('-');
  const position=detail?'内页'+detail.padStart(2,'0'):'封面';
  if(folder==='covers') return ['03_历史作品集/01_分类封面', (covers[stem]||stem)+'_分类封面_'+variant,'旧作品集首页分类入口封面','历史未引用'];
  if(folder==='graphic') return ['03_历史作品集/02_平面设计','平面设计_项目'+projectId+'_'+position+'_'+variant,'旧平面设计项目'+projectId+'的'+position,'历史未引用'];
  if(folder==='installation') return ['03_历史作品集/03_产品设计/项目'+projectId+'_'+(productNames[projectId]||'待补项目名'),'产品设计_'+(productNames[projectId]||'项目'+projectId)+'_'+position+'_'+variant,'旧产品设计项目的'+position+'；项目名来自原内容配置','历史未引用'];
  if(folder==='illustration') {
    const type={anime:'动漫主题',film:'影视主题',game:'游戏主题'}[pieces[1]]||'未细分';
    return ['03_历史作品集/04_商业海报/'+type,type+'海报_编号'+stem+'_'+variant,'旧商业海报展示；不推断具体角色或片名','历史未引用'];
  }
  if(folder==='logo') return ['03_历史作品集/05_品牌标识设计','品牌标识设计_编号'+stem+'_'+variant,'旧品牌标识作品展示；客户名称未提供','历史未引用'];
  if(folder==='mcn') {
    const match=stem.match(/^model-([ab])-(\d+)$/);
    if(!match) throw new Error('未识别模特素材：'+file);
    const model=match[1]==='a'?'模特甲':'模特乙';
    return ['03_历史作品集/06_模特经纪/'+model,model+'_形象展示_'+match[2]+'_'+variant,'旧模特'+match[1].toUpperCase()+'展示图；甲乙只是目录代号，不是姓名','历史未引用'];
  }
  if(folder==='spatial') return ['03_历史作品集/07_空间设计','空间设计_项目'+stem+'_展示图_'+variant,'旧空间设计项目展示；真实项目名未提供','历史未引用'];
  throw new Error('未分类：'+file);
}
const hash = data=>crypto.createHash('sha256').update(data).digest('hex');
const escape = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href = p=>p.split('/').map(encodeURIComponent).join('/');
const destinations = new Set();
const manifest = [];
let copied=0, unchanged=0;
for(const row of rows) {
  const [group,name,purpose,status]=classify(row.source);
  const relative=group+'/'+clean(name)+path.extname(row.source);
  const source=path.resolve(sourceRoot,row.source), target=path.resolve(copyRoot,relative);
  if(!source.startsWith(sourceRoot+path.sep)||!target.startsWith(copyRoot+path.sep)) throw new Error('目录边界不合法');
  if(destinations.has(target)) throw new Error('中文命名冲突：'+relative);
  destinations.add(target);
  const original=await fs.readFile(source), checksum=hash(original);
  await fs.mkdir(path.dirname(target),{recursive:true});
  try { await fs.copyFile(source,target,fs.constants.COPYFILE_EXCL); copied++; }
  catch(error) {
    if(error.code!=='EEXIST') throw error;
    if(hash(await fs.readFile(target))!==checksum) throw new Error('已有副本被修改，停止覆盖：'+relative);
    unchanged++;
  }
  if(hash(await fs.readFile(target))!==checksum) throw new Error('副本校验失败：'+relative);
  manifest.push({...row,group,name,purpose,status,copy:'中文功能分区/'+relative,bytes:original.length,sha256:checksum});
}
manifest.sort((a,b)=>a.copy.localeCompare(b.copy,'zh-CN',{numeric:true}));
await fs.writeFile(path.join(outputRoot,'中文功能映射.json'),JSON.stringify(manifest,null,2));
const groups=[...new Set(manifest.map(row=>row.group))];
const overview=groups.map(group=>({group,count:manifest.filter(row=>row.group===group).length}));
const md=['# 889 张图片 · 中文功能命名清单','','这是用途与目录命名，不是对每张画面的内容鉴定。保留全部原文件及网页引用，只生成独立副本。桌面/移动版本来自原项目配置，不能据此认定两者逐像素一致。','',
'## 分区总览','','| 分区 | 数量 |','| --- | ---: |',...overview.map(g=>'| '+g.group+' | '+g.count+' |'),''];
for(const group of groups) {
  md.push('## '+group,'','| 中文名称 | 功能 | 尺寸 | 状态 | 原文件 |','| --- | --- | --- | --- | --- |');
  for(const row of manifest.filter(row=>row.group===group)) md.push('| ['+row.name+']('+href(row.copy)+') | '+row.purpose+' | '+row.width+' × '+row.height+' | '+row.status+' | '+row.source+' |');
  md.push('');
}
await fs.writeFile(path.join(outputRoot,'中文功能命名清单.md'),md.join('\n'));
const cards=manifest.map(row=>'<article data-group="'+escape(row.group)+'" data-search="'+escape([row.name,row.purpose,row.source,row.group].join(' '))+'"><a href="'+href(row.copy)+'" target="_blank" rel="noopener"><img src="'+href(row.copy)+'" alt="'+escape(row.name)+'" loading="lazy" width="240" height="170"></a><div><small>'+escape(row.group)+'</small><h2>'+escape(row.name)+'</h2><p>'+escape(row.purpose)+'</p><p>'+row.width+' × '+row.height+' · '+(row.bytes/1024).toFixed(0)+' KiB · '+escape(row.status)+'</p><code>'+escape(row.source)+'</code></div></article>').join('\n');
const html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>图片功能索引 · 绘屿造物</title><style>body{margin:0;background:#edf2ed;color:#173f3a;font:15px/1.6 system-ui,sans-serif}header{padding:32px max(24px,5vw);border-bottom:1px solid #bdcec6}h1{margin:0;font-size:30px}header p{max-width:900px}.filters{display:flex;gap:12px;flex-wrap:wrap;padding-top:12px}input,select{min-height:44px;padding:0 12px;border:1px solid #839d91;background:white;color:#173f3a;border-radius:4px;max-width:100%;box-sizing:border-box}input{min-width:min(300px,90vw)}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;padding:28px max(24px,5vw)}article{background:white;border:1px solid #c4d0c9;overflow:hidden;border-radius:6px}article[hidden]{display:none}article img{width:100%;height:170px;object-fit:contain;background:#e3e8e3}article>div{padding:16px}article h2{font-size:15px;overflow-wrap:anywhere}article p{font-size:12px}small,code{font-size:11px;overflow-wrap:anywhere}a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #9b783b;outline-offset:3px}</style><header><h1>图片功能索引</h1><p>889 张图片，按功能分区、中文命名。原文件和网页引用均保留。这里是本地素材管理索引，不是公开网站的新页面。图片名称依据已有用途和项目配置，不猜测未提供的画面名称。点击图片可查看原尺寸副本。</p><div class="filters"><label>搜索 <input id="search" placeholder="中文名、原文件名或功能"></label><label>分区 <select id="group"><option value="">全部分区</option>'+groups.map(g=>'<option>'+escape(g)+'</option>').join('')+'</select></label><span id="count" role="status">共 889 张</span></div></header><main>'+cards+'</main><script>const search=document.querySelector("#search"),group=document.querySelector("#group"),cards=[...document.querySelectorAll("article")];function filter(){let n=0;const q=search.value.trim().toLocaleLowerCase();for(const card of cards){const show=(!group.value||card.dataset.group===group.value)&&card.dataset.search.toLocaleLowerCase().includes(q);card.hidden=!show;if(show)n++;}document.querySelector("#count").textContent="当前 "+n+" / 889 张";}search.addEventListener("input",filter);group.addEventListener("change",filter);</script></html>';
await fs.writeFile(path.join(outputRoot,'图片功能索引.html'),html);
console.log(JSON.stringify({images:manifest.length,copied,unchanged,verified:manifest.length,groups:overview},null,2));
