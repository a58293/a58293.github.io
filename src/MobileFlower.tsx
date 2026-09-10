import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {requiredImage, detailImage, type MediaId} from './media-library';
import {VerificationConsole} from './VerifyPage';
import {MobileActions} from './PurchaseMenu';
import './mobile-flower.css';

type Item = {key: string; title: string; position: string; scale: number; description: string};
type Props = {details: Item[]; pieces: Item[]; onBack?: () => void};
const detailIds: Record<string, MediaId> = {face:'detailFace', headdress:'detailHeaddress', ornament:'detailOrnament', dress:'detailDress'};
const pieceIds: Record<string, MediaId> = {veil:'pieceVeil', cape:'pieceCape', waist:'pieceWaist', skirt:'pieceSkirt', train:'pieceTrain'};

function ImageViewer({src, onClose}: {src: string; onClose: () => void}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x:0, y:0});
  const points = useRef(new Map<number, {x:number; y:number}>());
  const previous = useRef({distance:0, x:0, y:0});
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const buttons = Array.from(closeRef.current?.parentElement?.querySelectorAll('button') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', key); focused?.focus(); };
  }, [onClose]);
  const measure = () => {
    const list = [...points.current.values()];
    return {x:list.reduce((s,p)=>s+p.x,0)/list.length, y:list.reduce((s,p)=>s+p.y,0)/list.length,
      distance:list.length===2 ? Math.hypot(list[0].x-list[1].x,list[0].y-list[1].y) : 0};
  };
  return createPortal(<div className="mf-viewer" role="dialog" aria-modal="true" aria-label="全屏查看造型">
    <div className="mf-viewer-tools"><button ref={closeRef} onClick={onClose}>关闭 ×</button><button onClick={()=>{setScale(1);setOffset({x:0,y:0});}}>重置</button><button onClick={()=>setScale(s=>Math.min(5,s+.5))}>放大 ＋</button></div>
    <div className="mf-viewer-image" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});previous.current=measure();}}
      onPointerMove={e=>{if(!points.current.has(e.pointerId))return;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=measure();const old=previous.current;if(next.distance&&old.distance)setScale(s=>Math.max(1,Math.min(5,s*next.distance/old.distance)));if(scale>1)setOffset(p=>({x:Math.max(-innerWidth*2,Math.min(innerWidth*2,p.x+next.x-old.x)),y:Math.max(-innerHeight*2,Math.min(innerHeight*2,p.y+next.y-old.y))}));previous.current=next;}}
      onPointerUp={e=>{points.current.delete(e.pointerId);previous.current=measure();}} onPointerCancel={()=>points.current.clear()}>
      <img src={src} alt="镜昕造型高清细节" draggable={false} style={{transform:`translate(${offset.x}px, ${offset.y}px) scale(${scale})`}} />
    </div><p>双指缩放 · 放大后单指拖动</p>
  </div>, document.body);
}

export default function MobileFlower({details, pieces, onBack}:Props) {
  const [mode,setMode]=useState<'physical'|'original'>('physical');
  const [detail,setDetail]=useState(0);
  const [piece,setPiece]=useState(-1);
  const [viewer,setViewer]=useState(false);
  const [section,setSection]=useState('intro');
  const root=useRef<HTMLElement>(null);
  const item=detail===3&&piece>=0?pieces[piece]:details[detail];
  const media=detailImage(detail===3&&piece>=0?pieceIds[item.key]:detailIds[item.key],item.position,item.scale);
  useEffect(()=>{
    document.body.classList.add('mobile-reading');
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)setSection(entry.target.id);},{rootMargin:'-15% 0px -65% 0px'});
    root.current?.querySelectorAll('section[id]').forEach(node=>observer.observe(node));
    return()=>{observer.disconnect();document.body.classList.remove('mobile-reading');};
  },[]);
  return <main className="mf-page" ref={root}>
    <header className="mf-header"><a href="/series/flower-gods" onClick={e=>{if(onBack){e.preventDefault();onBack();}}}>← 花神卷</a><MobileActions currentSlug="jingxin"/></header>
    <nav className="mf-nav" aria-label="角色内容">{[['intro','角色介绍'],['detail','造型细节'],['info','产品信息'],['auth','防伪核验']].map(([id,label])=><a key={id} href={'#'+id} aria-current={section===id?'location':undefined}>{label}</a>)}</nav>
    <section id="intro" className="mf-intro"><p className="mf-kicker">花神卷 · 原典 01</p><h1>镜昕 <small>荷花女神</small></h1><p>循着花与光的轨迹，走近镜昕。</p>
      <div className="mf-options" aria-label="展示方式">{(['original','physical'] as const).map(value=><button key={value} aria-pressed={mode===value} onClick={()=>setMode(value)}>{value==='original'?'原画':'实体'}</button>)}</div>
      <img className="mf-portrait" src={requiredImage(mode==='physical'?'jingxinPortrait':'jingxinConcept')} alt={'镜昕'+(mode==='physical'?'实体全身':'原画')} />
      <a className="mf-primary" href="#detail">查看造型细节 <span>↓</span></a>
    </section>
    <section id="detail"><p className="mf-kicker">FORM & DETAIL</p><h2>造型细节</h2><p>选择部位，点开图片可放大查看。</p>
      <div className="mf-options" aria-label="造型部位">{details.map((value,index)=><button key={value.key} aria-pressed={detail===index} onClick={()=>{setDetail(index);setPiece(-1);}}>{value.title}</button>)}</div>
      {detail===3&&<div className="mf-options mf-pieces" aria-label="衣装部件"><button aria-pressed={piece===-1} onClick={()=>setPiece(-1)}>全套上身</button>{pieces.map((value,index)=><button key={value.key} aria-pressed={piece===index} onClick={()=>setPiece(index)}>{value.title}</button>)}</div>}
      <button className="mf-detail-image" aria-label={'放大查看'+item.title} onClick={()=>setViewer(true)}><img src={media.src} alt={item.title} style={{transform:`scale(${media.scale})`,transformOrigin:media.position}}/><span>放大查看 ＋</span></button>
      <h3>{item.title}</h3><p>{item.description}</p>
    </section>
    <section id="info"><p className="mf-kicker">PRODUCT NOTES</p><h2>产品信息</h2><dl><div><dt>尺寸规格</dt><dd>70 · 3分</dd></div><div><dt>制作周期</dt><dd>约 90 个工作日</dd></div><div><dt>保养与售后</dt><dd>详细说明待公布，可先咨询客服</dd></div></dl><p>客服 19988424290<br/>工作日 10:00—17:00</p></section>
    <section id="auth" className="mf-auth"><p className="mf-kicker">OFFICIAL VERIFICATION</p><h2>防伪核验</h2><p>请准备娃证编号与购买时的淘宝订单号。</p><VerificationConsole /></section>
    <footer className="mf-footer">绘屿造物 · LUMEN AURALIS</footer>
    {viewer&&<ImageViewer src={media.src} onClose={()=>setViewer(false)} />}
  </main>;
}
