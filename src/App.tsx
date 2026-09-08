/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import HomeGallery from "./components/HomeGallery";
import StudioIntro from "./components/StudioIntro";

// 路由组件懒加载 (Lazy Loading)
const GraphicDesignGallery = lazy(() => import("./components/GraphicDesignGallery"));
const GraphicDesignDetail = lazy(() => import("./components/GraphicDesignDetail"));
const IllustrationGallery = lazy(() => import("./components/IllustrationGallery"));
const SpatialDesignGallery = lazy(() => import("./components/SpatialDesignGallery"));
const MCNGallery = lazy(() => import("./components/MCNGallery"));
const InstallationGallery = lazy(() => import("./components/InstallationGallery"));
const ProductDesignDetail = lazy(() => import("./components/ProductDesignDetail"));
const LogoGallery = lazy(() => import("./components/LogoGallery"));

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return null;
}

function HomeContent() {
  return (
    <>
      <HomeGallery />
      <StudioIntro />
    </>
  );
}

function Home() {
  const segmentRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  useLayoutEffect(() => {
    const setMiddlePosition = () => {
      const segmentHeight = segmentRef.current?.offsetHeight ?? 0;
      if (!segmentHeight) return;
      window.scrollTo({ top: segmentHeight, behavior: "auto" });
      initializedRef.current = true;
    };

    const timer = window.setTimeout(setMiddlePosition, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    html.style.overscrollBehaviorY = "none";

    const recenter = () => {
      if (rafRef.current !== null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const segmentHeight = segmentRef.current?.offsetHeight ?? 0;
        if (!segmentHeight || !initializedRef.current) return;

        const scrollTop = window.scrollY || window.pageYOffset;
        const upperBound = segmentHeight * 0.5;
        const lowerBound = segmentHeight * 1.5;

        if (scrollTop <= upperBound) {
          window.scrollTo({ top: scrollTop + segmentHeight, behavior: "auto" });
        } else if (scrollTop >= lowerBound) {
          window.scrollTo({ top: scrollTop - segmentHeight, behavior: "auto" });
        }
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      const segmentHeight = segmentRef.current?.offsetHeight ?? 0;
      if (!segmentHeight) return;

      if (!initializedRef.current) {
        window.scrollTo({ top: segmentHeight, behavior: "auto" });
        initializedRef.current = true;
        return;
      }

      const scrollTop = window.scrollY || window.pageYOffset;
      if (scrollTop < segmentHeight * 0.5 || scrollTop > segmentHeight * 1.5) {
        window.scrollTo({ top: segmentHeight, behavior: "auto" });
      }
    });

    if (segmentRef.current) {
      resizeObserver.observe(segmentRef.current);
    }

    window.addEventListener("scroll", recenter, { passive: true });

    return () => {
      window.removeEventListener("scroll", recenter);
      resizeObserver.disconnect();
      html.style.overscrollBehaviorY = "";
      history.scrollRestoration = previous;
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <main className="w-full bg-[#FFFDFC]">
      <div aria-hidden="true">
        <HomeContent />
      </div>
      <div ref={segmentRef}>
        <HomeContent />
      </div>
      <div aria-hidden="true">
        <HomeContent />
      </div>
    </main>
  );
}

function GraphicDesign() {
  return (
    <main className="min-h-screen w-full bg-[#FFFDFC]">
      <GraphicDesignGallery />
    </main>
  );
}

function LogoCollection() {
  return (
    <main className="min-h-screen w-full bg-[#FFFDFC]">
      <LogoGallery />
    </main>
  );
}

// 页面切换时的加载占位符
const PageLoader = () => (
  <div className="min-h-screen w-full bg-[#FFFDFC] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <Router>
      <ScrollManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/graphic" element={<GraphicDesign />} />
          <Route path="/graphic/:id" element={<GraphicDesignDetail />} />
          <Route path="/logos" element={<LogoCollection />} />
          <Route path="/illustration" element={<IllustrationGallery />} />
          <Route path="/illustration/:category" element={<IllustrationGallery />} />
          <Route path="/spatial" element={<SpatialDesignGallery />} />
          <Route path="/mcn" element={<MCNGallery />} />
          <Route path="/installation" element={<InstallationGallery />} />
          <Route path="/installation/:id" element={<ProductDesignDetail />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
