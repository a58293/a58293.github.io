import {lazy, StrictMode, Suspense, useState} from 'react';
import {createRoot} from 'react-dom/client';
import BrandLoadingScreen from './BrandLoadingScreen.tsx';
import {applyCustomFonts} from './custom-fonts';
import {trackInitialAssets} from './initial-assets';
import {resolveSiteRoute} from './flower-gods-catalog';
import {PageRevealContext} from './page-reveal-context';
import {applySiteMetadata} from './site-metadata';
import SiteErrorBoundary from './SiteErrorBoundary';
import './index.css';
import './typography-color.css';
import './brand-identity-refresh.css';
import './verification-demo.css';
import './managed-media.css';
import './series-scrolls.css';
import './home-product-theme.css';
import './custom-fonts.css';
import './mobile-compat.css';

const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
applySiteMetadata(pathname);
const UnifiedBjdSite = lazy(() => import('./UnifiedBjdSite.tsx'));
const VerifyPage = lazy(() => import('./VerifyPage.tsx'));
const NotFoundPage = lazy(() => import('./NotFoundPage.tsx'));
const LegalPage = lazy(() => import('./LegalPage.tsx'));
const legalPage = pathname.match(/^\/legal\/(terms|authenticity)$/)?.[1] as 'terms' | 'authenticity' | undefined;
const pageCode = pathname === '/' ? import('./BjdApp')
  : pathname === '/series/flower-gods/jingxin' ? import('./FlowerGodsExperience')
  : pathname === '/series/flower-gods' ? import('./FlowerGodsCollection')
  : pathname === '/verify' ? import('./VerifyPage') : Promise.resolve();
const initialAssets = trackInitialAssets(pathname, pageCode);
// Let the visible imagery win the network race; typography swaps in directly
// afterwards and remains cached for the rest of the visit.
void initialAssets.ready.then(() => applyCustomFonts());
const loaderSessionKey = 'lumen-intro-seen-v1';

function SiteRoot() {
  const [showLoader, setShowLoader] = useState(() => {
    return true;
  });
  const finishLoader = () => {
    try { window.sessionStorage.setItem(loaderSessionKey, 'yes'); } catch { /* storage may be unavailable */ }
    setShowLoader(false);
  };
  return (
    <>
      <PageRevealContext.Provider value={!showLoader}>
        <SiteErrorBoundary><Suspense fallback={null}>
          {pathname === '/verify' ? <VerifyPage /> : legalPage ? <LegalPage page={legalPage} />
            : resolveSiteRoute(pathname).view !== 'not-found' ? <UnifiedBjdSite /> : <NotFoundPage />}
        </Suspense></SiteErrorBoundary>
      </PageRevealContext.Provider>
      {showLoader && <BrandLoadingScreen tracker={initialAssets} onComplete={finishLoader} />}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteRoot />
  </StrictMode>,
);
