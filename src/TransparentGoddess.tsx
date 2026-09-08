import { useEffect, useState, type CSSProperties } from "react";
import { getTransparentGoddess } from "./transparent-goddess";

type TransparentGoddessProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

export function TransparentGoddess({ src, alt, className = "", style }: TransparentGoddessProps) {
  const [cleanSrc, setCleanSrc] = useState("");

  useEffect(() => {
    let active = true;
    getTransparentGoddess(src)
      .then((asset) => active && setCleanSrc(asset))
      .catch(() => active && setCleanSrc(src));
    return () => { active = false; };
  }, [src]);

  return (
    <img
      className={`transparent-goddess ${cleanSrc ? "is-ready" : ""} ${className}`.trim()}
      src={cleanSrc || src}
      alt={alt}
      style={style}
    />
  );
}
