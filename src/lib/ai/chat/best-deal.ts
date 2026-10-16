import type { PricingCatalogModel } from "@/openapi";

// Weighted 3:1 toward input, the usual ratio once a chat has some history.
export function blendedPrice(model: PricingCatalogModel): number | null {
  if (model.is_free) return 0;
  if (model.is_fixed_price) return null;
  return (3 * model.input_price + model.output_price) / 4;
}

export function pickBestDeal(
  models: PricingCatalogModel[] | undefined,
  pool: string[],
): PricingCatalogModel | null {
  let best: PricingCatalogModel | null = null;
  let bestPrice = Infinity;
  for (const model of models ?? []) {
    if (!pool.includes(model.model_name) || !model.chat || !model.online)
      continue;
    const price = blendedPrice(model);
    if (price === null || price >= bestPrice) continue;
    best = model;
    bestPrice = price;
  }
  return best;
}
