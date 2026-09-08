import { useEffect, useRef, useState } from "react";
import { getTransparentGoddess } from "./transparent-goddess";
import "./particle-portrait.css";

type Particle = {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
  duration: number;
  radius: number;
  phase: number;
  color: string;
};

const easeOutQuart = (value: number) => 1 - Math.pow(1 - value, 4);

export function ParticlePortrait({ src, alt }: { src: string; alt: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assembled, setAssembled] = useState(false);
  const [cleanSrc, setCleanSrc] = useState("");

  useEffect(() => {
    let active = true;
    getTransparentGoddess(src)
      .then((asset) => active && setCleanSrc(asset))
      .catch(() => active && setCleanSrc(src));
    return () => { active = false; };
  }, [src]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !image || !canvas || !cleanSrc) return;

    let frame = 0;
    let disposed = false;
    let lastWidth = 0;
    let lastHeight = 0;

    const buildParticles = () => {
      const bounds = wrapper.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      if (Math.abs(width - lastWidth) < 6 && Math.abs(height - lastHeight) < 6) return;
      lastWidth = width;
      lastHeight = height;
      cancelAnimationFrame(frame);
      setAssembled(false);

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sampler = document.createElement("canvas");
      sampler.width = 320;
      sampler.height = 240;
      const samplerContext = sampler.getContext("2d", { willReadFrequently: true });
      if (!samplerContext) return;
      samplerContext.drawImage(image, 0, 0, sampler.width, sampler.height);
      const pixels = samplerContext.getImageData(0, 0, sampler.width, sampler.height).data;

      const particleCount = width < 680 ? 3200 : 7200;
      const particles: Particle[] = [];
      const centerX = width * .53;
      const centerY = height * .5;
      const outerRadius = Math.max(width, height) * .74;

      let attempts = 0;
      while (particles.length < particleCount && attempts < particleCount * 30) {
        attempts += 1;
        const normalizedX = Math.random();
        const normalizedY = Math.random();

        const sourceX = Math.min(sampler.width - 1, Math.floor(normalizedX * sampler.width));
        const sourceY = Math.min(sampler.height - 1, Math.floor(normalizedY * sampler.height));
        const pixelIndex = (sourceY * sampler.width + sourceX) * 4;
        const alpha = pixels[pixelIndex + 3];
        if (alpha < 18 || Math.random() > Math.max(.18, alpha / 255)) continue;

        const angle = Math.random() * Math.PI * 2;
        const radius = outerRadius * (.72 + Math.random() * .56);

        particles.push({
          startX: centerX + Math.cos(angle) * radius,
          startY: centerY + Math.sin(angle) * radius,
          targetX: normalizedX * width,
          targetY: normalizedY * height,
          delay: Math.random() * 1300,
          duration: 1800 + Math.random() * 1600,
          radius: .32 + Math.random() * .68,
          phase: Math.random() * Math.PI * 2,
          color: "rgb(" + pixels[pixelIndex] + "," + pixels[pixelIndex + 1] + "," + pixels[pixelIndex + 2] + ")",
        });
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const startedAt = performance.now();
      let markedAssembled = reducedMotion;
      let lastDrawAt = 0;

      if (reducedMotion) setAssembled(true);

      const draw = (now: number) => {
        if (disposed) return;
        const frameInterval = markedAssembled ? 48 : 30;
        if (!reducedMotion && now - lastDrawAt < frameInterval) {
          frame = requestAnimationFrame(draw);
          return;
        }
        lastDrawAt = now;
        context.clearRect(0, 0, width, height);
        const elapsed = reducedMotion ? 6000 : now - startedAt;

        for (const particle of particles) {
          const rawProgress = Math.max(0, Math.min(1, (elapsed - particle.delay) / particle.duration));
          if (rawProgress <= 0) continue;
          const progress = easeOutQuart(rawProgress);
          const settled = rawProgress >= 1;
          const shimmerX = settled ? Math.sin(now / 850 + particle.phase) * .55 : 0;
          const shimmerY = settled ? Math.cos(now / 1050 + particle.phase) * .45 : 0;
          const x = particle.startX + (particle.targetX - particle.startX) * progress + shimmerX;
          const y = particle.startY + (particle.targetY - particle.startY) * progress + shimmerY;
          const alpha = settled
            ? .54 + (Math.sin(now / 760 + particle.phase) + 1) * .14
            : Math.min(1, rawProgress * 2.4) * .84;

          context.globalAlpha = alpha;
          context.fillStyle = particle.color;
          context.beginPath();
          context.arc(x, y, particle.radius * (.75 + progress * .25), 0, Math.PI * 2);
          context.fill();
        }

        context.globalAlpha = 1;
        if (!markedAssembled && elapsed > 4550) {
          markedAssembled = true;
          setAssembled(true);
        }
        if (!reducedMotion) frame = requestAnimationFrame(draw);
      };

      frame = requestAnimationFrame(draw);
    };

    const onImageReady = () => {
      lastWidth = 0;
      buildParticles();
    };

    if (image.complete && image.naturalWidth) onImageReady();
    else image.addEventListener("load", onImageReady, { once: true });

    const resizeObserver = new ResizeObserver(buildParticles);
    resizeObserver.observe(wrapper);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      image.removeEventListener("load", onImageReady);
    };
  }, [cleanSrc]);

  return (
    <div ref={wrapperRef} className={"particle-portrait" + (assembled ? " is-assembled" : "")}>
      <img ref={imageRef} className="particle-portrait-base" src={cleanSrc || src} alt={alt} />
      <canvas ref={canvasRef} className="particle-portrait-canvas" aria-hidden="true" />
      <div className="particle-portrait-status" aria-hidden="true">
        <span />
        <p>{assembled ? "FORM COMPLETE" : "PARTICLE FORMING"}</p>
      </div>
    </div>
  );
}
