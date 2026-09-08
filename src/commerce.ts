const allowedStoreHosts = /(^|\.)((taobao|tmall)\.com)$/i;

function trustedStoreUrl(value: string | undefined) {
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
  shopUrl: trustedStoreUrl(import.meta.env.VITE_TAOBAO_SHOP_URL),
  featuredProductUrl: trustedStoreUrl(import.meta.env.VITE_TAOBAO_FEATURED_URL),
};
