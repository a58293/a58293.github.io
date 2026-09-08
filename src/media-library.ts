import {siteMedia, type MediaId} from './generated/site-media';
export {siteMedia};
export type {MediaId};

export function requiredImage(id: MediaId): string {
  const src=siteMedia[id].src;
  if (!src) throw new Error(`Missing required media: ${id}`);
  return src;
}

export const officialPhotos = ['official01','official02','official03'] as const;
export const collectorPhotos = ['collector01','collector02','collector03'] as const;

export function detailImage(id: MediaId, position: string, scale: number) {
  const own = siteMedia[id].src;
  return {src:own || requiredImage('jingxinPortrait'), position:own?'50% 50%':position, scale:own?1:scale, own:!!own};
}
