import { useContext, useEffect, useRef } from "react";
import { PageRevealContext } from "./page-reveal-context";
import {requiredImage} from './media-library';
import "./particle-portrait.css";
import "./constellation-arrival.css";

type Point = readonly [number, number];
type Star = { x: number; y: number; group: number; radius: number; phase: number; stream: number; delay: number; duration: number };
type Dust = { x: number; y: number; phase: number; radius: number; stream: number; delay: number; duration: number };

// A sparse ceremonial star map suggests the goddess through structural gestures:
// crown, shoulders, central axis and flowing drapery. It reads as one large figure
// without turning into a literal neon outline.
const STAR_PATHS: readonly (readonly Point[])[] = [
  [[.425,.16],[.452,.085],[.50,.035],[.548,.085],[.575,.16]],
  [[.50,.205],[.415,.255],[.315,.30],[.19,.34],[.075,.315]],
  [[.50,.205],[.585,.255],[.685,.30],[.81,.34],[.925,.315]],
  [[.50,.18],[.485,.31],[.515,.435],[.49,.56],[.51,.69]],
  [[.455,.31],[.405,.445],[.365,.59],[.305,.735],[.215,.845],[.085,.905]],
  [[.545,.31],[.595,.445],[.635,.59],[.695,.735],[.785,.845],[.915,.905]],
  [[.085,.905],[.245,.875],[.39,.925],[.50,.895],[.61,.93],[.755,.875],[.915,.905]],
];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const noise = (seed: number) => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const DURATION = 6900;

export function CinematicParticlePortrait({
  src,
  alt,
  active = true,
  onComplete,
}: {
  src: string;
  alt: string;
  active?: boolean;
  onComplete?: () => void;
}) {
  const pageRevealed = useContext(PageRevealContext);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !image || !canvas) return;
    let frame = 0;
    let disposed = false;
    let finished = false;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastScreenWidth = 0;
    let lastScreenHeight = 0;
    let startedAt: number | null = null;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clearCanvas = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const setPortrait = (underlay: number, front: number, edge: number) => {
      wrapper.style.setProperty("--arrival-underlay", String(underlay));
      wrapper.style.setProperty("--arrival-front", String(front));
      wrapper.style.setProperty("--arrival-edge", edge + "%");
    };
    const finish = (state = "assembled") => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      setPortrait(0, 1, 120);
      wrapper.dataset.particleState = state;
      clearCanvas();
      onComplete?.();
    };
    setPortrait(0, 0, -20);
    clearCanvas();
    wrapper.dataset.particleState = "waiting";
    if (!active || !pageRevealed) return;
    wrapper.dataset.particleState = "playing";

    const build = () => {
      if (disposed || finished || !image.complete || !image.naturalWidth) return;
      if (motion.matches) { finish(); return; }
      // Layout coordinates, not transformed viewport bounds: image and stars
      // inherit every ancestor translation/scale together.
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      const left = width * .5;
      const top = height * .5;
      if (width < 2 || height < 2) return;
      if (Math.abs(width - lastWidth) < 6 && Math.abs(height - lastHeight) < 6
        && lastScreenWidth === window.innerWidth && lastScreenHeight === window.innerHeight) return;
      lastWidth = width;
      lastHeight = height;
      lastScreenWidth = window.innerWidth;
      lastScreenHeight = window.innerHeight;
      cancelAnimationFrame(frame);
      const narrowScreen = window.innerWidth < 700;
      const dpr = Math.min(window.devicePixelRatio || 1, narrowScreen ? 1.2 : 1.5);
      // Overscan stays attached to the portrait while accommodating incoming stars.
      const screenWidth = width * 2;
      const screenHeight = height * 2;
      canvas.style.left = `${-left}px`;
      canvas.style.top = `${-top}px`;
      canvas.style.width = `${screenWidth}px`;
      canvas.style.height = `${screenHeight}px`;
      canvas.width = Math.round(screenWidth * dpr);
      canvas.height = Math.round(screenHeight * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) { finish("fallback"); return; }
      ctx.setTransform(dpr, 0, 0, dpr, left * dpr, top * dpr);

      const aspect = image.naturalWidth / image.naturalHeight;
      const pw = Math.min(width, height * aspect);
      const ph = pw / aspect;
      const ox = (width - pw) / 2;
      const oy = (height - ph) / 2;

      // The artwork contains asymmetric transparent padding. Locate the real
      // painted figure and its upper-body axis so the constellation follows the
      // face and torso instead of the PNG rectangle's mathematical centre.
      let figureLeft = 0, figureRight = 1, figureTop = 0, figureBottom = 1, figureAxisX = .5;
      try {
        const sample = document.createElement('canvas');
        sample.width = 144; sample.height = 180;
        const sampleContext = sample.getContext('2d', { willReadFrequently: true });
        if (sampleContext) {
          sampleContext.drawImage(image, 0, 0, sample.width, sample.height);
          const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
          let minX = sample.width, maxX = 0, minY = sample.height, maxY = 0;
          for (let sy = 0; sy < sample.height; sy++) for (let sx = 0; sx < sample.width; sx++) {
            const alpha = pixels[(sy * sample.width + sx) * 4 + 3];
            if (alpha < 18) continue;
            minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
            minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
          }
          if (maxX > minX && maxY > minY) {
            figureLeft = Math.max(0, minX / sample.width - .008);
            figureRight = Math.min(1, (maxX + 1) / sample.width + .008);
            figureTop = Math.max(0, minY / sample.height - .006);
            figureBottom = Math.min(1, (maxY + 1) / sample.height + .006);
            // Find the head/torso centre from row midpoints, not the alpha-weighted
            // centroid. Translucent sleeves and veil are deliberately asymmetric and
            // were pulling the old centroid sideways on different viewport ratios.
            const rowCentres: number[] = [];
            const figureHeight = maxY - minY;
            const figureWidth = maxX - minX;
            const axisStart = Math.round(minY + figureHeight * .06);
            const axisEnd = Math.round(minY + figureHeight * .30);
            for (let sy = axisStart; sy <= axisEnd; sy++) {
              let rowMin = sample.width, rowMax = -1;
              for (let sx = 0; sx < sample.width; sx++) {
                if (pixels[(sy * sample.width + sx) * 4 + 3] < 18) continue;
                rowMin = Math.min(rowMin, sx); rowMax = Math.max(rowMax, sx);
              }
              const rowWidth = rowMax - rowMin;
              if (rowMax >= rowMin && rowWidth > 3 && rowWidth < figureWidth * .54) {
                rowCentres.push((rowMin + rowMax) / 2);
              }
            }
            rowCentres.sort((a, b) => a - b);
            figureAxisX = rowCentres.length
              ? rowCentres[Math.floor(rowCentres.length / 2)] / sample.width
              : (figureLeft + figureRight) / 2;
            figureAxisX = Math.max(figureLeft + .08, Math.min(figureRight - .08, figureAxisX));
          }
        }
      } catch {
        // Same-origin media should be readable; keep centred geometry as a safe fallback.
      }
      const calibratedPortrait = src === requiredImage('jingxinPortrait');
      // Landmarks normalized to the source image. Veil/transparent margins must
      // never influence the face axis of the published Jingxin portrait.
      if (calibratedPortrait) {
        figureLeft = .06; figureRight = .95;
        figureTop = .026; figureBottom = .936; figureAxisX = .51;
      }
      const figureTarget = (x: number, y: number) => ({
        x: ox + pw * (x <= .5
          ? figureLeft + (figureAxisX - figureLeft) * x * 2
          : figureAxisX + (figureRight - figureAxisX) * (x - .5) * 2),
        y: oy + ph * (figureTop + (figureBottom - figureTop) * y),
      });
      const head = figureTarget(.5, .12);
      wrapper.dataset.headAnchor = `${head.x},${head.y}`;
      // Four asymmetric currents cross the whole stage. Every point travels on its
      // own curve, so no recognisable sleeve, crown or hem flies in as a rigid piece.
      const streams = [
        { sx: -left - 110, sy: oy + ph * .12, c1x: ox - pw * .12, c1y: oy - ph * .12 },
        { sx: screenWidth - left + 110, sy: oy + ph * .18, c1x: ox + pw * 1.12, c1y: oy - ph * .02 },
        { sx: -left - 120, sy: oy + ph * .88, c1x: ox - pw * .05, c1y: oy + ph * 1.08 },
        { sx: screenWidth - left + 120, sy: oy + ph * .82, c1x: ox + pw * 1.08, c1y: oy + ph * 1.02 },
      ];

      // Build glow once, then stamp it. Avoid per-star blur filters during playback.
      const glow = document.createElement("canvas");
      glow.width = glow.height = 48;
      const gc = glow.getContext("2d");
      if (!gc) { finish("fallback"); return; }
      const halo = gc.createRadialGradient(24, 24, 0, 24, 24, 24);
      halo.addColorStop(0, "rgba(233,250,244,.85)");
      halo.addColorStop(.1, "rgba(199,236,223,.55)");
      halo.addColorStop(.3, "rgba(158,218,204,.14)");
      halo.addColorStop(1, "rgba(158,218,204,0)");
      gc.fillStyle = halo;
      gc.fillRect(0, 0, 48, 48);

      const stars: Star[] = [];
      const links: [number, number][] = [];
      STAR_PATHS.forEach((path, group) => {
        const first = stars.length;
        path.forEach(([x, y], index) => {
          const seed = group * 19 + index * 7 + 3;
          const stream = (group + index) % streams.length;
          stars.push({
            x, y, group, stream,
            radius: index % 3 === 0 ? 2.25 : 1.28,
            phase: group * .7 + index * 1.3,
            delay: 70 + noise(seed) * 820 + stream * 55,
            duration: 1380 + noise(seed + 5) * 620,
          });
          if (index) links.push([first + index - 1, first + index]);
        });
      });

      // The fine field is an abstract celestial volume, not a sample of the image
      // alpha. It therefore never gives away a human-shaped silhouette in advance.
      const dust: Dust[] = [];
      const dustCount = narrowScreen ? 340 : width < 900 ? 620 : 920;
      for (let i = 1; i <= dustCount; i++) {
        const x = .06 + noise(i * 2) * .88;
        const y = .06 + noise(i * 2 + 1) * .86;
        const stream = (i + Math.floor(y * 7)) % streams.length;
        dust.push({
          x, y, stream,
          phase: noise(i + 51) * Math.PI * 2,
          radius: .3 + noise(i + 109) * .68,
          delay: noise(i + 191) * 1320 + stream * 65,
          duration: 1500 + noise(i + 271) * 950,
        });
      }

      startedAt ??= performance.now();
      const cubic = (a: number, b: number, c: number, d: number, t: number) => {
        const one = 1 - t;
        return one * one * one * a + 3 * one * one * t * b + 3 * one * t * t * c + t * t * t * d;
      };
      const positionAt = (
        x: number, y: number, streamIndex: number, phase: number,
        delay: number, duration: number, time: number, alignToFigure = false,
      ) => {
        const stream = streams[streamIndex];
        const u = clamp((time - delay) / duration);
        // Fast first movement gives the current tension; the long final third lets
        // it settle without a mechanical stop.
        const p = 1 - Math.pow(1 - u, 3.65);
        const figurePoint = alignToFigure ? figureTarget(x, y) : null;
        const targetX = figurePoint?.x ?? ox + x * pw;
        const targetY = figurePoint?.y ?? oy + y * ph;
        const direction = streamIndex % 2 === 0 ? -1 : 1;
        const startX = stream.sx + Math.cos(phase * 1.7) * 42;
        const startY = stream.sy + Math.sin(phase * 1.31) * ph * .13;
        const c2x = targetX + direction * pw * (.13 + noise(phase * 13) * .055);
        const c2y = targetY + (streamIndex < 2 ? -1 : 1) * ph * .085 + Math.sin(phase) * 18;
        return {
          x: cubic(startX, stream.c1x, c2x, targetX, p),
          y: cubic(startY, stream.c1y, c2y, targetY, p),
          progress: p,
          dock: Math.exp(-Math.pow((time - delay - duration * .9) / 230, 2)),
        };
      };
      const positions = stars.map(() => ({ x: 0, y: 0, alpha: 0, progress: 0, dock: 0 }));
      const draw = (now: number) => {
        if (disposed) return;
        const t = now - startedAt!;
        if (t >= DURATION || motion.matches) { finish(); return; }
        ctx.clearRect(-left, -top, screenWidth, screenHeight);

        const front = smooth((t - 2350) / 520);
        const reveal = smooth((t - 2450) / 2750);
        // Feathered mask starts above the head and crosses the hem continuously.
        const edge = (oy + ph * lerp(-.14, 1.18, reveal)) / height * 100;
        setPortrait(.075 * smooth((t - 1650) / 650) * (1 - smooth((t - 3950) / 950)), front, edge);
        const fadeAt = (y: number) => 1 - smooth((t - (3000 + y * 1950)) / 1050);

        ctx.globalCompositeOperation = "lighter";
        dust.forEach((dot, index) => {
          const point = positionAt(dot.x, dot.y, dot.stream, dot.phase, dot.delay, dot.duration, t);
          const x = point.x + Math.sin(dot.phase + t / 820) * (1 - point.progress) * 7;
          const y = point.y + Math.cos(dot.phase * 1.4) * (1 - point.progress) * 8;
          const alpha = (.24 + point.dock * .24) * smooth((t - dot.delay) / 150) * fadeAt(dot.y);
          // Keep only brief individual glints. A denser sample made neighbouring
          // tails join into one continuous rail that appeared to cut across the doll.
          if (index % 23 === 0 && point.progress > .055 && point.progress < .76) {
            const previous = positionAt(dot.x, dot.y, dot.stream, dot.phase, dot.delay, dot.duration, t - 28);
            const distance = Math.hypot(x - previous.x, y - previous.y);
            const tail = Math.min(1, 26 / Math.max(1, distance));
            ctx.strokeStyle = "#b8ddd3";
            ctx.globalAlpha = alpha * .12;
            ctx.lineWidth = .55;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(lerp(x, previous.x, tail), lerp(y, previous.y, tail));
            ctx.stroke();
          }
          ctx.globalAlpha = alpha;
          ctx.fillStyle = dot.phase > 5.8 ? "#ded2ae" : "#bbdfd4";
          ctx.beginPath();
          ctx.arc(x, y, dot.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        stars.forEach((star, i) => {
          const point = positionAt(star.x, star.y, star.stream, star.phase, star.delay, star.duration, t, true);
          positions[i].x = point.x;
          positions[i].y = point.y;
          positions[i].progress = point.progress;
          positions[i].dock = point.dock;
          positions[i].alpha = smooth((t - star.delay) / 160) * fadeAt(star.y);
        });

        // The major stars cut through the field as accents, then lose their tails
        // before the quiet constellation lines appear.
        ctx.lineCap = "round";
        stars.forEach((star, i) => {
          const current = positions[i];
          if (star.radius < 1.5 || current.progress <= .02 || current.progress >= .91) return;
          const previous = positionAt(star.x, star.y, star.stream, star.phase, star.delay, star.duration, t - 82, true);
          const length = Math.hypot(current.x - previous.x, current.y - previous.y);
          const limit = Math.min(1, 92 / Math.max(1, length));
          const tailX = lerp(current.x, previous.x, limit);
          const tailY = lerp(current.y, previous.y, limit);
          ctx.strokeStyle = "#c8e6d9";
          for (let segment = 0; segment < 5; segment++) {
            ctx.globalAlpha = current.alpha * .52 * (1 - segment / 5) * (1 - current.progress);
            ctx.lineWidth = 1.25 - segment * .16;
            ctx.beginPath();
            ctx.moveTo(lerp(current.x, tailX, segment / 5), lerp(current.y, tailY, segment / 5));
            ctx.lineTo(lerp(current.x, tailX, (segment + 1) / 5), lerp(current.y, tailY, (segment + 1) / 5));
            ctx.stroke();
          }
        });
        ctx.lineWidth = width < 700 ? .65 : .8;
        ctx.strokeStyle = "#b3d9d0";
        ctx.lineCap = "round";
        for (const [a, b] of links) {
          const from = positions[a], to = positions[b];
          const group = stars[a].group;
          const settled = Math.min(from.progress, to.progress);
          const grow = smooth((settled - .91) / .09) * smooth((t - 2200 - group * 55) / 620);
          const lineFade = 1 - smooth((t - 4250) / 1050);
          ctx.strokeStyle = "#b3d9d0";
          ctx.globalAlpha = Math.min(from.alpha, to.alpha) * .21 * grow * lineFade;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(lerp(from.x, to.x, grow), lerp(from.y, to.y, grow));
          ctx.stroke();
          // One restrained warm impulse travels through each completed cluster.
          const sweep = (t - 2750 - group * 105) / 430;
          if (sweep > 0 && sweep < 1.3) {
            ctx.strokeStyle = "#e6d4a4";
            ctx.globalAlpha = Math.min(from.alpha, to.alpha) * .38 * Math.sin(clamp(sweep / 1.3) * Math.PI) * lineFade;
            const begin = clamp(sweep - .3), end = clamp(sweep);
            ctx.beginPath();
            ctx.moveTo(lerp(from.x, to.x, begin), lerp(from.y, to.y, begin));
            ctx.lineTo(lerp(from.x, to.x, end), lerp(from.y, to.y, end));
            ctx.stroke();
          }
        }
        stars.forEach((star, i) => {
          const p = positions[i];
          const revealGlow = Math.exp(-Math.pow((t - 2850 - star.y * 1950) / 330, 2));
          const pulse = .94 + Math.sin(t / 1000 + star.phase) * .06
            + p.dock * .44 + revealGlow * .34;
          ctx.globalAlpha = Math.min(1, p.alpha * .7 * pulse);
          const size = (star.radius > 1.5 ? 31 : 19) * pulse;
          ctx.drawImage(glow, p.x - size / 2, p.y - size / 2, size, size);
          ctx.globalAlpha = Math.min(1, p.alpha * pulse * .92);
          ctx.fillStyle = i % 13 === 0 ? "#ead8ae" : "#e3f4ee";
          ctx.beginPath();
          ctx.arc(p.x, p.y, star.radius * (width < 700 ? .85 : 1), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        wrapper.dataset.particleState = t < 1150 ? "entering" : t < 2300 ? "playing" : t < 2500 ? "gathered" : "revealing";
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };

    const fallbackTimer = window.setTimeout(() => {
      if (!disposed && startedAt === null) finish("fallback");
    }, 8000);
    const onMotion = () => { if (motion.matches) finish(); };
    const onError = () => finish("fallback");
    image.addEventListener("load", build);
    image.addEventListener("error", onError);
    motion.addEventListener("change", onMotion);
    const resize = new ResizeObserver(build);
    resize.observe(wrapper);
    window.addEventListener("resize", build);
    build();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(fallbackTimer);
      resize.disconnect();
      window.removeEventListener("resize", build);
      image.removeEventListener("load", build);
      image.removeEventListener("error", onError);
      motion.removeEventListener("change", onMotion);
    };
  }, [src, active, pageRevealed, onComplete]);

  return (
    <div ref={wrapperRef} className="particle-portrait cinematic-particle-portrait constellation-arrival">
      <img className="particle-portrait-depth" src={src} alt="" aria-hidden="true" decoding="async" />
      <img className="particle-portrait-reflection" src={src} alt="" aria-hidden="true" decoding="async" />
      <img ref={imageRef} className="particle-portrait-base" src={src} alt={alt} decoding="async" fetchPriority="high" />
      <img className="particle-portrait-reveal" src={src} alt="" aria-hidden="true" decoding="async" />
      <canvas ref={canvasRef} className="particle-portrait-canvas" aria-hidden="true" />
    </div>
  );
}
