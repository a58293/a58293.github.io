import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {flowerGods, flowerGodPath} from './flower-gods-catalog';
import {currentFeaturedProduct} from './current-product-theme';
import {productPurchaseUrl} from './commerce';
import {orderPurchaseProducts} from './purchase-order';
import SiteSearch from './SiteSearch';
import './purchase-menu.css';

const featuredSlug = currentFeaturedProduct.href.split('/').pop()!;
const products = flowerGods.map(deity => ({...deity, releaseOrder:Number(deity.number)}));

export default function PurchaseMenu({currentSlug, label='购买', className=''}:{currentSlug?:string;label?:string;className?:string}) {
  const [open,setOpen]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    dialog.current?.showModal();
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=overflow;trigger.current?.focus();};
  },[open]);
  const ordered=orderPurchaseProducts(products,featuredSlug,currentSlug);
  return <><button ref={trigger} type="button" className={'purchase-trigger '+className} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}>{label}</button>
    {open&&createPortal(<dialog className="purchase-dialog" ref={dialog} aria-labelledby="purchase-title" onCancel={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <div className="purchase-sheet"><header><div><small>LUMEN AURALIS</small><h2 id="purchase-title">选购作品</h2></div><button type="button" aria-label="关闭购买窗口" onClick={()=>setOpen(false)}>×</button></header>
      <p>通过淘宝查看商品与购买。</p><ul>{ordered.map(product=>{const featured=product.slug===featuredSlug;const url=productPurchaseUrl(product.slug,featured);return <li key={product.slug} data-product={product.slug}>
        <span className="deity-avatar"><img src={product.image} alt=""/></span><div><h3>{product.name}<small>{product.slug===currentSlug?'当前浏览':featured?'当期主推':''}</small></h3><p>{product.flower}</p><a className="purchase-detail" href={flowerGodPath(product)}>查看详情</a></div>
        {url?<a className="purchase-outbound" href={url} target="_blank" rel="noopener noreferrer">去淘宝 ↗</a>:<span className="purchase-unavailable">购买链接待公布</span>}
      </li>;})}</ul><footer>请在淘宝确认价格、配置与发货时间。</footer></div>
    </dialog>,document.body)}
  </>;
}

export function MobileActions({currentSlug}:{currentSlug?:string}) {
  return <div className="mobile-actions"><SiteSearch tone="dark"/><a href="/verify">防伪</a><PurchaseMenu currentSlug={currentSlug}/></div>;
}
