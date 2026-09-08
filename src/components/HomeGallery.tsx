import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { SplitColorText } from "./HoverColorText";
import { homeCategories } from "../content";

type HomeCategory = (typeof homeCategories)[number];

type WorkTile = {
  id: string;
  title: string;
  label: string;
  subtitle: string;
  className: string;
  imageClassName?: string;
  category: HomeCategory;
  disabled?: boolean;
  disabledText?: string;
};

function getCategory(id: string) {
  const matched = homeCategories.find((item) => item.id === id);
  if (!matched) throw new Error(`Missing home category: ${id}`);
  return matched;
}

function SmartLink({
  category,
  className,
  children,
  disabled = false,
}: {
  category: HomeCategory;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  if (category.href) {
    return (
      <a href={category.href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  if (category.link) {
    return (
      <Link to={category.link} className={className}>
        {children}
      </Link>
    );
  }

  return <div className={className}>{children}</div>;
}

function BrandMark({ logo }: { logo: HomeCategory }) {
  return (
    <div className="flex items-center gap-4 md:gap-5">
      <div className="flex h-12 w-12 items-center justify-center md:h-14 md:w-14">
        <img
          src={logo.src}
          alt="绘屿造物 Logo"
          className="max-h-full max-w-full object-contain"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <span className="font-site text-[20px] tracking-[0.22em] text-[#111827] whitespace-nowrap md:text-[24px]">
          <SplitColorText text="绘屿造物" defaultColor="#111827" fontClass="font-site" />
        </span>
        <span className="hidden h-5 w-px bg-[#E2DDD5] sm:inline-block" />
        <span className="hidden font-en text-[12px] tracking-[0.08em] text-[#334155] whitespace-nowrap sm:inline-block md:text-[13px]">
          <SplitColorText text="LUMEN AURALIS" defaultColor="#334155" fontClass="font-en" />
        </span>
      </div>
    </div>
  );
}

function WorkTileCard({ tile, index }: { tile: WorkTile; index: number }) {
  return (
    <SmartLink
      category={tile.category}
      disabled={tile.disabled}
      className={`group relative block min-h-[220px] overflow-hidden rounded-[2px] bg-white ring-1 ring-[#EAE4DA] shadow-[0_22px_50px_rgba(28,32,40,0.05)] transition-all duration-500 ${tile.disabled ? "cursor-default" : "hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(28,32,40,0.08)]"} ${tile.className}`}
    >
      <motion.div
        className="relative h-full w-full"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "140px" }}
        transition={{ duration: 0.62, ease: "easeOut", delay: index * 0.04 }}
      >
        <img
          src={tile.category.src}
          alt={tile.title}
          loading={index < 2 ? "eager" : "lazy"}
          fetchPriority={index < 2 ? "high" : "auto"}
          decoding="async"
          referrerPolicy="no-referrer"
          className={`h-full w-full object-cover saturate-[0.98] contrast-[0.99] brightness-[1.03] transition-transform duration-700 ${tile.disabled ? "" : "group-hover:scale-[1.02]"} ${tile.imageClassName ?? ""}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/44 via-[#0F172A]/8 to-transparent opacity-78 transition-opacity duration-500 group-hover:opacity-88" />

        <div className="absolute left-4 top-4 md:left-5 md:top-5 lg:left-6 lg:top-6">
          <span className="font-en text-[9px] uppercase tracking-[0.24em] text-white/76 md:text-[10px] lg:text-[11px]">
            <SplitColorText text={tile.subtitle} defaultColor="rgba(255,255,255,0.76)" fontClass="font-en" />
          </span>
        </div>

        {tile.disabledText ? (
          <div className="absolute right-4 top-4 rounded-full border border-white/40 bg-black/12 px-3 py-1 backdrop-blur-[2px] md:right-5 md:top-5 lg:right-6 lg:top-6">
            <span className="font-site text-[12px] tracking-[0.12em] text-white/92 md:text-[13px]">
              <SplitColorText text={tile.disabledText} defaultColor="rgba(255,255,255,0.92)" fontClass="font-site" />
            </span>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 lg:p-6">
          <div className="mb-3 h-px w-12 bg-white/60" />
          <h3 className="font-site text-[18px] leading-none tracking-[0.12em] text-[#FFF9F1] md:text-[22px] lg:text-[28px] [text-shadow:0_2px_12px_rgba(0,0,0,0.26)]">
            <SplitColorText text={tile.label} defaultColor="#FFF9F1" fontClass="font-site" />
          </h3>
        </div>
      </motion.div>
    </SmartLink>
  );
}

export default function HomeGallery() {
  const logo = getCategory("logo");

  // Mobile order: 商业插画 -> 品牌设计 -> 装置艺术 -> VI设计 -> 球形关节人偶
  const tiles: WorkTile[] = [
    {
      id: "illustration",
      title: "商业插画",
      label: "商业插画",
      subtitle: "Illustration",
      category: getCategory("illustration"),
      className: "md:col-span-2 lg:col-start-1 lg:col-end-13 lg:row-start-8 lg:row-end-11",
      imageClassName: "object-center",
    },
    {
      id: "installation",
      title: "品牌设计",
      label: "品牌设计",
      subtitle: "Brand Design",
      category: getCategory("installation"),
      className: "md:col-span-2 lg:col-start-2 lg:col-end-9 lg:row-start-1 lg:row-end-4",
      imageClassName: "object-[50%_42%]",
      disabled: true,
    },
    {
      id: "spatial",
      title: "装置艺术",
      label: "装置艺术",
      subtitle: "Spatial Installation",
      category: getCategory("spatial"),
      className: "md:col-span-1 lg:col-start-5 lg:col-end-9 lg:row-start-4 lg:row-end-8",
      imageClassName: "object-[50%_46%]",
      disabled: true,
    },
    {
      id: "graphic",
      title: "VI设计",
      label: "VI设计",
      subtitle: "Visual Identity",
      category: getCategory("graphic"),
      className: "md:col-span-1 lg:col-start-1 lg:col-end-5 lg:row-start-4 lg:row-end-8",
      imageClassName: "object-[50%_48%]",
      disabled: true,
    },
    {
      id: "bjd",
      title: "球形关节人偶",
      label: "球形关节人偶",
      subtitle: "BJD Project",
      category: getCategory("bjd"),
      className: "md:col-span-1 lg:col-start-9 lg:col-end-13 lg:row-start-1 lg:row-end-8",
      imageClassName: "object-[50%_44%]",
      disabled: true,
      disabledText: "敬请等待",
    },
  ];

  return (
    <section className="w-full min-h-screen overflow-hidden bg-[#FFFDFC] text-[#111827]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px] flex-col px-5 py-7 md:px-10 lg:px-16 xl:px-20">
        <header className="flex items-center justify-between gap-6">
          <BrandMark logo={logo} />
        </header>

        <div className="grid flex-1 grid-cols-1 gap-12 pt-12 lg:grid-cols-[43%_57%] lg:gap-14 lg:pt-10 xl:gap-16">
          <motion.div
            className="flex flex-col justify-center lg:pb-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, ease: "easeOut" }}
          >
            <p className="font-en text-[12px] uppercase tracking-[0.16em] text-[#475569] md:text-[14px]">
              <SplitColorText text="LUMEN AURALIS STUDIO" defaultColor="#475569" fontClass="font-en" />
            </p>

            <h1 className="mt-10 max-w-[860px] font-site text-[clamp(48px,6.1vw,104px)] leading-[0.98] tracking-[0.028em] text-[#0F172A]">
              <span className="block whitespace-nowrap">
                <SplitColorText text="以造物之心" defaultColor="#0F172A" fontClass="font-site" />
              </span>
              <span className="mt-2 block whitespace-nowrap lg:mt-4">
                <SplitColorText text="重塑商业美学" defaultColor="#0F172A" fontClass="font-site" />
              </span>
            </h1>

            <div className="mt-16 h-px w-[76%] bg-[#E5DED2]" />

            <div className="mt-12 max-w-[680px] space-y-6 font-site text-[18px] leading-[2.05] tracking-[0.03em] text-[#495260] md:text-[22px] lg:text-[24px] xl:text-[25px]">
              <p>
                <SplitColorText
                  text="绘屿造物（Lumen Auralis）是一家专注品牌构建与视觉传达的设计工作室。"
                  defaultColor="#495260"
                  fontClass="font-site"
                />
              </p>
              <p>
                <SplitColorText
                  text="我们关注品牌如何被看见、被理解、被记住。从品牌定位到视觉系统，从平面 VI 到商业海报，我们以完整的设计逻辑和克制的审美表达，帮助品牌建立清晰、统一且具有识别度的视觉形象。"
                  defaultColor="#495260"
                  fontClass="font-site"
                />
              </p>
            </div>
          </motion.div>

          <div className="flex items-center lg:justify-end lg:pt-3">
            <div className="relative grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:h-[78vh] lg:min-h-[680px] lg:grid-cols-12 lg:grid-rows-10 lg:gap-3">
              {tiles.map((tile, index) => (
                <WorkTileCard key={tile.id} tile={tile} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
