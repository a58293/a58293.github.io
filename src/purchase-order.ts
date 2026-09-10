export type RankedProduct = {slug: string; releaseOrder: number};

/** Current page first, featured second, then newest publication order. */
export function orderPurchaseProducts<T extends RankedProduct>(products: readonly T[], featuredSlug: string, currentSlug?: string): T[] {
  const unique = [...new Map(products.map(product => [product.slug, product])).values()];
  const rank = (product: T) => product.slug === currentSlug ? 0 : product.slug === featuredSlug ? 1 : 2;
  return unique.sort((a,b) => rank(a)-rank(b) || b.releaseOrder-a.releaseOrder || a.slug.localeCompare(b.slug));
}
