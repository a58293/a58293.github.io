import { motion } from "motion/react";
import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { graphicProjects, ProjectItem } from "../content";
import { SplitColorText } from "./HoverColorText";
import SectionPageIntro from "./SectionPageIntro";

const ParallaxCard: React.FC<{ project: ProjectItem; index: number }> = ({ project, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const hasGallery = project.galleryImages && project.galleryImages.length > 0;

  return (
    <Link to={`/graphic/${project.id}`} className="col-span-1 aspect-[3/2] relative group">
      {hasGallery && (
        <>
          <div className="absolute inset-0 bg-gray-100 translate-x-2 translate-y-2 -rotate-1 transition-transform duration-500 group-hover:translate-x-3 group-hover:translate-y-3 group-hover:-rotate-2" />
          <div className="absolute inset-0 bg-gray-50 translate-x-1 translate-y-1 rotate-1 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2 group-hover:rotate-2" />
        </>
      )}

      <motion.div
        ref={ref}
        className="relative h-full cursor-pointer overflow-hidden bg-white transition-all duration-500"
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
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            className="w-full h-full object-cover transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </motion.div>
    </Link>
  );
};

export default function GraphicDesignGallery() {
  const projects = graphicProjects;
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && visibleCount === 9) {
        setVisibleCount(12);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visibleCount]);

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < projects.length) {
          setVisibleCount((prev) => Math.min(prev + 9, projects.length));
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
          title="VI设计"
          lines={[
            "精准落地，统一视觉符号。",
            "专注高品质的平面VI设计，将品牌理念提炼为兼具格调与严谨规范的平面视觉符号。",
            "确保品牌在所有媒介的触点上，都具备极致的辨识度与统一感。",
          ]}
        />

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {projects.slice(0, visibleCount).map((project, i) => (
            <ParallaxCard key={project.id} project={project} index={i} />
          ))}
        </div>

        <div ref={loaderRef} className="w-full h-24 flex justify-center items-center mt-12">
          {visibleCount < projects.length && (
            <div className="w-6 h-6 border-2 border-gray-100 border-t-gray-400 rounded-full animate-spin" />
          )}
        </div>
      </div>
    </section>
  );
}
