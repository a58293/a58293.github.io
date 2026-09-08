import { SplitColorText } from "./HoverColorText";

type Props = {
  eyebrow?: string;
  title: string;
  lines: string[];
};

export default function SectionPageIntro({ eyebrow = "", title, lines }: Props) {
  return (
    <div className="w-full max-w-6xl mx-auto pb-8 md:pb-10 border-b border-gray-200">
      <div className="space-y-4 md:space-y-5">
        {eyebrow ? (
          <div className="flex items-center gap-4">
            <span className="font-site text-[13px] md:text-[14px] tracking-[0.18em] text-[#8A8F98] whitespace-nowrap">
              <SplitColorText text={eyebrow} defaultColor="#8A8F98" fontClass="font-site" />
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        ) : null}

        <h1 className="font-site text-[clamp(30px,4vw,56px)] leading-[1.14] tracking-[0.03em] text-[#111827]">
          <SplitColorText text={title} defaultColor="#111827" fontClass="font-site" />
        </h1>

        <div className="max-w-[70rem] space-y-2.5 md:space-y-3">
          {lines.map((line) => (
            <p
              key={line}
              className="font-site text-[16px] md:text-[18px] lg:text-[19px] leading-[1.82] tracking-[0.012em] text-[#4B5563]"
            >
              <SplitColorText text={line} defaultColor="#4B5563" fontClass="font-site" />
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
