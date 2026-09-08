import React from "react";

const HoverColorText: React.FC<{
  children: React.ReactNode;
  className?: string;
  defaultColor?: string;
}> = ({ children, className = "", defaultColor = "currentColor" }) => (
  <span
    className={`static-color-char ${className}`}
    style={{ color: defaultColor, display: "inline-block" }}
  >
    {children}
  </span>
);

export default HoverColorText;

export const SplitColorText: React.FC<{
  text: string;
  className?: string;
  defaultColor?: string;
  fontClass?: string;
}> = ({ text, className = "", defaultColor = "currentColor", fontClass = "" }) => (
  <span className={`${className} ${fontClass}`}>
    {text.split("").map((char, index) => (
      <HoverColorText key={index} defaultColor={defaultColor} className={fontClass}>{char}</HoverColorText>
    ))}
  </span>
);
