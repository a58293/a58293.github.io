import { useCallback, useEffect, useRef, useState } from "react";
import {requiredImage} from './media-library';
import type {InitialAssetTracker} from './initial-assets';
import "./brand-loading-screen.css";

type BrandLoadingScreenProps = {
  onComplete: () => void;
  tracker: InitialAssetTracker;
};

export default function BrandLoadingScreen({ onComplete, tracker }: BrandLoadingScreenProps) {
  const [imageReady, setImageReady] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [progress, setProgress] = useState(tracker.getProgress());
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitingRef = useRef(false);
  const finishTimerRef = useRef(0);

  const finish = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = window.setTimeout(onComplete, 420);
  }, [onComplete]);

  useEffect(() => {
    document.body.classList.add("brand-loader-active");
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), 1400);
    // Emergency fail-open only: an unavailable asset must not trap the visitor.
    const fallbackTimer = window.setTimeout(() => finish(), 30000);
    return () => {
      document.body.classList.remove("brand-loader-active");
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(finishTimerRef.current);
    };
  }, [finish]);

  useEffect(() => {
    let cancelled = false;
    const ready = () => { if (!cancelled) setPageReady(true); };
    const unsubscribe = tracker.subscribe(value => { if (!cancelled) setProgress(value); });
    void tracker.ready.then(ready, ready);
    return () => { cancelled = true; unsubscribe(); };
  }, [tracker]);

  useEffect(() => {
    if (!imageReady || !pageReady || !minimumElapsed || exiting) return;
    const settleTimer = window.setTimeout(finish, 80);
    return () => window.clearTimeout(settleTimer);
  }, [exiting, finish, imageReady, pageReady, minimumElapsed]);

  return (
    <div className="brand-loader" data-phase={exiting ? "exit" : "forming"} role="status" aria-label="绘屿造物正在载入">
      <div className="brand-loader-paper" aria-hidden="true" />
      <div className="brand-loader-halo brand-loader-halo-outer" aria-hidden="true" />
      <div className="brand-loader-halo brand-loader-halo-inner" aria-hidden="true" />

      <div className="brand-loader-artwork">
        <img
          className="brand-loader-art brand-loader-art-echo"
          src={requiredImage('loaderArt')}
          alt=""
          aria-hidden="true"
        />
        <img
          className="brand-loader-art"
          src={requiredImage('loaderArt')}
          alt="绘屿造物品牌线稿：坐在浮岛上的球形关节人偶"
          onLoad={() => setImageReady(true)}
          onError={() => setImageReady(true)}
          draggable="false"
        />
        <div className="brand-loader-overlay-plane" aria-hidden="true">
          <span className="brand-loader-star-orbit">
            <span className="brand-loader-vector-star">
              <span className="brand-loader-star-mask" />
              <img src={requiredImage('loaderStar')} alt="" draggable="false" />
            </span>
          </span>
        </div>
      </div>

      <div className="brand-loader-meta" aria-hidden="true">
        <span>LUMEN AURALIS</span>
        <i />
        <small>ARCHIVE AWAKENING</small><b>{Math.round(progress * 100)}%</b>
      </div>
      <div className="brand-loader-progress" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></div>
    </div>
  );
}
