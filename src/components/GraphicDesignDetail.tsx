import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { graphicProjects } from "../content";
import { getHarmoniousColor } from "../lib/colorUtils";

export default function GraphicDesignDetail() {
  const { id } = useParams();
  const project = graphicProjects.find((p) => String(p.id) === id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [bgColor, setBgColor] = useState("#f9f9f9");
  const [direction, setDirection] = useState(0);
  const colorCache = useRef<Map<string, string>>(new Map());

  const allImages = useMemo(() => {
    if (!project) return [];
    return [project.src, ...(project.galleryImages || [])];
  }, [project]);

  useEffect(() => {
    const currentSrc = allImages[currentIndex];
    if (!currentSrc) return;

    if (window.innerWidth < 768) {
      setBgColor("#f9f9f9");
      return;
    }

    const cached = colorCache.current.get(currentSrc);
    if (cached) {
      setBgColor(cached);
      return;
    }

    getHarmoniousColor(currentSrc).then((color) => {
      colorCache.current.set(currentSrc, color);
      setBgColor(color);
    });
  }, [currentIndex, allImages]);

  useEffect(() => {
    if (!allImages.length) return;
    setIsImageLoading(true);
    setProgress(15);
  }, [currentIndex, allImages.length]);

  useEffect(() => {
    if (!isImageLoading) {
      setProgress(100);
      return;
    }

    setProgress(15);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + (90 - prev) * 0.1;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [isImageLoading]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Project not found
      </div>
    );
  }

  const nextImage = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) nextImage();
    else if (info.offset.x > 50) prevImage();
  };

  const variants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 20 : -20,
    }),
    center: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -20 : 20,
      transition: {
        duration: 0.5,
        ease: "easeIn",
      },
    }),
  };

  return (
    <motion.main
      className="w-full min-h-screen flex flex-col lg:flex-row overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: bgColor }}
    >
      <Link
        to="/graphic"
        className="fixed top-8 left-8 z-40 flex items-center gap-2 text-gray-400 hover:text-black transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Back</span>
      </Link>

      <div className="w-full h-screen relative flex items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] z-20 bg-black/5">
          <div
            className="h-full bg-black/20 transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              opacity: progress === 100 ? 0 : 1,
              transitionDelay: progress === 100 ? "400ms" : "0ms",
            }}
          />
        </div>

        <AnimatePresence>
          {isImageLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            >
              <div className="w-6 h-6 border border-gray-200 border-t-black rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              drag={allImages.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              <motion.img
                src={allImages[currentIndex]}
                alt={`${project.title} - Image ${currentIndex + 1}`}
                className={`max-w-full max-h-full object-contain shadow-2xl bg-white ${allImages.length > 1 ? "" : "cursor-zoom-in"}`}
                referrerPolicy="no-referrer"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onClick={() => setIsFullscreen(true)}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black z-30 p-4 transition-colors hidden md:block"
            >
              <ChevronLeft size={32} strokeWidth={1} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black z-30 p-4 transition-colors hidden md:block"
            >
              <ChevronRight size={32} strokeWidth={1} />
            </button>

            <div className="absolute bottom-8 left-0 w-full flex flex-col items-center gap-4">
              <div className="flex gap-2 bg-black/5 backdrop-blur-sm px-3 py-1.5 rounded-full">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentIndex ? 1 : -1);
                      setCurrentIndex(idx);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? "bg-black w-4" : "bg-black/20 hover:bg-black/40"
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="font-mono text-[9px] text-gray-400 tracking-[0.5em] uppercase">
                {currentIndex + 1} / {allImages.length}
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              className="absolute top-8 right-8 text-white/50 hover:text-white z-50 p-2 transition-colors"
              onClick={() => setIsFullscreen(false)}
            >
              <X size={24} strokeWidth={1} />
            </button>

            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={allImages[currentIndex]}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="max-w-full max-h-full object-contain p-4"
                referrerPolicy="no-referrer"
                decoding="async"
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
