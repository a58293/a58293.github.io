import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import "./traditional-effects.css";

const TRADITIONAL_COLORS = {
  tianShuiBi: "#5aa4ae",
  ouHe: "#d9a5b3",
  xiangYe: "#d4a955",
  qingDai: "#59617c",
  zheShi: "#9c5c42",
};

export function useTraditionalColorHover() {
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const origin = event.target;
      if (!(origin instanceof Element)) return;
      const target = origin.closest<HTMLElement>("h1, h2, .site-header nav a, .brand strong");
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      const position = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
      target.style.setProperty("--traditional-x", `${position}%`);
      target.style.setProperty("--traditional-a", TRADITIONAL_COLORS.tianShuiBi);
      target.style.setProperty("--traditional-b", TRADITIONAL_COLORS.ouHe);
      target.style.setProperty("--traditional-c", TRADITIONAL_COLORS.xiangYe);
      target.style.setProperty("--traditional-d", TRADITIONAL_COLORS.qingDai);
      target.style.setProperty("--traditional-e", TRADITIONAL_COLORS.zheShi);
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => document.removeEventListener("pointermove", handlePointerMove);
  }, []);
}

type Bloom = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export function FlowerBloomSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [blooms, setBlooms] = useState<Bloom[]>([]);
  const lastBloomAt = useRef(0);
  const nextId = useRef(0);

  const createBloom = (event: ReactPointerEvent<HTMLDivElement>, force = false) => {
    const origin = event.target;
    if (!(origin instanceof Element) || !origin.closest("h2, p, dt, dd, button")) return;
    if (event.pointerType === "touch" && !force) return;

    const now = performance.now();
    if (!force && now - lastBloomAt.current < 150) return;
    lastBloomAt.current = now;

    const bounds = event.currentTarget.getBoundingClientRect();
    const id = ++nextId.current;
    const bloom: Bloom = {
      id,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      size: 34 + Math.random() * 24,
      rotation: -20 + Math.random() * 40,
    };

    setBlooms((current) => [...current.slice(-17), bloom]);
    window.setTimeout(() => setBlooms((current) => current.filter((item) => item.id !== id)), 2400);
  };

  return (
    <div
      className={`bloom-surface ${className}`}
      onPointerMove={(event) => createBloom(event)}
      onPointerDown={(event) => createBloom(event, true)}
    >
      <div className="flower-bloom-layer" aria-hidden="true">
        {blooms.map((bloom) => (
          <span
            className="lotus-blossom"
            key={bloom.id}
            style={{
              left: bloom.x,
              top: bloom.y,
              width: bloom.size,
              height: bloom.size,
              "--bloom-rotation": `${bloom.rotation}deg`,
            } as CSSProperties}
          >
            {Array.from({ length: 8 }, (_, index) => (
              <i key={index} style={{ "--petal-angle": `${index * 45}deg` } as CSSProperties} />
            ))}
            <b />
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}
