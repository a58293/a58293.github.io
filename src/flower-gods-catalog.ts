import {requiredImage} from './media-library';
import jingxinAvatar from './assets/jingxin-avatar.png';
export const FLOWER_GODS_PATH = '/series/flower-gods';

export type FlowerGod = {
  slug: string;
  number: string;
  name: string;
  flower: string;
  englishName: string;
  description: string;
  image: string;
  avatar: string;
  // Character-specific foreground flowers; unpublished seats have no invented flower.
  foreground?: string;
  // Register a matching detail renderer before publishing another character.
  experience: 'jingxin';
};

export const flowerGods: readonly FlowerGod[] = [
  {
    slug: 'jingxin', number: '01', name: '镜昕', flower: '荷花女神',
    englishName: 'LOTUS DEITY',
    description: '花瓣、薄纱与水光，凝成新生与守护的形貌。',
    image: requiredImage('jingxinChoice'),
    avatar: jingxinAvatar,
    foreground: requiredImage('jingxinForeground'),
    experience: 'jingxin',
  },
];

export const flowerGodPath = (deity: FlowerGod) => `${FLOWER_GODS_PATH}/${deity.slug}`;
export const JINGXIN_PATH = flowerGodPath(flowerGods[0]);

export type SiteRoute =
  | { view: 'home' | 'collection' | 'not-found'; path: string }
  | { view: 'character'; path: string; deity: FlowerGod };

export function resolveSiteRoute(pathname: string): SiteRoute {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { view: 'home', path };
  if (path === FLOWER_GODS_PATH) return { view: 'collection', path };
  const deity = flowerGods.find(item => flowerGodPath(item) === path);
  return deity ? { view: 'character', path, deity } : { view: 'not-found', path };
}

export function transitionCopy(route: SiteRoute) {
  if (route.view === 'character') return {
    kicker: `原典序列 · ${route.deity.number}`,
    title: route.deity.name, english: route.deity.englishName,
  };
  if (route.view === 'collection') return {
    kicker: '原典系列 · 选择花神', title: '花神卷', english: 'THE FLORAL DEITIES',
  };
  return { kicker: '返回品牌主页', title: '绘屿造物', english: 'LUMEN AURALIS' };
}

export function isPlainNavigation(event: {
  button: number; defaultPrevented: boolean;
  metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean;
}) {
  return event.button === 0 && !event.defaultPrevented &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
