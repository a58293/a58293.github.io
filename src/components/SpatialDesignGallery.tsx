import { motion } from "motion/react";
import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { spatialProjects, ProjectItem } from "../content";
import { SplitColorText } from "./HoverColorText";
import SectionPageIntro from "./SectionPageIntro";

const ParallaxCard: React.FC<{ project: ProjectItem; index: number }> = ({ project, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isFeaturedWide = index === 9;

  return (
    <div
      className={`relative group col-span-1 aspect-[3/2] ${
        isFeaturedWide ? "md:col-span-2 lg:col-span-3 aspect-[16/7]" : ""
      }`}
    >
      <motion.div
        ref={ref}
        className="relative h-full flex items-center justify-center cursor-pointer overflow-hidden bg-white transition-all duration-500"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="w-full h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src={project.src}
            alt={project.title}
            loading={index < 8 ? "eager" : "lazy"}
            fetchPriority={index < 4 ? "high" : "auto"}
            decoding="async"
            className="w-full h-full object-cover transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function SpatialDesignGallery() {
  const projects = spatialProjects;
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && visibleCount === 9) {
        setVisibleCount(12);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visibleCount]);

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < projects.length) {
          setVisibleCount(prev => Math.min(prev + 9, projects.length));
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [visibleCount, projects.length]);

  return (
    <section className="relative w-full min-h-screen bg-white flex flex-col">
      <header className="w-full px-6 py-8 md:px-16 flex justify-between items-center border-b border-gray-50">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black transition-colors group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-en text-[10px] uppercase tracking-[0.3em]">
            <SplitColorText text="Back" defaultColor="#9CA3AF" fontClass="font-en" />
          </span>
        </Link>
        <div className="font-site text-lg tracking-[0.12em] text-[#111827]">
          <SplitColorText text="绘屿造物" defaultColor="#111827" fontClass="font-site" />
        </div>
      </header>

      <div className="w-full px-4 py-8 md:px-12 md:py-12 space-y-8 md:space-y-10">
        <SectionPageIntro
          title="艺术装置"
          lines={[
            "跨越维度，沉浸式空间叙事。",
            "打破平面限制，为商业空间与品牌大秀打造先锋艺术装置。",
            "将抽象的品牌理念转化为可触碰的震撼体验。",
          ]}
        />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {projects.slice(0, visibleCount).map((project, i) => (
            <ParallaxCard key={project.id} project={project} index={i} />
          ))}
        </div>

        <div ref={loaderRef} className="w-full h-20 flex justify-center items-center mt-8">
          {visibleCount < projects.length && (
            <div className="w-6 h-6 border-2 border-gray-100 border-t-gray-400 rounded-full animate-spin" />
          )}
        </div>
      </div>
    </section>
  );
}
