import { useEffect, useMemo, useRef, useState } from 'react';
import { flowerGodPath, flowerGods } from './flower-gods-catalog';
import './site-search.css';

const fixedEntries = [
  { title: '品牌首页', subtitle: '当期主推、系列与藏家返图', href: '/', keywords: '首页 当期 up 主推 实体 2d' },
  { title: '花神卷', subtitle: '选择并探索花神', href: '/series/flower-gods', keywords: '系列 花神 选择 云海' },
  { title: '防伪核验', subtitle: '娃证与订单双重核对', href: '/verify', keywords: '验证 真伪 娃证 淘宝 订单' },
  { title: '防伪服务说明', subtitle: '查询范围与结果说明', href: '/legal/authenticity', keywords: '验证 防伪 说明' },
];

const searchEntries = [
  ...fixedEntries,
  ...flowerGods.map(deity => ({
    title: deity.name,
    subtitle: `${deity.flower} · ${deity.englishName}`,
    href: flowerGodPath(deity),
    keywords: `${deity.flower} ${deity.description} 角色 原画 实体 造型细节`,
  })),
];

export default function SiteSearch({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return searchEntries;
    return searchEntries.filter(entry => `${entry.title} ${entry.subtitle} ${entry.keywords}`.toLocaleLowerCase().includes(term));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return <>
    <button className="site-search-trigger" data-tone={tone} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
      <span aria-hidden="true">⌕</span><b>搜索</b>
    </button>
    {open && <div className="site-search-layer" role="dialog" aria-modal="true" aria-label="站内搜索" onMouseDown={event => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="site-search-panel">
        <header><p>SEARCH · LUMEN AURALIS</p><button type="button" onClick={() => setOpen(false)} aria-label="关闭搜索">×</button></header>
        <label className="site-search-field">
          <span aria-hidden="true">⌕</span>
          <input ref={inputRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索系列、花神或服务" autoComplete="off" />
        </label>
        <div className="site-search-results" role="list" aria-live="polite">
          {results.length ? results.map(entry => <a role="listitem" href={entry.href} key={entry.href} onClick={() => setOpen(false)}>
            <span><strong>{entry.title}</strong><small>{entry.subtitle}</small></span><b aria-hidden="true">↗</b>
          </a>) : <p className="site-search-empty">暂时没有找到相关内容</p>}
        </div>
      </section>
    </div>}
  </>;
}
