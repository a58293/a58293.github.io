import { motion } from "motion/react";
import { SplitColorText } from "./HoverColorText";
import { logoImages } from "../content";

export default function StudioIntro() {
  const homepageLogos = logoImages.slice(0, 10);

  return (
    <section className="w-full bg-[#FFFDFC] px-5 py-14 md:px-10 md:py-18 lg:px-16 xl:px-20">
      <div className="mx-auto max-w-[1600px] border-t border-[#DDD8CE] pt-9 md:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="mb-9 flex items-center justify-between gap-6 md:mb-12">
            <div>
              <p className="font-en text-[11px] uppercase tracking-[0.26em] text-[#8A8175]">
                <SplitColorText text="Cooperative Brands" defaultColor="#8A8175" fontClass="font-en" />
              </p>
              <h2 className="mt-3 font-site text-[20px] tracking-[0.18em] text-[#111827] md:text-[24px]">
                <SplitColorText text="合作品牌" defaultColor="#111827" fontClass="font-site" />
              </h2>
            </div>
            <div className="hidden h-px flex-1 bg-[#DDD8CE] md:block" />
          </div>

          <div className="grid grid-cols-3 gap-x-6 gap-y-8 md:grid-cols-5 md:gap-x-10 md:gap-y-10 lg:grid-cols-6 xl:grid-cols-8">
            {homepageLogos.map((item) => (
              <div
                key={item.id}
                className="flex min-h-[74px] items-center justify-center border-b border-[#E3DDD2] px-2 pb-5 md:min-h-[88px]"
              >
                <img
                  src={item.src}
                  alt={item.alt || `合作品牌 ${item.id}`}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[52px] max-w-full object-contain opacity-100 saturate-100 transition duration-300 hover:scale-[1.03] md:max-h-[64px]"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
