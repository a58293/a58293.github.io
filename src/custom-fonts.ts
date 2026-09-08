export type FontRole = "body" | "title" | "latin" | "ui";
export type FontSetting = { file: string; weight?: string; style?: string };
export type FontSettings = Record<FontRole, FontSetting>;

// 将字体放入 public/fonts/custom，然后填写文件名；空字符串保留现有字体。
// 推荐 WOFF2；普通字体 weight 填 "400"，可变字体可填 "100 900"。
export const customFonts: FontSettings = {
  body:  { file: "江西拙楷3.0.ttf", weight: "400" }, // 全站文字基础字体
  title: { file: "江西拙楷3.0.ttf", weight: "400" }, // 中文大标题：用户提供的江西拙楷 3.0
  latin: { file: "江西拙楷3.0.ttf", weight: "400" }, // 英文与数字
  ui:    { file: "江西拙楷3.0.ttf", weight: "400" }, // 导航、按钮、表单
};

export async function applyCustomFonts(settings: FontSettings = customFonts) {
  const loadedFaces = new Map<string, Promise<string | null>>();
  return Promise.all((Object.keys(settings) as FontRole[]).map(async role => {
    const setting = settings[role];
    if (!setting.file) return { role, status: "unchanged" };
    // Only local font files, not third-party URLs or directory traversal.
    if (!/^[^/\\\\:]+\.(woff2?|ttf|otf)$/i.test(setting.file) || setting.file.includes("..")) {
      return { role, status: "invalid-file" };
    }
    const key = `${setting.file}|${setting.weight || "400"}|${setting.style || "normal"}`;
    if (!loadedFaces.has(key)) loadedFaces.set(key, (async () => {
      const family = `LumenCustom-${loadedFaces.size + 1}`;
      try {
        const face = new FontFace(family, `url("/fonts/custom/${encodeURIComponent(setting.file)}")`, {
          weight: setting.weight || "400", style: setting.style || "normal", display: "swap",
        });
        await face.load();
        document.fonts.add(face);
        return family;
      } catch { return null; }
    })());
    try {
      const family = await loadedFaces.get(key)!;
      if (!family) throw new Error('font unavailable');
      const fallback = role === "body" ? '"Songti SC", "STSong", "SimSun", serif' : 'var(--custom-font-body, "NamiSong", "Songti SC", serif)';
      document.documentElement.style.setProperty(`--custom-font-${role}`, `"${family}", ${fallback}`);
      document.documentElement.setAttribute(`data-custom-font-${role}`, "ready");
      return { role, status: "loaded" };
    } catch {
      // A missing or invalid font never hides content or breaks the page.
      return { role, status: "fallback" };
    }
  }));
}
