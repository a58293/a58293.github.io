import { useCallback, useEffect, useRef, useState } from "react";
import { SplitColorText } from "./components/HoverColorText";
import { CinematicParticlePortrait } from "./CinematicParticlePortrait";
import { isPlainNavigation } from "./flower-gods-catalog";
import { currentFeaturedProduct, currentProductTheme, currentProductThemeStyle } from "./current-product-theme";
import { requiredImage, siteMedia, collectorPhotos } from "./media-library";
import SeriesScrolls from "./SeriesScrolls";
import SiteSearch from './SiteSearch';
import { commerce } from './commerce';
import "./bjd.css";
import "./brand-home-redesign.css";
import "./home-chapter-experience.css";
import "./home-verification-card.css";
import "./home-featured-hero.css";
import './soft-ui.css';

const officialLogo = requiredImage('brandLogo');

const homeChapters = [
  { id: "top", label: "序章", en: "HOME" },
  { id: "series", label: "系列", en: "COLLECTIONS" },
  { id: "collectors", label: "藏家", en: "MOMENTS" },
  { id: "verify", label: "核验", en: "AUTHENTICITY" },
];

type HomeNavigationProps = {
  activeChapter: number;
  onNavigate: (index: number) => void;
  onOpenFeatured?: () => void;
};

function Header({ activeChapter, onNavigate, onOpenFeatured }: HomeNavigationProps) {
  const chapterLink = (index: number) => ({
    href: `#${homeChapters[index].id}`,
    className: activeChapter === index ? "is-active" : undefined,
    "aria-current": activeChapter === index ? "page" as const : undefined,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      onNavigate(index);
    },
  });

  return (
    <header className="site-header">
      <a {...chapterLink(0)} className={`brand${activeChapter === 0 ? " is-active" : ""}`} aria-label="返回首页序章">
        <span className="brand-mark"><img className="brand-logo-image" src={officialLogo} alt="" /></span>
        <span><strong><SplitColorText text="LUMEN AURALIS" /></strong><small>绘屿造物</small></span>
      </a>
      <nav aria-label="主导航">
        <a {...chapterLink(1)}><SplitColorText text="系列" /></a>
        <a href={currentFeaturedProduct.href} onClick={event => {
          if (!onOpenFeatured || !isPlainNavigation(event)) return;
          event.preventDefault(); onOpenFeatured();
        }}><SplitColorText text="当期主推" /></a>
        <a {...chapterLink(2)}><SplitColorText text="藏家返图" /></a>
        <SiteSearch tone="dark" />
        <a className="nav-verify" href="/verify"><SplitColorText text="防伪核验" /><span>↗</span></a>
      </nav>
    </header>
  );
}

function Hero({ onExplore, onOpenFeatured, active }: { onExplore: () => void; onOpenFeatured?: () => void; active: boolean }) {
  const [displayMode, setDisplayMode] = useState<'physical' | 'concept'>('physical');
  const [particlePlayed, setParticlePlayed] = useState(false);
  const featured = currentFeaturedProduct;
  const isPhysical = displayMode === 'physical';
  const animatePhysical = active && isPhysical && !particlePlayed;
  const markParticlePlayed = useCallback(() => setParticlePlayed(true), []);
  return (
    <section className="hero home-featured-hero" id="top" data-display-mode={displayMode}>
      <div className="hero-aura" aria-hidden="true" />
      <div className="hero-copy reveal">
        <p className="eyebrow home-current-up">当期主推 · {featured.name}<span>CURRENT FEATURE</span></p>
        <h1><span className="hero-line"><SplitColorText text="在一粒光里" /></span><span className="hero-line hero-line-second"><SplitColorText text="遇见花神" /></span></h1>
        <p className="hero-intro">绘屿造物原创球形关节人偶档案。循着花与光的轨迹，进入每一位神灵独有的故事。</p>
        <div className="hero-actions">
          <a className="primary-button home-featured-entry" href={featured.href} onClick={event => {
            if (!onOpenFeatured || !isPlainNavigation(event)) return;
            event.preventDefault(); onOpenFeatured();
          }}><span>走进{featured.name}<small>当期主推 · {featured.flower}</small></span><b aria-hidden="true">↗</b></a>
          <a className="home-explore-entry" href="#series" onClick={(event) => { if (!isPlainNavigation(event)) return; event.preventDefault(); onExplore(); }}>探索系列 <span aria-hidden="true">↗</span></a>
          <a className="home-verify-button" href="/verify">
            <span>防伪验证</span>
            <small>当前为演示预览</small>
            <b aria-hidden="true">↗</b>
          </a>
          {commerce.featuredProductUrl || commerce.shopUrl
            ? <a className="home-shop-button" href={commerce.featuredProductUrl || commerce.shopUrl!} target="_blank" rel="noopener noreferrer">前往淘宝 <span aria-hidden="true">↗</span></a>
            : <span className="home-shop-button is-pending" aria-disabled="true">淘宝店铺整理中</span>}
        </div>
      </div>
      <div className="hero-figure reveal">
        <div className="home-featured-art" id="home-featured-art" role="region" aria-label={`${featured.name}形象展示`}>
          {isPhysical && animatePhysical
            ? <CinematicParticlePortrait active src={requiredImage(featured.physicalMedia)} alt={`${featured.flower}${featured.name} · 实体展示`} onComplete={markParticlePlayed} />
            : <img key={displayMode} src={requiredImage(isPhysical ? featured.physicalMedia : featured.conceptMedia)} alt={`${featured.flower}${featured.name} · ${isPhysical ? '实体展示' : '2D 原画'}`} decoding="async" fetchPriority="high" />}
        </div>
        <div className="home-featured-toolbar">
          <p className="home-featured-caption" aria-live="polite">{featured.name}<small>{isPhysical ? '实体展示' : '2D 原画'}</small></p>
          <div className="home-display-switch" role="group" aria-label="首页角色展示方式">
            <button type="button" aria-pressed={isPhysical} aria-controls="home-featured-art" onClick={() => setDisplayMode('physical')}>实体</button>
            <button type="button" aria-pressed={!isPhysical} aria-controls="home-featured-art" onClick={() => setDisplayMode('concept')}>2D 原画</button>
          </div>
        </div>
      </div>
    </section>
  );
}

type BjdAppProps = {
  onOpenFlowerGods?: () => void;
  onOpenFeatured?: () => void;
};

function CollectorPreview() {
  const placeholders = ["等待第一束光", "等待第一场花事", "等待第一位藏家"];
  return (
    <section className="section collectors-section" id="collectors">
      <div className="section-heading reveal"><p className="eyebrow">COLLECTORS' MOMENTS</p><h2><SplitColorText text="藏家返图" /></h2><p>来自活动征集并经授权发布的收藏瞬间，由后台精选、整理与呈现。</p></div>
      <div className="collector-grid reveal">
        {placeholders.map((text, index) => {
          const photo=siteMedia[collectorPhotos[index]];
          return <div className={`collector-placeholder collector-${index + 1}${photo.src ? ' has-photo' : ''}`} key={text}>
            {photo.src && <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />}
            <span>0{index + 1}</span><p>{photo.src ? photo.alt : text}</p>
          </div>;
        })}
      </div>
      <p className="collector-note">{collectorPhotos.some(id=>siteMedia[id].src) ? '藏家摄影经授权收录，由绘屿造物精选呈现' : '首批活动返图将在获得授权后由绘屿造物发布'}</p>
    </section>
  );
}

function VerifyPreview() {
  return (
    <section className="verify-section" id="verify">
      <div className="verify-lotus" aria-hidden="true"><span className="petal petal-one" /><span className="petal petal-two" /><span className="petal petal-three" /><span className="petal petal-four" /><span className="petal petal-five" /></div>
      <div className="verify-copy reveal">
        <p className="eyebrow">CERTIFICATE OF AUTHENTICITY</p><h2><SplitColorText text="让每一份相遇，都有迹可循" /></h2>
        <p>正式核验暂未开放。目前仅提供虚构样例的界面演示，请勿填写真实娃证或订单信息。</p>
        <a className="light-button home-verify-primary" href="/verify" aria-label="进入防伪核验，当前为演示预览">
          <div className="lookup-card-heading">
            <img src={officialLogo} alt="" width="42" height="49" />
            <span>核验前，请准备<small>BEFORE YOUR LOOKUP</small></span>
          </div>
          <div className="lookup-card-credentials">
            <div><span>01</span><p>娃证编号<small>查看随娃附赠的实体娃证</small></p></div>
            <div><span>02</span><p>淘宝订单号<small>查看购买时的订单详情</small></p></div>
          </div>
          <div className="lookup-card-action">
            <span>进入防伪核验<small>OFFICIAL LOOKUP</small></span>
            <span className="lookup-card-arrow" aria-hidden="true">↗</span>
          </div>
          <span className="lookup-card-note">当前为演示预览，请勿填写真实订单</span>
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="home-footer">
      <p className="home-footer-summary">绘屿造物 · 客服 19988424290 · 工作日 10:00—17:00</p>
      <p className="home-footer-copyright">© 2026 LUMEN AURALIS · <a href="/legal/terms">网站条款</a> · <a href="/legal/authenticity">防伪说明</a></p>
    </footer>
  );
}

export default function BjdApp({ onOpenFlowerGods, onOpenFeatured }: BjdAppProps) {
  const initialChapter = Math.max(0, homeChapters.findIndex((chapter) => `#${chapter.id}` === window.location.hash));
  const [activeChapter, setActiveChapter] = useState(initialChapter);
  const activeChapterRef = useRef(initialChapter);
  const wheelDeltaRef = useRef(0);
  const wheelResetRef = useRef(0);
  const lastWheelAtRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const homeRef = useRef<HTMLDivElement>(null);

  const goToChapter = useCallback((index: number) => {
    const target = Math.max(0, Math.min(homeChapters.length - 1, index));
    if (target === activeChapterRef.current) return;
    activeChapterRef.current = target;
    setActiveChapter(target);
    const hash = target === 0 ? "" : `#${homeChapters[target].id}`;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
  }, []);

  useEffect(() => {
    const syncChapter = () => {
      const index = Math.max(0, homeChapters.findIndex(chapter => `#${chapter.id}` === window.location.hash));
      activeChapterRef.current = index;
      setActiveChapter(index);
    };
    window.addEventListener("hashchange", syncChapter);
    window.addEventListener("popstate", syncChapter);
    return () => {
      window.removeEventListener("hashchange", syncChapter);
      window.removeEventListener("popstate", syncChapter);
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("home-experience-active");
    return () => document.body.classList.remove("home-experience-active");
  }, []);

  useEffect(() => {
    const root = homeRef.current;
    if (!root) return;

    const scrollSurface = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>('[data-home-scroll]') : null;
    const canScroll = (surface: HTMLElement | null, delta: number) => !!surface && (
      delta > 0 ? surface.scrollTop + surface.clientHeight < surface.scrollHeight - 2 : surface.scrollTop > 2
    );

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || canScroll(scrollSurface(event.target), event.deltaY)) return;
      event.preventDefault();
      wheelDeltaRef.current += event.deltaY;
      window.clearTimeout(wheelResetRef.current);
      wheelResetRef.current = window.setTimeout(() => { wheelDeltaRef.current = 0; }, 140);
      const now = performance.now();
      if (Math.abs(wheelDeltaRef.current) < 38 || now - lastWheelAtRef.current < 260) return;
      const direction = wheelDeltaRef.current > 0 ? 1 : -1;
      wheelDeltaRef.current = 0;
      lastWheelAtRef.current = now;
      goToChapter(activeChapterRef.current + direction);
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (touchStartYRef.current === null) return;
      const delta = touchStartYRef.current - (event.changedTouches[0]?.clientY ?? touchStartYRef.current);
      touchStartYRef.current = null;
      if (scrollSurface(event.target)?.scrollHeight > scrollSurface(event.target)?.clientHeight + 2) return;
      if (Math.abs(delta) > 44) goToChapter(activeChapterRef.current + (delta > 0 ? 1 : -1));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"], [role="tablist"]')) return;
      if (["ArrowDown", "PageDown", "ArrowUp", "PageUp"].includes(event.key) && canScroll(scrollSurface(event.target), ["ArrowDown", "PageDown"].includes(event.key) ? 1 : -1)) return;
      if (["ArrowDown", "ArrowRight", "PageDown"].includes(event.key)) {
        event.preventDefault();
        goToChapter(activeChapterRef.current + 1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToChapter(activeChapterRef.current - 1);
      }
    };

    root.addEventListener("wheel", handleWheel, { passive: false });
    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    root.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      root.removeEventListener("wheel", handleWheel);
      root.removeEventListener("touchstart", handleTouchStart);
      root.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(wheelResetRef.current);
    };
  }, [goToChapter]);

  const chapterState = (index: number) => index === activeChapter ? "active" : index < activeChapter ? "past" : "future";

  return (
    <div className="home-experience" ref={homeRef} data-home-chapter={homeChapters[activeChapter].id} data-product-theme={currentProductTheme.product} style={currentProductThemeStyle}>
      <div className="site-shell">
        <Header activeChapter={activeChapter} onNavigate={goToChapter} onOpenFeatured={onOpenFeatured} />
        <main className="home-stage">
          <div className="home-chapter" data-state={chapterState(0)} aria-hidden={activeChapter !== 0}><Hero active={activeChapter === 0} onExplore={() => goToChapter(1)} onOpenFeatured={onOpenFeatured} /></div>
          <div className="home-chapter" data-state={chapterState(1)} aria-hidden={activeChapter !== 1}><SeriesScrolls onOpenFlowerGods={onOpenFlowerGods} /></div>
          <div className="home-chapter" data-state={chapterState(2)} aria-hidden={activeChapter !== 2}><CollectorPreview /></div>
          <div className="home-chapter home-chapter-final" data-state={chapterState(3)} aria-hidden={activeChapter !== 3}><VerifyPreview /><Footer /></div>
        </main>

        <nav className="home-pagination" aria-label="首页章节">
          <span className="home-pagination-line"><i style={{ transform: `scaleX(${(activeChapter + 1) / homeChapters.length})` }} /></span>
          {homeChapters.map((chapter, index) => (
            <button
              type="button"
              key={chapter.id}
              className={activeChapter === index ? "is-active" : ""}
              aria-current={activeChapter === index ? "step" : undefined}
              aria-label={`前往${chapter.label}`}
              onClick={() => goToChapter(index)}
            >
              <span>0{index + 1}</span><b>{chapter.label}<small>{chapter.en}</small></b>
            </button>
          ))}
        </nav>

        <div className="home-scene-caption" aria-live="polite">
          <span>0{activeChapter + 1}</span><i /><p>{homeChapters[activeChapter].label}</p><small>{homeChapters[activeChapter].en}</small>
        </div>
      </div>
    </div>
  );
}
