import { lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import { PageRevealContext } from './page-reveal-context';
import { FLOWER_GODS_PATH, resolveSiteRoute, transitionCopy } from "./flower-gods-catalog";
import { currentFeaturedProduct } from './current-product-theme';
import { applySiteMetadata } from './site-metadata';
import {trackInitialAssets} from './initial-assets';
import "./unified-site-transition.css";

const BjdApp = lazy(() => import('./BjdApp'));
const FlowerGodsExperience = lazy(() => import('./FlowerGodsExperience'));
const FlowerGodsCollection = lazy(() => import('./FlowerGodsCollection'));
const NotFoundPage = lazy(() => import('./NotFoundPage'));

type TransitionState = "idle" | "covering" | "revealing";

export default function UnifiedBjdSite() {
  const initialPageReady = useContext(PageRevealContext);
  const [route, setRoute] = useState(() => resolveSiteRoute(window.location.pathname));
  const [signature, setSignature] = useState(() => transitionCopy(route));
  const [transitionState, setTransitionState] = useState<TransitionState>("idle");
  const [transitionKind, setTransitionKind] = useState<'ceremony' | 'soft'>('ceremony');
  const timersRef = useRef<number[]>([]);
  const transitionLockRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    applySiteMetadata(route.path);
  }, [route.path]);

  const switchView = useCallback((href: string) => {
    const destination = new URL(href, window.location.origin);
    if (destination.origin !== window.location.origin || transitionLockRef.current) return;
    if (destination.pathname === window.location.pathname && destination.hash === window.location.hash) return;
    const nextRoute = resolveSiteRoute(destination.pathname);
    if (nextRoute.view === 'not-found') return;
    const currentRoute = resolveSiteRoute(window.location.pathname);
    const withinFlowerVolume = (currentRoute.view === 'collection' || currentRoute.view === 'character')
      && (nextRoute.view === 'collection' || nextRoute.view === 'character');
    transitionLockRef.current = true;

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setSignature(transitionCopy(nextRoute));
    setTransitionKind(withinFlowerVolume ? 'soft' : 'ceremony');
    setTransitionState("covering");

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // A route transition must wait for its own images, not just the first visit.
    const pageCode = nextRoute.view === 'collection' ? import('./FlowerGodsCollection')
      : nextRoute.view === 'character' ? import('./FlowerGodsExperience') : import('./BjdApp');
    const assets = trackInitialAssets(destination.pathname.replace(/\/+$/, '') || '/', pageCode);
    const swapTimer = window.setTimeout(async () => {
      await assets.ready;
      if (!transitionLockRef.current) return;
      window.history.pushState({ view: nextRoute.view }, "", destination.pathname + destination.search + destination.hash);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      setRoute(nextRoute);
      setTransitionState("revealing");
      const finishTimer = window.setTimeout(() => {
        setTransitionState("idle");
        transitionLockRef.current = false;
        contentRef.current?.focus({ preventScroll: true });
      }, reducedMotion ? 30 : withinFlowerVolume ? 260 : 760);
      timersRef.current.push(finishTimer);
    }, reducedMotion ? 0 : withinFlowerVolume ? 160 : 560);
    timersRef.current.push(swapTimer);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      timersRef.current.forEach(timer => window.clearTimeout(timer));
      timersRef.current = [];
      transitionLockRef.current = false;
      setRoute(resolveSiteRoute(window.location.pathname));
      setTransitionState("idle");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="unified-bjd-site" data-view={route.view} data-site-transition={transitionState} data-transition-kind={transitionKind}>
      <div className="unified-view" key={route.path} ref={contentRef} tabIndex={-1} inert={transitionState !== 'idle'}>
        <PageRevealContext.Provider value={initialPageReady && transitionState === 'idle'}>
        <Suspense fallback={null}>
        {route.view === 'home' && <BjdApp onOpenFlowerGods={() => switchView(FLOWER_GODS_PATH)} onOpenFeatured={() => switchView(currentFeaturedProduct.href)} />}
        {route.view === 'collection' && <FlowerGodsCollection onNavigate={switchView} />}
        {route.view === 'character' && route.deity.experience === 'jingxin' && <FlowerGodsExperience onBackCollection={() => switchView(FLOWER_GODS_PATH)} />}
        {route.view === 'not-found' && <NotFoundPage />}
        </Suspense>
        </PageRevealContext.Provider>
      </div>

      <div className="site-transition-curtain" aria-hidden="true">
        <div className="site-transition-field" />
        <div className="site-transition-signature">
          <span>{signature.kicker}</span>
          <strong>{signature.title}</strong>
          <small>{signature.english}</small>
        </div>
        <i className="site-transition-line" />
      </div>
    </div>
  );
}
