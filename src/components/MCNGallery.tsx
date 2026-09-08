import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
  AnimatePresence,
  PanInfo
} from "motion/react";
import { wrap } from "motion/react";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { mcnModelAImages, mcnModelBImages } from "../content";

interface ModelProfile {
  name: string;
  height: string;
  weight: string;
  chest: string;
  waist: string;
  hips: string;
  shoe: string;
}

const modelAProfile: ModelProfile = {
  name: "凯撒",
  height: "186cm",
  weight: "74kg",
  chest: "90",
  waist: "83",
  hips: "98",
  shoe: "43"
};

const modelBProfile: ModelProfile = {
  name: "益西曲珍",
  height: "172cm",
  weight: "64kg",
  chest: "96",
  waist: "74",
  hips: "93",
  shoe: "36.5"
};

// --- Image Marquee Component ---

interface ImageMarqueeProps {
  images: string[];
  baseVelocity: number;
  direction?: "left" | "right";
  onImageClick: (index: number) => void;
}

const ImageMarquee: React.FC<ImageMarqueeProps> = ({ images, baseVelocity = 1, onImageClick }) => {
  const baseX = useMotionValue(0);

  // Dynamically calculate numSets based on image count
  const numSets = Math.max(2, Math.ceil(12 / Math.max(1, images.length)));
  const wrapPercent = -100 / numSets;
  
  const x = useTransform(baseX, (v) => `${wrap(wrapPercent, 0, v)}%`);

  useAnimationFrame((t, delta) => {
    // Constant pixel speed: roughly 15 seconds per image for a slow, elegant pan
    const baseSpeedPercentPerSecond = Math.abs(wrapPercent) / (Math.max(1, images.length) * 15);
    
    // Use baseVelocity to determine direction and speed multiplier
    let moveBy = baseVelocity * baseSpeedPercentPerSecond * (delta / 1000);
    
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden py-4 flex flex-nowrap w-full">
      <motion.div className="flex flex-nowrap w-max flex-shrink-0" style={{ x }}>
        {Array.from({ length: numSets }).map((_, setIdx) => (
          <div key={setIdx} className="flex flex-nowrap flex-shrink-0 gap-6 md:gap-10 pr-6 md:pr-10">
            {images.map((src, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[260px] md:w-[360px] aspect-[3/4] overflow-hidden rounded-sm cursor-pointer group relative hover:opacity-90 transition-opacity shadow-2xl"
                onClick={() => onImageClick(i)}
              >
                <img 
                  src={src} 
                  alt="Model" 
                  loading={setIdx === 0 && i < 6 ? "eager" : "lazy"} 
                  fetchPriority={setIdx === 0 && i < 4 ? "high" : "auto"} 
                  decoding="async"
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function MCNGallery() {
  const modelA = mcnModelAImages;
  const modelB = mcnModelBImages;

  const [lightboxState, setLightboxState] = useState<{
    images: string[];
    currentIndex: number;
    profile: ModelProfile;
  } | null>(null);

  const [isImageLoading, setIsImageLoading] = useState(false);

  const openLightbox = (images: string[], index: number, profile: ModelProfile) => {
    const img = new Image();
    img.src = images[index];
    if (img.complete) {
      setIsImageLoading(false);
    } else {
      setIsImageLoading(true);
    }
    setLightboxState({ images, currentIndex: index, profile });
  };

  const closeLightbox = () => {
    setLightboxState(null);
    setIsImageLoading(false);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lightboxState) return;
    const nextIdx = (lightboxState.currentIndex + 1) % lightboxState.images.length;
    
    const img = new Image();
    img.src = lightboxState.images[nextIdx];
    if (img.complete) {
      setIsImageLoading(false);
    } else {
      setIsImageLoading(true);
    }

    setLightboxState({
      ...lightboxState,
      currentIndex: nextIdx
    });
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lightboxState) return;
    const prevIdx = (lightboxState.currentIndex - 1 + lightboxState.images.length) % lightboxState.images.length;
    
    const img = new Image();
    img.src = lightboxState.images[prevIdx];
    if (img.complete) {
      setIsImageLoading(false);
    } else {
      setIsImageLoading(true);
    }

    setLightboxState({
      ...lightboxState,
      currentIndex: prevIdx
    });
  };

  const handleDragEnd = (e: any, { offset }: PanInfo) => {
    const swipeThreshold = 50;
    if (offset.x < -swipeThreshold) {
      nextImage();
    } else if (offset.x > swipeThreshold) {
      prevImage();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxState) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxState]);

  // Preload next and previous images for smoother transitions
  useEffect(() => {
    if (!lightboxState || lightboxState.images.length <= 1) return;
    
    const { images, currentIndex } = lightboxState;
    const indicesToPreload = [
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length,
      (currentIndex + 2) % images.length
    ];

    const uniqueIndices = Array.from(new Set(indicesToPreload)).filter(idx => idx !== currentIndex);

    uniqueIndices.forEach(idx => {
      const img = new Image();
      img.src = images[idx];
    });
  }, [lightboxState]);

  return (
    <motion.main 
      className="min-h-screen bg-black text-white overflow-x-hidden flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 md:p-12 z-50 mix-blend-difference text-white flex justify-between items-center pointer-events-none">
        <Link to="/" className="group flex items-center gap-2 font-tech uppercase tracking-widest text-sm hover:text-gray-300 transition-colors pointer-events-auto">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Link>
        <div className="font-tech font-black text-xl tracking-widest">绘屿造物</div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center relative">
        
        {/* Top Banner - Model A (Left) */}
        <div className="w-full py-8 md:py-16 border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm transform -skew-y-2 origin-left z-10">
           <ImageMarquee 
             images={modelA} 
             baseVelocity={-1} 
             onImageClick={(index) => openLightbox(modelA, index, modelAProfile)} 
           />
        </div>

        {/* Bottom Banner - Model B (Right) */}
        <div className="w-full py-8 md:py-16 border-t border-white/10 bg-zinc-900/50 backdrop-blur-sm transform skew-y-2 origin-right z-10 mt-[-4rem]">
           <ImageMarquee 
             images={modelB} 
             baseVelocity={1} 
             onImageClick={(index) => openLightbox(modelB, index, modelBProfile)} 
           />
        </div>

      </div>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-black text-white border-t border-white/10 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
             <div className="font-typewriter text-gray-500 text-xs">
                © 2024 绘屿造物 MCN。
            </div>
            <div className="font-mono text-xs tracking-widest text-gray-500">
                REPRESENTING UNIQUE TALENT
            </div>
        </div>
      </footer>

      {/* Image Modal */}
      <AnimatePresence>
        {lightboxState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-md"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-50"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-4"
            >
              <ChevronLeft className="w-8 h-8 md:w-12 md:h-12" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-4"
            >
              <ChevronRight className="w-8 h-8 md:w-12 md:h-12" />
            </button>

            {/* Loading Spinner */}
            <AnimatePresence>
              {isImageLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                >
                  <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              key="lightbox-container"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-6xl max-h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Section */}
              <div className="relative w-full md:w-1/2 flex justify-center items-center min-h-[50vh] md:min-h-[85vh]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={lightboxState.currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    src={lightboxState.images[lightboxState.currentIndex]}
                    alt="Enlarged view"
                    className={`max-w-full max-h-[50vh] md:max-h-[85vh] object-contain shadow-2xl ${lightboxState.images.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    referrerPolicy="no-referrer"
                    drag={lightboxState.images.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => setIsImageLoading(false)}
                  />
                </AnimatePresence>
                <div className="absolute -bottom-8 left-0 w-full text-center font-mono text-xs text-gray-500 tracking-widest">
                  {lightboxState.currentIndex + 1} / {lightboxState.images.length}
                </div>
              </div>

              {/* Profile Section */}
              <div className="w-full md:w-1/2 text-white flex flex-col justify-center p-4 md:p-0">
                <h2 className="text-4xl md:text-6xl font-tech font-black tracking-widest mb-2">{lightboxState.profile.name}</h2>
                <div className="w-12 h-1 bg-white mb-8"></div>
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 font-mono text-sm tracking-widest mb-8">
                  <div>
                    <div className="text-gray-500 mb-1">HEIGHT / 身高</div>
                    <div>{lightboxState.profile.height}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">WEIGHT / 体重</div>
                    <div>{lightboxState.profile.weight}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">CHEST / 胸围</div>
                    <div>{lightboxState.profile.chest}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">WAIST / 腰围</div>
                    <div>{lightboxState.profile.waist}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">HIPS / 臀围</div>
                    <div>{lightboxState.profile.hips}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">SHOE / 鞋码</div>
                    <div>{lightboxState.profile.shoe}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden preloading area for browser caching */}
      <div className="hidden" aria-hidden="true">
        {lightboxState && lightboxState.images.length > 1 && (
          <>
            <img src={lightboxState.images[(lightboxState.currentIndex + 1) % lightboxState.images.length]} referrerPolicy="no-referrer" />
            <img src={lightboxState.images[(lightboxState.currentIndex - 1 + lightboxState.images.length) % lightboxState.images.length]} referrerPolicy="no-referrer" />
          </>
        )}
      </div>
    </motion.main>
  );
}
