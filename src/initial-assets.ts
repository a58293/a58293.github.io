import {requiredImage} from './media-library';
import {currentFeaturedProduct} from './current-product-theme';

export type InitialAssetTracker = {
  ready: Promise<void>;
  getProgress: () => number;
  subscribe: (listener: (progress: number) => void) => () => void;
};

function firstScreenImages(pathname: string) {
  const paths = [
    requiredImage('brandLogo'),
    requiredImage('loaderArt'),
    requiredImage('loaderStar'),
  ];
  if (pathname === "/") paths.push(requiredImage(currentFeaturedProduct.physicalMedia));
  if (pathname === "/series/flower-gods") {
    paths.push(requiredImage('jingxinChoice'));
    paths.push(requiredImage('flowerCloudSea'), requiredImage('flowerColumns'), requiredImage('jingxinForeground'), requiredImage('flowerPendingScene'));
  }
  if (pathname === "/series/flower-gods/jingxin") paths.push(requiredImage('jingxinPortrait'));

  return [...new Set(paths)];
}

// Track only visible first-screen images. The large custom font loads in the
// background with font-display: swap, so typography never blocks the visitor.
export function trackInitialAssets(pathname: string, pageCode: Promise<unknown> = Promise.resolve()): InitialAssetTracker {
  const paths = firstScreenImages(pathname);
  const listeners = new Set<(progress: number) => void>();
  let completed = 0;
  const getProgress = () => paths.length ? completed / paths.length : 1;
  const report = () => listeners.forEach(listener => listener(getProgress()));
  const load = (src: string) => new Promise<void>(resolve => {
    const image = new Image();
    const finish = () => {
      image.onload = null;
      image.onerror = null;
      completed += 1;
      report();
      resolve();
    };
    image.onload = () => {
      if (typeof image.decode === "function") void image.decode().then(finish, finish);
      else finish();
    };
    image.onerror = finish;
    image.src = src;
  });

  const ready = Promise.allSettled([...paths.map(load), pageCode]).then(() => undefined);
  return {
    ready,
    getProgress,
    subscribe(listener) {
      listeners.add(listener);
      listener(getProgress());
      return () => listeners.delete(listener);
    },
  };
}

// Kept as a small compatibility helper for checks and future callers.
export async function waitForInitialAssets(pathname: string, _fontsReady?: Promise<unknown>) {
  await trackInitialAssets(pathname).ready;
}
