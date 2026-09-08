import { motion } from "motion/react";
import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { logoImages, ImageItem } from "../content";

const LogoCard: React.FC<{ image: ImageItem, index: number }> = ({ image, index }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      className="relative w-full aspect-square flex items-center justify-center group cursor-pointer overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "200px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.05, zIndex: 20 }}
    >
      <img
        src={image.src}
        alt={image.alt}
        loading={index < 10 ? "eager" : "lazy"}
        fetchPriority={index < 10 ? "high" : "auto"}
        decoding="async"
        className="w-full h-full object-contain transition-all duration-500"
        referrerPolicy="no-referrer"
      />
      
      {/* Subtle index number for a technical feel */}
      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
        ID_{String(image.id).padStart(2, '0')}
      </div>
    </motion.div>
  );
}

export default function LogoGallery() {
  const images = logoImages;
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && visibleCount === 12) {
        setVisibleCount(20);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 12, images.length));
  };

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < images.length) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, images.length]);

  return (
    <section className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col">
      {/* Header with Back Button */}
      <div className="w-full px-4 pt-8 md:px-12 md:pt-12 flex justify-between items-center">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black transition-colors group">
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Back to Index</span>
        </Link>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 w-full px-4 py-8 md:px-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
          {images.slice(0, visibleCount).map((image, i) => (
            <LogoCard key={image.id} image={image} index={i} />
          ))}
        </div>
        
        {/* Infinite Scroll Sentinel */}
        <div ref={loaderRef} className="w-full h-20 flex justify-center items-center mt-8">
          {visibleCount < images.length && (
            <div className="w-6 h-6 border-2 border-gray-100 border-t-gray-400 rounded-full animate-spin" />
          )}
        </div>
      </div>
      
      {/* Footer info */}
      <footer className="w-full px-4 py-8 md:px-12 border-t border-gray-50 flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase tracking-widest">
        <span>© {new Date().getFullYear()} Plan.D Studio</span>
        <span>Total {images.length} Marks</span>
      </footer>
    </section>
  );
}
