// ==========================================
// 网站全局内容与图片配置文件（本地图片版）
// 规则：
// - 普通图片：桌面端 jpg，手机端 webp
// - Logo 图片：桌面端 png，手机端 webp
// - 当前 covers/logo 按你现有文件走：桌面端 jpg，手机端 webp
// ==========================================

export interface ImageItem {
  id: number | string;
  src: string;
  alt?: string;
  position?: string;
  objectFit?: "cover" | "contain";
}

export interface ProjectItem {
  id: number | string;
  title: string;
  description?: string;
  src: string;
  location?: string;
  year?: string;
  objectFit?: "cover" | "contain";
  galleryImages?: string[];
  concept?: string;
}

const BASE_URL = "/images";

const isMobileViewport = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
};

const pickImage = (
  path: string,
  desktopExt: "jpg" | "png",
  mobileExt: "webp" = "webp"
) => `${BASE_URL}/${path}.${isMobileViewport() ? mobileExt : desktopExt}`;

const photo = (path: string) => pickImage(path, "jpg");
const logoAsset = (path: string) => pickImage(path, "png");
const coverLogo = (path: string) => pickImage(path, "jpg");

const photoRange = (prefix: string, count: number, start = 1) =>
  Array.from({ length: count }, (_, i) => photo(`${prefix}-${i + start}`));

// ==========================================
// 1. 首页分类与封面 (Covers & Logo)
// ==========================================
const _homeCategories = [
  { id: "logo", label: "LOGO", labelCn: "", src: coverLogo("covers/logo"), className: "col-span-2 row-span-2", link: "/logos", objectFit: "contain" as const },
  { id: "bjd", label: "BJD", labelCn: "球关节人偶", src: photo("covers/bjd"), className: "col-span-1 row-span-1", href: "https://planabcf.netlify.app/", objectFit: "cover" as const },
  { id: "spatial", label: "SPATIAL", labelCn: "空间设计", src: photo("covers/spatial"), className: "col-span-1 row-span-1", link: "/spatial", objectFit: "cover" as const },
  { id: "installation", label: "PRODUCT DESIGN", labelCn: "产品设计", src: photo("covers/installation"), className: "col-span-1 row-span-1", link: "/installation", objectFit: "cover" as const },
  { id: "mcn", label: "MCN", labelCn: "模特经纪", src: photo("covers/mcn"), className: "col-span-1 row-span-1", link: "/mcn", objectFit: "cover" as const },
  { id: "graphic", label: "GRAPHIC", labelCn: "平面设计", src: photo("covers/graphic"), className: "col-span-2 row-span-1", link: "/graphic", objectFit: "cover" as const },
  { id: "illustration", label: "ILLUSTRATION", labelCn: "商业海报", src: photo("covers/illustration"), className: "col-span-2 row-span-1", link: "/illustration", objectFit: "cover" as const },
];

export const homeCategories = _homeCategories;

// ==========================================
// 2. 平面设计 (Graphic Design)
// 按你当前文件夹里的真实文件名对齐
// ==========================================
const _graphicProjects: ProjectItem[] = [
  {
    id: 1,
    title: "Project 01",
    src: photo("graphic/01"),
    galleryImages: [photo("graphic/01-1"), photo("graphic/01-2")],
  },
  {
    id: 2,
    title: "Project 02",
    src: photo("graphic/02"),
    galleryImages: [photo("graphic/02-2")],
  },
  {
    id: 3,
    title: "Project 03",
    src: photo("graphic/03"),
    galleryImages: [],
  },
  {
    id: 4,
    title: "Project 04",
    src: photo("graphic/04"),
    galleryImages: photoRange("graphic/04", 4),
  },
  {
    id: 5,
    title: "Project 05",
    src: photo("graphic/05"),
    galleryImages: photoRange("graphic/05", 5),
  },
  {
    id: 6,
    title: "Project 06",
    src: photo("graphic/06"),
    galleryImages: photoRange("graphic/06", 5),
  },
  {
    id: 7,
    title: "Project 07",
    src: photo("graphic/07"),
    galleryImages: photoRange("graphic/07", 3),
  },
  {
    id: 8,
    title: "Project 08",
    src: photo("graphic/08"),
    galleryImages: [],
  },
  {
    id: 9,
    title: "Project 09",
    src: photo("graphic/09"),
    galleryImages: photoRange("graphic/09", 6),
  },
  {
    id: 10,
    title: "Project 10",
    src: photo("graphic/10"),
    galleryImages: [],
  },
  {
    id: 11,
    title: "Project 11",
    src: photo("graphic/11"),
    galleryImages: [],
  },
  {
    id: 14,
    title: "Project 14",
    src: photo("graphic/14"),
    galleryImages: photoRange("graphic/14", 5),
  },
  {
    id: 15,
    title: "Project 15",
    src: photo("graphic/15"),
    galleryImages: [],
  },
];

export const graphicProjects = _graphicProjects;
export const graphicImages = _graphicProjects;

// ==========================================
// 2.5 品牌标识 (Logo Design)
// ==========================================
const _logoImages: ImageItem[] = Array.from({ length: 33 }, (_, i) => ({
  id: i + 1,
  src: logoAsset(`logo/${String(i + 1).padStart(2, "0")}`),
  alt: `Logo 设计 ${String(i + 1).padStart(2, "0")}`,
}));

export const logoImages = _logoImages;

// ==========================================
// 3. 商业海报 (Illustration / Posters)
// 目录规则：
// public/images/illustration/anime/001.jpg(.webp)
// public/images/illustration/film/001.jpg(.webp)
// public/images/illustration/game/001.jpg(.webp)
// 同时兼容 01 / 001 两种编号写法，并自动过滤不存在的图片。
// ==========================================
const illustrationCategoryMax = 120;

const buildIllustrationCandidates = (folder: "anime" | "film" | "game") =>
  Array.from({ length: illustrationCategoryMax }, (_, i) => {
    const num3 = String(i + 1).padStart(3, "0");
    const num2 = String(i + 1).padStart(2, "0");
    return [
      photo(`illustration/${folder}/${num3}`),
      photo(`illustration/${folder}/${num2}`),
    ];
  }).flat();

export const illustrationCategories = [
  {
    key: "anime" as const,
    title: "动漫",
    images: buildIllustrationCandidates("anime"),
  },
  {
    key: "film" as const,
    title: "影视",
    images: buildIllustrationCandidates("film"),
  },
  {
    key: "game" as const,
    title: "游戏",
    images: buildIllustrationCandidates("game"),
  },
];

export const illustrationImages = illustrationCategories.flatMap((item) => item.images);


// ==========================================
// 4. 空间设计 (Spatial Design)
// ==========================================
const _spatialProjects: ProjectItem[] = Array.from({ length: 17 }, (_, i) => ({
  id: i + 1,
  title: `项目名称 ${String(i + 1).padStart(2, "0")}`,
  description: `这里是空间设计项目 ${String(i + 1).padStart(2, "0")} 的详细描述文案，介绍设计理念等。`,
  src: photo(`spatial/${String(i + 1).padStart(2, "0")}`),
  location: "Shanghai, CN",
  year: "2024",
}));

export const spatialProjects = _spatialProjects;

// ==========================================
// 5. 产品设计 (Product Design)
// 保留你原来的项目结构，只修正格式和坏文件名
// ==========================================
const _installationProjects: ProjectItem[] = [
  {
    id: 1,
    title: "阿祖的小院",
    src: photo("installation/01"),
    location: "丽江",
    year: "2026",
    galleryImages: photoRange("installation/01", 10),
  },
  {
    id: 3,
    title: "普洱茶",
    src: photo("installation/03"),
    location: "昆明",
    year: "2025",
    galleryImages: photoRange("installation/03", 8),
  },
  {
    id: 4,
    title: "岚·Bistro",
    src: photo("installation/04"),
    location: "丽江",
    year: "2025",
    galleryImages: photoRange("installation/04", 3),
  },
  {
    id: 5,
    title: "食谷者 X 华侨城恐龙谷",
    src: photo("installation/05"),
    location: "昆明",
    year: "2024",
    galleryImages: [photo("installation/05-1"), photo("installation/05-2"), photo("installation/05-4")],
  },
  {
    id: 6,
    title: "茜姿兰",
    src: photo("installation/06"),
    location: "昆明",
    year: "2023",
    galleryImages: photoRange("installation/06", 10),
  },
  {
    id: 7,
    title: "普洱",
    src: photo("installation/07"),
    location: "昆明",
    year: "2023",
    galleryImages: photoRange("installation/07", 20),
  },
  {
    id: 8,
    title: "健康日记",
    src: photo("installation/08"),
    location: "昆明",
    year: "2023",
    galleryImages: photoRange("installation/08", 12),
  },
  {
    id: 9,
    title: "泽彝",
    src: photo("installation/09"),
    location: "楚雄",
    year: "2023",
    galleryImages: [
      ...photoRange("installation/09", 8),
      photo("installation/09-9"),
      ...photoRange("installation/09", 3, 10),
    ],
  },
  {
    id: 10,
    title: "南嵩",
    src: photo("installation/10"),
    location: "浙江",
    year: "2023",
    galleryImages: photoRange("installation/10", 4),
  },
  {
    id: 11,
    title: "鸢尾",
    src: photo("installation/11"),
    location: "丽江",
    year: "2023",
    galleryImages: photoRange("installation/11", 9),
  },
  {
    id: 12,
    title: "蓬松生活",
    src: photo("installation/12"),
    location: "武汉",
    year: "2022",
    galleryImages: [photo("installation/12-1"), ...photoRange("installation/12", 4, 2)],
  },
  {
    id: 13,
    title: "云南省阜外心血管病医院",
    src: photo("installation/13"),
    location: "昆明",
    year: "2022",
    galleryImages: photoRange("installation/13", 4),
  },
  {
    id: 14,
    title: "孔子学院",
    src: photo("installation/14"),
    location: "曲阜",
    year: "2021",
    galleryImages: photoRange("installation/14", 11),
  },
  {
    id: 15,
    title: "naravan",
    src: photo("installation/15"),
    location: "Canada",
    year: "2024",
    galleryImages: photoRange("installation/15", 12),
  },
  {
    id: 16,
    title: "中环·卡地亚",
    src: photo("installation/16"),
    location: "香港",
    year: "2020",
    galleryImages: photoRange("installation/16", 5),
  },
  {
    id: 17,
    title: "十木草",
    src: photo("installation/17"),
    location: "昆明",
    year: "2019",
    galleryImages: photoRange("installation/17", 3),
  },
  {
    id: 18,
    title: "话说大理",
    src: photo("installation/18"),
    location: "大理",
    year: "2019",
    galleryImages: photoRange("installation/18", 8),
  },
  {
    id: 19,
    title: "CORAL CLUB",
    src: photo("installation/19"),
    location: "加拿大",
    year: "2019",
    galleryImages: photoRange("installation/19", 8),
  },
  {
    id: 20,
    title: "丹寨万达小镇",
    src: photo("installation/20"),
    location: "贵州",
    year: "2019",
    galleryImages: photoRange("installation/20", 3),
  },
  {
    id: 22,
    title: "槐山脚下",
    src: photo("installation/22"),
    location: "西安",
    year: "2018",
    galleryImages: photoRange("installation/22", 5),
  },
  {
    id: 23,
    title: "月咏堂",
    src: photo("installation/23"),
    location: "丽江",
    year: "2017",
    galleryImages: photoRange("installation/23", 3),
  },
  {
    id: 24,
    title: "应时发生",
    src: photo("installation/24"),
    location: "昆明",
    year: "2017",
    galleryImages: photoRange("installation/24", 8),
  },
  {
    id: 25,
    title: "RUNNING HAM",
    src: photo("installation/25"),
    location: "丽江",
    year: "2017",
    galleryImages: photoRange("installation/25", 8),
  },
];

export const installationProjects = _installationProjects;

// ==========================================
// 6. 模特经纪 (MCN)
// ==========================================
const _mcnModelAImages = Array.from(
  { length: 14 },
  (_, i) => photo(`mcn/model-a-${String(i + 1).padStart(2, "0")}`)
);

export const mcnModelAImages = _mcnModelAImages;

const _mcnModelBImages = Array.from(
  { length: 22 },
  (_, i) => photo(`mcn/model-b-${String(i + 1).padStart(2, "0")}`)
);

export const mcnModelBImages = _mcnModelBImages;

// ==========================================
// 7. 预加载优化 (Preload Optimization)
// 首页不再主动预抓整站图片，避免移动端带宽被占满。
// ==========================================
export const prefetchSectionImages = (_path: string) => {
  return;
};
