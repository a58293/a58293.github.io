import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { SplitColorText } from "./components/HoverColorText";
import { CinematicParticlePortrait } from "./CinematicParticlePortrait";
import SiteSearch from './SiteSearch';
import { TransparentGoddess } from "./TransparentGoddess";
import { FLOWER_GODS_PATH, isPlainNavigation } from "./flower-gods-catalog";
import { requiredImage, detailImage, siteMedia, officialPhotos, type MediaId } from './media-library';
import { commerce } from './commerce';
import MobileFlower from './MobileFlower';
import PurchaseMenu from './PurchaseMenu';
import "./flower-gods-experience.css";
import "./flower-gods-refined.css";
import "./cinematic-particle.css";
import "./immersive-layout.css";

import "./side-transition.css";
import "./readable-typography.css";
import "./costume-showcase.css";
import "./costume-stage-redesign.css";
import "./global-type-safety.css";
import "./detail-ui-rework.css";
import "./experience-final-polish.css";
import "./museum-exhibit-layout.css";
import "./detail-hover-lens.css";
import "./detail-proportion-rebalance.css";
import "./flower-gods-content-restructure.css";
import './soft-ui.css';
import './mobile-ux-redesign.css';
const goddessImage = requiredImage('jingxinPortrait');
const originalArtwork = requiredImage('jingxinConcept');
const officialLogo = requiredImage('brandLogo');
const lotusReliefArtwork = requiredImage('lotusRelief');
const detailMedia: Record<string, MediaId> = {face:'detailFace', headdress:'detailHeaddress', ornament:'detailOrnament', dress:'detailDress'};
const pieceMedia: Record<string, MediaId> = {veil:'pieceVeil', cape:'pieceCape', waist:'pieceWaist', skirt:'pieceSkirt', train:'pieceTrain'};

const chapters = [
  { id: "prologue", label: "登场", en: "INTRO", background: "#f7f6f1", ink: "#0f4841", muted: "#52766e", glow: "#c7ddd6" },
  { id: "details", label: "细节", en: "DETAILS", background: "#f5f3ed", ink: "#183f3b", muted: "#5d706a", glow: "#c8ddd6" },
  { id: "becoming", label: "官图", en: "GALLERY", background: "#f0f2ee", ink: "#173f3a", muted: "#527169", glow: "#cbded7" },
  { id: "verification", label: "核验", en: "AUTHENTICITY", background: "#deebe5", ink: "#0f443e", muted: "#4b7067", glow: "#f8f7f1" },
];

const detailItems = [
  { key: "face", number: "01", title: "妆面", en: "FACEUP", position: "50% 13%", scale: 2.7, description: "面部妆效与眉眼层次展示。" },
  { key: "headdress", number: "02", title: "头饰", en: "HEADDRESS", position: "50% 5%", scale: 2.45, description: "花冠、头纱与固定结构展示。" },
  { key: "ornament", number: "03", title: "饰件", en: "ORNAMENT", position: "50% 38%", scale: 2.05, description: "颈饰、胸饰与垂坠组件展示。" },
  { key: "dress", number: "04", title: "衣装", en: "COSTUME", position: "50% 83%", scale: 1.45, description: "外层薄纱、刺绣与裙摆结构展示。" },
];

const garmentPieces = [
  { key: "veil", number: "01", title: "头纱", en: "VEIL", position: "50% 7%", scale: 2.55, description: "花饰、薄纱与发间层次。" },
  { key: "cape", number: "02", title: "荷叶披肩", en: "LOTUS CAPE", position: "50% 25%", scale: 2.05, description: "荷叶形制与透明叠层结构。" },
  { key: "waist", number: "03", title: "腰间饰件", en: "WAIST ORNAMENT", position: "50% 44%", scale: 2.35, description: "珠饰、系带与垂坠关系。" },
  { key: "skirt", number: "04", title: "绣纹外裙", en: "EMBROIDERED SKIRT", position: "50% 70%", scale: 1.72, description: "刺绣纹样、薄纱与裙身层次。" },
  { key: "train", number: "05", title: "拖尾薄纱", en: "TRAILING VEIL", position: "50% 91%", scale: 1.52, description: "拖尾轮廓与轻薄垂坠感。" },
];

type ExperienceStyle = CSSProperties & Record<`--${string}`, string | number>;

type FlowerGodsExperienceProps = {
  onBackCollection?: () => void;
};

export default function FlowerGodsExperience({ onBackCollection }: FlowerGodsExperienceProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [portraitMode, setPortraitMode] = useState<"original" | "physical">("physical");
  const [activeDetail, setActiveDetail] = useState(0);
  const [lensMagnification, setLensMagnification] = useState(2.1);
  const [costumeView, setCostumeView] = useState<"complete" | "pieces">("complete");
  const [activeGarmentPiece, setActiveGarmentPiece] = useState(0);
  const [productInfoOpen, setProductInfoOpen] = useState(false);
  const [detailZoom, setDetailZoom] = useState({
    x: 50, y: 48, lensX: 68, lensY: 66,
    sourceX: 0, sourceY: 0, sourceWidth: 1, sourceHeight: 1,
  });
  const [detailLensActive, setDetailLensActive] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "out" | "in">("idle");
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const activeChapterRef = useRef(0);
  const targetChapterRef = useRef(0);
  const transitionInProgressRef = useRef(false);
  const transitionTimersRef = useRef<number[]>([]);
  const wheelDeltaRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchBlockedRef = useRef(false);
  const touchBoundaryRef = useRef({up: false, down: false});
  const theme = chapters[activeChapter];
  const lightweightArtwork = window.matchMedia('(max-width: 700px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches;

  const goToChapter = useCallback((index: number) => {
    const targetIndex = Math.max(0, Math.min(chapters.length - 1, index));

    if (
      targetIndex === targetChapterRef.current &&
      (transitionInProgressRef.current || targetIndex === activeChapterRef.current)
    ) return;

    const direction = targetIndex > targetChapterRef.current ? "forward" : "backward";
    targetChapterRef.current = targetIndex;
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      activeChapterRef.current = targetIndex;
      setActiveChapter(targetIndex);
      setTransitionPhase("idle");
      transitionInProgressRef.current = false;
      return;
    }

    setTransitionDirection(direction);

    if (transitionInProgressRef.current) {
      activeChapterRef.current = targetIndex;
      setActiveChapter(targetIndex);
      setTransitionPhase("in");
      const interruptedEnterTimer = window.setTimeout(() => {
        setTransitionPhase("idle");
        transitionInProgressRef.current = false;
        targetChapterRef.current = activeChapterRef.current;
      }, 980);
      transitionTimersRef.current.push(interruptedEnterTimer);
      return;
    }

    transitionInProgressRef.current = true;
    setTransitionPhase("out");
    const exitTimer = window.setTimeout(() => {
      const latestTarget = targetChapterRef.current;
      activeChapterRef.current = latestTarget;
      setActiveChapter(latestTarget);
      setTransitionPhase("in");
    }, 480);
    const enterTimer = window.setTimeout(() => {
      setTransitionPhase("idle");
      transitionInProgressRef.current = false;
      targetChapterRef.current = activeChapterRef.current;
    }, 1450);
    transitionTimersRef.current.push(exitTimer, enterTimer);
  }, []);

  const updateDetailZoomFromPointer = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') {
      setDetailLensActive(false);
      return;
    }
    const eventTarget = event.target as HTMLElement;
    if (eventTarget.closest("button, input, .costume-mode-switch, .costume-piece-rail")) {
      setDetailLensActive(false);
      return;
    }
    const figureBounds = event.currentTarget.getBoundingClientRect();
    const imageWindow = event.currentTarget.querySelector<HTMLElement>(".detail-image-window");
    const imageBounds = imageWindow?.getBoundingClientRect() ?? figureBounds;
    const sourceX = event.clientX - imageBounds.left;
    const sourceY = event.clientY - imageBounds.top;
    if (sourceX < 0 || sourceY < 0 || sourceX > imageBounds.width || sourceY > imageBounds.height) {
      setDetailLensActive(false);
      return;
    }
    const x = (sourceX / Math.max(1, imageBounds.width)) * 100;
    const y = (sourceY / Math.max(1, imageBounds.height)) * 100;
    const safeX = Math.max(7, Math.min(93, x));
    const safeY = Math.max(8, Math.min(92, y));
    const lensDiameter = Math.max(154, Math.min(214, window.innerWidth * .15));
    const lensRadius = lensDiameter / 2;
    const offset = lensRadius + 34;
    const candidates = [
      { x: event.clientX + offset, y: event.clientY + offset * .72 },
      { x: event.clientX - offset, y: event.clientY + offset * .72 },
      { x: event.clientX + offset, y: event.clientY - offset * .72 },
      { x: event.clientX - offset, y: event.clientY - offset * .72 },
    ];
    const blockers = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(".detail-reading, .costume-mode-switch, .costume-piece-rail") ?? [],
    ).filter((element) => element.offsetParent !== null).map((element) => element.getBoundingClientRect());
    const fits = (candidate: { x: number; y: number }) => {
      const lensRect = { left: candidate.x - lensRadius, right: candidate.x + lensRadius, top: candidate.y - lensRadius, bottom: candidate.y + lensRadius };
      const insideFigure = lensRect.left >= figureBounds.left + 8 && lensRect.right <= figureBounds.right - 8
        && lensRect.top >= figureBounds.top + 8 && lensRect.bottom <= figureBounds.bottom - 8;
      const avoidsUi = blockers.every((blocker) => lensRect.right < blocker.left - 10 || lensRect.left > blocker.right + 10
        || lensRect.bottom < blocker.top - 10 || lensRect.top > blocker.bottom + 10);
      return insideFigure && avoidsUi;
    };
    const lensPoint = candidates.find(fits) ?? {
      x: Math.max(figureBounds.left + lensRadius + 10, Math.min(figureBounds.right - lensRadius - 10, event.clientX + offset)),
      y: Math.max(figureBounds.top + lensRadius + 10, Math.min(figureBounds.bottom - lensRadius - 10, event.clientY)),
    };
    setDetailZoom({
      x: safeX,
      y: safeY,
      lensX: ((lensPoint.x - figureBounds.left) / Math.max(1, figureBounds.width)) * 100,
      lensY: ((lensPoint.y - figureBounds.top) / Math.max(1, figureBounds.height)) * 100,
      sourceX, sourceY, sourceWidth: imageBounds.width, sourceHeight: imageBounds.height,
    });
    setDetailLensActive(true);
  };


  useEffect(() => {
    if (window.matchMedia('(max-width: 700px)').matches) return;
    document.body.classList.add("flower-experience-active");
    return () => {
      document.body.classList.remove("flower-experience-active");
      transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      transitionTimersRef.current = [];
      transitionInProgressRef.current = false;
    };
  }, []);


  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let wheelResetTimer = 0;
    const scrollSurface = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>('[data-chapter-scroll]') : null;
    const canScroll = (surface: HTMLElement | null, delta: number) => !!surface
      && /^(auto|scroll)$/.test(getComputedStyle(surface).overflowY) && (
      delta > 0 ? surface.scrollTop + surface.clientHeight < surface.scrollHeight - 2 : surface.scrollTop > 2
    );

    const handleWheel = (event: WheelEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.ctrlKey || canScroll(scrollSurface(event.target), event.deltaY)) return;
      event.preventDefault();
      if (transitionInProgressRef.current) return;
      wheelDeltaRef.current += event.deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => { wheelDeltaRef.current = 0; }, 150);
      if (Math.abs(wheelDeltaRef.current) < 42) return;
      const direction = wheelDeltaRef.current > 0 ? 1 : -1;
      wheelDeltaRef.current = 0;
      goToChapter(targetChapterRef.current + direction);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartYRef.current = event.touches.length === 1 ? touch?.clientY ?? null : null;
      touchStartXRef.current = event.touches.length === 1 ? touch?.clientX ?? null : null;
      const surface = scrollSurface(event.target);
      touchBoundaryRef.current = {up: canScroll(surface, -1), down: canScroll(surface, 1)};
      touchBlockedRef.current = event.touches.length !== 1
        || (event.target instanceof Element && !!event.target.closest('.detail-focus, a, button, input, [role="tablist"], [data-no-chapter-swipe]'));
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (touchStartYRef.current === null || touchStartXRef.current === null || event.changedTouches.length !== 1) return;
      const deltaY = touchStartYRef.current - event.changedTouches[0].clientY;
      const deltaX = touchStartXRef.current - event.changedTouches[0].clientX;
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      if (touchBlockedRef.current || (window.visualViewport?.scale ?? 1) > 1.03) return;
      if (deltaY > 0 ? touchBoundaryRef.current.down : touchBoundaryRef.current.up) return;
      if (Math.abs(deltaY) > 84 && Math.abs(deltaY) > Math.abs(deltaX) * 1.35) {
        goToChapter(targetChapterRef.current + (deltaY > 0 ? 1 : -1));
      }
    };

    root.addEventListener("wheel", handleWheel, { passive: false });
    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    root.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      root.removeEventListener("wheel", handleWheel);
      root.removeEventListener("touchstart", handleTouchStart);
      root.removeEventListener("touchend", handleTouchEnd);
      window.clearTimeout(wheelResetTimer);
    };
  }, [goToChapter]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (window.matchMedia('(max-width: 700px)').matches) return;
      if (productInfoOpen) {
        if (event.key === "Escape") setProductInfoOpen(false);
        return;
      }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (["ArrowDown", "PageDown"].includes(event.key)) {
        event.preventDefault();
        goToChapter(targetChapterRef.current + 1);
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToChapter(targetChapterRef.current - 1);
      }
      if (event.key === "Home") {
        event.preventDefault();
        goToChapter(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        goToChapter(chapters.length - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToChapter, productInfoOpen]);

  const experienceStyle: ExperienceStyle = {
    "--chapter-background": theme.background,
    "--chapter-ink": theme.ink,
    "--chapter-muted": theme.muted,
    "--chapter-glow": theme.glow,
  };

  const chapterState = (index: number) => index === activeChapter ? "active" : index < activeChapter ? "past" : "future";
  const selectedDetail = detailItems[activeDetail];
  const selectedGarmentPiece = garmentPieces[activeGarmentPiece];
  const isCostumeDetail = selectedDetail.key === "dress";
  const costumeCrop = costumeView === "complete"
    ? { position: "50% 50%", scale: 1.04 }
    : selectedGarmentPiece;
  const selectedImage = detailImage(
    isCostumeDetail && costumeView === 'pieces' ? pieceMedia[selectedGarmentPiece.key] : detailMedia[selectedDetail.key],
    isCostumeDetail ? costumeCrop.position : selectedDetail.position,
    isCostumeDetail ? costumeCrop.scale : selectedDetail.scale,
  );
  const detailPosition = selectedImage.position;
  const detailScale = selectedImage.scale;
  const DetailImage = selectedImage.own ? 'img' : TransparentGoddess;
  const publishedPhotos = officialPhotos.filter(id=>siteMedia[id].src).length;

  if (window.matchMedia('(max-width: 700px)').matches) {
    return <MobileFlower details={detailItems} pieces={garmentPieces} onBack={onBackCollection} />;
  }

  return (
    <div className="flower-experience" style={experienceStyle} data-transition={transitionPhase} data-direction={transitionDirection} data-chapter={chapters[activeChapter].id}>
      <div className="experience-backdrop" aria-hidden="true"><span /><i /></div>
      <div className="side-depth-transition" aria-hidden="true" />

      <header className="experience-header">
        <a
          className="experience-brand"
          href={FLOWER_GODS_PATH}
          aria-label="返回花神卷，选择花神"
          onClick={(event) => {
            if (!onBackCollection || !isPlainNavigation(event)) return;
            event.preventDefault();
            onBackCollection();
          }}
        >
          <span className="experience-brand-mark"><img className="brand-logo-image" src={officialLogo} alt="" /></span>
          <span><strong><SplitColorText text="LUMEN AURALIS" /></strong><small>← 返回花神卷 · 选择花神</small></span>
        </a>
        <div className="experience-chapter-title" aria-live="polite"><span>0{activeChapter + 1}</span>{theme.label} · {theme.en}</div>
        <div className="experience-header-actions"><SiteSearch tone="dark" /><button className="product-info-trigger" type="button" onClick={() => setProductInfoOpen(true)}>产品信息 <span>＋</span></button><a className="experience-verify-link" href="/verify">防伪核验 <span>↗</span></a></div>
      </header>

      {productInfoOpen && <div className="product-info-overlay" onMouseDown={event => {
        if (event.target === event.currentTarget) setProductInfoOpen(false);
      }}>
        <section className="product-info-dialog" role="dialog" aria-modal="true" aria-labelledby="product-info-title">
          <button className="product-info-close" type="button" autoFocus aria-label="关闭产品信息" onClick={() => setProductInfoOpen(false)}>×</button>
          <p className="product-info-kicker">LOTUS DEITY · PRODUCT 01</p>
          <h2 id="product-info-title">镜昕产品信息</h2>
          <p className="product-info-intro">配置、制作周期与服务说明将在这里集中更新，不影响造型细节的纯粹观看。</p>
          <dl className="product-info-grid">
            <div><dt>尺寸规格</dt><dd>70 · 3分</dd></div>
            <div><dt>材质</dt><dd>环保三抗树脂</dd></div>
            <div><dt>肤色</dt><dd>mia白 · mia粉 · 普肌</dd></div>
            <div><dt>眼珠</dt><dd>图片待补充</dd></div>
            <div><dt>服装配件</dt><dd>头纱、战国袍、挂饰；披帛（大全套不含）</dd></div>
            <div><dt>制作周期</dt><dd>约 90 个工作日</dd></div>
            <div><dt>保养说明</dt><dd>文案确认后公布</dd></div>
            <div><dt>售后与退换</dt><dd>文案确认后公布</dd></div>
          </dl>
          <div className="product-info-contact"><span>客服 19988424290</span><span>工作日 10:00—17:00</span></div>
          {commerce.featuredProductUrl || commerce.shopUrl
            ? <a className="product-info-shop" href={commerce.featuredProductUrl || commerce.shopUrl!} target="_blank" rel="noopener noreferrer">前往淘宝购买 <span>↗</span></a>
            : <span className="product-info-shop is-pending" aria-disabled="true">淘宝链接整理中</span>}
        </section>
      </div>}

      <nav className="experience-pagination" aria-label="花神章节">
        <div className="experience-progress"><span style={{ transform: `scaleY(${(activeChapter + 1) / chapters.length})` }} /></div>
        {chapters.map((chapter, index) => (
          <button
            type="button"
            key={chapter.id}
            className={index === activeChapter ? "is-active" : ""}
            aria-current={index === activeChapter ? "step" : undefined}
            aria-label={"前往" + chapter.label + "：" + chapter.en}
            title={chapter.label + " · " + chapter.en}
            onClick={() => goToChapter(index)}
          >
            <span>0{index + 1}</span><b>{chapter.label}<small>{chapter.en}</small></b>
          </button>
        ))}
      </nav>

      <div className="experience-scroll" ref={scrollRef}>
        <section
          id="prologue"
          ref={(node) => { chapterRefs.current[0] = node; }}
          className="experience-chapter chapter-prologue"
          data-chapter-scroll
          data-chapter-index="0"
          data-state={chapterState(0)}
        >
          <div className="prologue-title-backdrop">
            <div className="prologue-title-index"><span>01</span><i /><span>LOTUS DEITY</span></div>
            <p className="prologue-title-kicker">原典序列 01</p>
            <h1><SplitColorText text="镜昕" /></h1>
            {commerce.featuredProductUrl || commerce.shopUrl
              ? <a className="desktop-taobao-entry" href={commerce.featuredProductUrl || commerce.shopUrl!} target="_blank" rel="noopener noreferrer">淘宝购买 ↗</a>
              : <PurchaseMenu currentSlug="jingxin" label="淘宝购买 ↗" className="desktop-taobao-entry"/>}
          </div>

          <div className="prologue-copy chapter-reveal">
            <p className="prologue-lead">LOTUS DEITY · CHARACTER 01</p>
            <div className="portrait-mode-switch" role="tablist" aria-label="角色形态">
              <button
                type="button"
                role="tab"
                aria-selected={portraitMode === "original"}
                className={portraitMode === "original" ? "is-active" : ""}
                onClick={() => setPortraitMode("original")}
              ><span>01</span><b>原画</b><small>CONCEPT</small></button>
              <button
                type="button"
                role="tab"
                aria-selected={portraitMode === "physical"}
                className={portraitMode === "physical" ? "is-active" : ""}
                onClick={() => setPortraitMode("physical")}
              ><span>02</span><b>实体</b><small>PHYSICAL</small></button>
            </div>
            <button className="chapter-next" type="button" onClick={() => goToChapter(1)}>查看造型细节 <span>↗</span></button>
            <a className="prologue-verify" href="/verify">防伪核验 <span>↗</span></a>
          </div>

          <div className="prologue-particle chapter-reveal" data-portrait-mode={portraitMode}>
            <span className="portrait-environment" aria-hidden="true" />
            {portraitMode === "physical" ? (lightweightArtwork ? (
              <img className="prologue-mobile-portrait" src={goddessImage} alt="荷花女神镜昕实体预览" decoding="async" />
            ) : (
              <CinematicParticlePortrait active={activeChapter === 0} src={goddessImage} alt="由微光星图缓慢凝聚而成的荷花女神镜昕实体预览" />
            )) : (
              <img className="prologue-original-art" src={originalArtwork} alt="荷花女神镜昕角色原画" />
            )}
            <span className="portrait-foreground-haze" aria-hidden="true" />
          </div>

          <div className="prologue-side-note chapter-reveal" aria-hidden="true">
            <span>{portraitMode === "physical" ? "PHYSICAL PREVIEW" : "CONCEPT ART"}</span><i /><span>JINGXIN · 01</span>
          </div>
        </section>

        <section
          id="details"
          ref={(node) => { chapterRefs.current[1] = node; }}
          className="experience-chapter chapter-details"
          data-chapter-scroll
          data-chapter-index="1"
          data-state={chapterState(1)}
        >
          <div className="detail-intro chapter-reveal">
            <p className="experience-eyebrow">FORM & DETAIL</p>
            <h2><SplitColorText text="造型细节" /></h2>
            <span>{isCostumeDetail ? "查看全套上身，或拆解至单件细节。" : "选择区域查看局部。"}</span>
          </div>

          <figure
            className={`detail-focus chapter-reveal${isCostumeDetail ? ` is-costume-view costume-mode-${costumeView}` : ""}${detailLensActive ? " is-detail-inspecting" : ""}`}
            style={{
              "--zoom-x": `${detailZoom.x}%`,
              "--zoom-y": `${detailZoom.y}%`,
              "--lens-x": `${detailZoom.lensX}%`,
              "--lens-y": `${detailZoom.lensY}%`,
              "--lens-magnification": lensMagnification,
            } as ExperienceStyle}
            aria-label={`荷花女神镜昕${selectedDetail.title}展示，移动鼠标查看附近区域的局部放大${isCostumeDetail ? "；衣装可切换全套上身与单件拆解" : ""}`}
            onPointerDown={updateDetailZoomFromPointer}
            onPointerMove={updateDetailZoomFromPointer}
            onPointerLeave={() => setDetailLensActive(false)}
          >
            {isCostumeDetail && (
              <div className="costume-mode-switch" role="tablist" aria-label="衣装展示方式" onPointerDown={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={costumeView === "complete"}
                  className={costumeView === "complete" ? "is-active" : ""}
                  onClick={() => setCostumeView("complete")}
                >
                  <span>01</span><b>全套上身</b><small>FULL LOOK</small>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={costumeView === "pieces"}
                  className={costumeView === "pieces" ? "is-active" : ""}
                  onClick={() => setCostumeView("pieces")}
                >
                  <span>02</span><b>单件拆解</b><small>SEPARATE PIECES</small>
                </button>
              </div>
            )}
            <div className="detail-image-window">
              <DetailImage
                key={selectedImage.src + selectedDetail.key}
                className={`${selectedImage.own ? 'transparent-goddess is-ready managed-detail-image' : ''} ${isCostumeDetail ? "costume-main-layer" : ""}`}
                src={selectedImage.src}
                alt={"荷花女神镜昕" + selectedDetail.title + "细节"}
                style={{
                  transformOrigin: detailPosition,
                  transform: `scale(${detailScale})`,
                }}
              />
            </div>
            <span className="costume-focus-marker detail-hover-marker" aria-hidden="true" />
            <div className="costume-detail-lens detail-hover-lens" aria-hidden={!detailLensActive} aria-live="polite">
              <div className="detail-lens-scene" style={{
                width: `${detailZoom.sourceWidth}px`, height: `${detailZoom.sourceHeight}px`,
                left: `calc(50% - ${detailZoom.sourceX}px)`, top: `calc(50% - ${detailZoom.sourceY}px)`,
                transformOrigin: `${detailZoom.sourceX}px ${detailZoom.sourceY}px`,
              }}>
                <img src={selectedImage.src} alt={`${selectedDetail.title}鼠标所指区域放大细节`} style={{
                  transformOrigin: detailPosition, transform: `scale(${detailScale})`,
                }} />
              </div>
              <div className="detail-lens-label"><span>局部检视</span><b>{isCostumeDetail ? (costumeView === "complete" ? "衣装细节" : selectedGarmentPiece.title) : selectedDetail.title}</b></div>
            </div>
            {isCostumeDetail && (
              <>
                <span className="costume-view-index">
                  04 / COSTUME · {costumeView === "complete" ? "FULL LOOK" : selectedGarmentPiece.en}
                </span>
                {costumeView === "pieces" && (
                  <div className="costume-piece-rail" role="tablist" aria-label="衣装单件" onPointerDown={(event) => event.stopPropagation()}>
                    {garmentPieces.map((piece, index) => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={index === activeGarmentPiece}
                        className={index === activeGarmentPiece ? "is-active" : ""}
                        onClick={() => setActiveGarmentPiece(index)}
                        key={piece.key}
                      >
                        <span>{piece.number}</span><b>{piece.title}</b><small>{piece.en}</small>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <figcaption><span>{selectedDetail.number}</span><p>{selectedDetail.en}</p></figcaption>
          </figure>

          <div className="detail-reading chapter-reveal">
            <span>{selectedDetail.number} / 04</span>
            <h3>{isCostumeDetail ? (costumeView === "complete" ? "全套上身" : selectedGarmentPiece.title) : selectedDetail.title}</h3>
            <p>{isCostumeDetail
              ? (costumeView === "complete"
                ? "完整呈现服装比例、层次与上身轮廓；后续可直接替换为实体娃上身拍摄。"
                : selectedGarmentPiece.description)
              : selectedDetail.description}</p>
            <label className="detail-magnification-control">
              <span><b>放大倍率</b><output>{lensMagnification.toFixed(1)}×</output></span>
              <input
                type="range"
                min="1.5"
                max="4.5"
                step="0.1"
                value={lensMagnification}
                aria-label="调节局部放大镜倍率"
                aria-valuetext={`${lensMagnification.toFixed(1)} 倍`}
                onChange={(event) => setLensMagnification(Number(event.currentTarget.value))}
              />
            </label>
            {isCostumeDetail && (
              <span className="costume-reading-meta">
                {costumeView === "complete" ? "COMPLETE STYLING" : `${selectedGarmentPiece.number} / 05 · INDIVIDUAL PIECE`}
              </span>
            )}
          </div>

          <div className="detail-tabs chapter-reveal" role="tablist" aria-label="造型细节">
            {detailItems.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={index === activeDetail}
                className={index === activeDetail ? "is-active" : ""}
                onClick={() => setActiveDetail(index)}
                key={item.key}
              >
                <span>{item.number}</span><b>{item.title}</b><small>{item.en}</small>
              </button>
            ))}
          </div>
        </section>

        <section
          id="becoming"
          ref={(node) => { chapterRefs.current[2] = node; }}
          className="experience-chapter chapter-becoming official-gallery-chapter"
          data-chapter-scroll
          data-chapter-index="2"
          data-state={chapterState(2)}
        >
          <img className="lotus-relief lotus-relief-gallery" src={lotusReliefArtwork} alt="" aria-hidden="true" />
          <div className="official-gallery-copy chapter-reveal">
            <p className="experience-eyebrow">OFFICIAL PHOTOGRAPHY ARCHIVE</p>
            <h2><span>官方</span><SplitColorText text="摄影" /></h2>
            <p>{publishedPhotos ? '品牌正式拍摄的镜昕实体娃影像，按摄影作品顺序持续收录。' : '用于收录品牌正式拍摄的镜昕实体娃影像。首辑完成后，将按摄影作品顺序持续更新。'}</p>
            <div className="official-photo-status" aria-label="官方摄影更新状态">
              <span>FIRST EDITORIAL SHOOT</span>
              <b>镜昕 · 实体官拍</b>
              <small>{publishedPhotos ? `已收录 ${publishedPhotos} 幅作品` : '拍摄完成后开放浏览'}</small>
            </div>
          </div>
          <figure className="official-gallery-stage official-gallery-contact chapter-reveal" aria-label={publishedPhotos ? '镜昕官方摄影接触表' : '镜昕官方摄影接触表，拍摄素材待更新'}>
            <div className="official-contact-sheet">
              {officialPhotos.map((id,index)=>{
                const photo=siteMedia[id];
                return <div key={id} className={`official-photo-frame${index===0?' official-photo-frame-main':''}${photo.src?' has-photo':''}`}>
                  <span>FRAME 0{index+1}</span>
                  {photo.src ? <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" /> : <><b>{index===0?'首辑影像':'镜昕'}</b><small>IMAGE PENDING</small></>}
                </div>;
              })}
            </div>
            <figcaption><span>VOL. 01</span><b>镜昕 · 首辑官拍</b><small>{publishedPhotos ? `${publishedPhotos} PHOTOGRAPHS` : 'COMING SOON'}</small></figcaption>
          </figure>
        </section>

        <section
          id="verification"
          ref={(node) => { chapterRefs.current[3] = node; }}
          className="experience-chapter chapter-verification"
          data-chapter-scroll
          data-chapter-index="3"
          data-state={chapterState(3)}
        >
          <img className="lotus-relief lotus-relief-verification" src={lotusReliefArtwork} alt="" aria-hidden="true" />
          <div className="verification-copy chapter-reveal">
            <p className="experience-eyebrow">OFFICIAL IDENTITY · PRIVATE LOOKUP</p>
            <h2><span>官方身份</span><span><SplitColorText text="防伪核验" /></span></h2>
            <p>输入娃证编号与淘宝订单号，连接绘屿造物官方档案，查看作品身份与首次核验记录。</p>
            <div className="verification-formula"><span>娃证编号</span><i>＋</i><span>淘宝订单号</span></div>
            <a href="/verify">进入防伪验证 <b>↗</b></a>
          </div>
        </section>
      </div>
    </div>
  );
}
