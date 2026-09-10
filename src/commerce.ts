import links from './purchase-links.json';
const allowedStoreHosts = /(^|\.)((taobao|tmall)\.com)$/i;

function trustedStoreUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && allowedStoreHosts.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Set these through deployment environment variables when the shop is ready. */
export const commerce = {
  shopUrl: trustedStoreUrl(import.meta.env.VITE_TAOBAO_SHOP_URL || links.shopUrl),
  featuredProductUrl: trustedStoreUrl(import.meta.env.VITE_TAOBAO_FEATURED_URL || links.products.jingxin),
};

export function productPurchaseUrl(slug: string, isFeatured: boolean) {
  const productLinks: Record<string, string | null> = links.products;
  return trustedStoreUrl(productLinks[slug]) || (isFeatured ? commerce.featuredProductUrl : null) || commerce.shopUrl;
}
