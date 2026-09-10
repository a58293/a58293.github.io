import {useState, type MouseEvent} from 'react';
import {requiredImage, collectorPhotos, siteMedia} from './media-library';
import {currentFeaturedProduct} from './current-product-theme';
import {isPlainNavigation, flowerGods, flowerGodPath} from './flower-gods-catalog';
import {MobileActions} from './PurchaseMenu';
import './mobile-home.css';

export default function MobileHome({onOpenFlowerGods,onOpenFeatured}:{onOpenFlowerGods?:()=>void;onOpenFeatured?:()=>void}) {
  const [original,setOriginal]=useState(false);
  const follow=(action?:()=>void)=>(event:MouseEvent<HTMLAnchorElement>)=>{if(action&&isPlainNavigation(event)){event.preventDefault();action();}};
  const photos=collectorPhotos.map(id=>siteMedia[id]).filter(photo=>photo.src);
  return <div className="mh-page">
    <header className="mh-header"><a href="/" className="mh-brand"><img src={requiredImage('brandLogo')} alt="绘屿造物"/><span>LUMEN AURALIS<small>绘屿造物</small></span></a><MobileActions/></header>
    <main>
      <section className="mh-cover" aria-labelledby="mh-title">
        <div className="mh-heading"><p>花神卷 · 当期作品</p><h1 id="mh-title">循光，<br/>遇见花神。</h1><span>THE FLORAL DEITIES / 01</span></div>
        <figure className="mh-art"><img src={requiredImage(original?currentFeaturedProduct.conceptMedia:currentFeaturedProduct.physicalMedia)} alt={'镜昕 · '+(original?'角色原画':'实体全身造型')} fetchPriority="high" decoding="async" /></figure>
        <div className="mh-caption"><div><strong>镜昕</strong><span>荷花女神 · 原创 BJD</span></div><div className="mh-switch" aria-label="作品展示"><button aria-pressed={!original} onClick={()=>setOriginal(false)}>实体</button><button aria-pressed={original} onClick={()=>setOriginal(true)}>原画</button></div></div>
        <a className="mh-cta" href={currentFeaturedProduct.href} onClick={follow(onOpenFeatured)}>走近镜昕 <span>↗</span></a>
      </section>
      <section className="mh-volume" id="series"><div className="mh-section-heading"><span>01 / THE COLLECTION</span><h2>一卷花事，<br/>各有其神。</h2><p>以花为引，将想象塑成可珍藏的形体。</p></div><a className="mh-series-card" href="/series/flower-gods" onClick={follow(onOpenFlowerGods)} aria-label="浏览花神卷"><img src={requiredImage('homeSeries')} alt="花神卷：仙鹤与花卉卷轴" width="1024" height="1536" loading="lazy" decoding="async"/></a>
        <nav className="deity-roster" aria-label="选择花神">{flowerGods.map(deity=><a key={deity.slug} href={flowerGodPath(deity)} onClick={flowerGodPath(deity)===currentFeaturedProduct.href?follow(onOpenFeatured):undefined} aria-label={'进入'+deity.flower+deity.name+'详情'}><span className="deity-avatar"><img src={deity.image} alt="" loading="lazy"/></span><span>{deity.name}</span></a>)}{[1,2,3].map(index=><button key={index} disabled aria-label={'未公开花神 '+index}><span className="deity-avatar deity-placeholder">?</span><span>待揭晓</span></button>)}</nav>
      </section>
      <section className="mh-collectors" id="collectors"><span className="mh-eyebrow">02 / COLLECTORS' MOMENTS</span><h2>花开在你的日常。</h2>{photos.length?<div className="mh-photo-list">{photos.map(photo=><img key={photo.src} src={photo.src!} alt={photo.alt} loading="lazy"/>)}</div>:<p>等待第一份经授权的藏家影像。<br/>关于相遇的故事，将在这里慢慢展开。</p>}</section>
      <section className="mh-auth" id="verify"><span className="mh-eyebrow">03 / AUTHENTICITY</span><h2>珍藏有据，<br/>相遇有迹。</h2><p>凭娃证编号与淘宝订单号，<br/>查询作品的官方出品记录。</p><a href="/verify">进入防伪核验 <span>↗</span></a></section>
    </main>
    <footer className="mh-footer"><strong>LUMEN AURALIS</strong><p>绘屿造物 · 原创球形关节人偶</p><a href="tel:19988424290">客服 19988424290</a><small>工作日 10:00—17:00</small><div><a href="/legal/terms">网站条款</a><a href="/legal/authenticity">防伪说明</a></div></footer>
  </div>;
}
