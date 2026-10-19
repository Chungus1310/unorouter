import type { PricingCatalogModel, RankedModel } from "@/openapi";
import { bestDiscountPercent } from "@/lib/utils/format/number";
import type { SortOrder } from "@/store/models-store";

export function effectivePrice(model: PricingCatalogModel): number {
  return model.is_fixed_price ? model.fixed_price : model.input_price;
}

// null sorts LAST, not as 0: unmeasured is not the same as measured at 0%.
function byReliability(
  a: number | null | undefined,
  b: number | null | undefined,
): number {
  if (a == null || b == null) {
    if (a == null && b == null) return 0;
    return a == null ? 1 : -1;
  }
  return b - a;
}

// Every key MUST return 0 on a tie, or every later key is dead code.
function compareBy(
  key: SortOrder,
  a: PricingCatalogModel,
  b: PricingCatalogModel,
  rankMap: Map<string, RankedModel>,
): number {
  if (key === "newest") return b.release_ts - a.release_ts;
  if (key === "popular") {
    const ra = rankMap.get(a.model_name)?.rank ?? Number.POSITIVE_INFINITY;
    const rb = rankMap.get(b.model_name)?.rank ?? Number.POSITIVE_INFINITY;
    return ra - rb;
  }
  if (key === "topWeekly") {
    return (
      (rankMap.get(b.model_name)?.total_tokens ?? 0) -
      (rankMap.get(a.model_name)?.total_tokens ?? 0)
    );
  }
  if (key === "contextDesc") {
    const ca = a.metadata?.contextWindow ?? a.metadata?.maxInputTokens ?? 0;
    const cb = b.metadata?.contextWindow ?? b.metadata?.maxInputTokens ?? 0;
    return cb - ca;
  }
  if (key === "priceAsc") return effectivePrice(a) - effectivePrice(b);
  if (key === "priceDesc") return effectivePrice(b) - effectivePrice(a);
  if (key === "discountDesc")
    return bestDiscountPercent(b) - bestDiscountPercent(a);
  if (key === "uptimeDesc") return byReliability(a.uptime_24h, b.uptime_24h);
  if (key === "successDesc")
    return byReliability(a.success_rate, b.success_rate);
  return a.model_name.localeCompare(b.model_name);
}

export function sortModels<T>(
  items: T[],
  model: (item: T) => PricingCatalogModel,
  keys: readonly SortOrder[],
  rankMap: Map<string, RankedModel>,
): T[] {
  return [...items].sort((x, y) => {
    const a = model(x);
    const b = model(y);
    for (const key of keys) {
      const diff = compareBy(key, a, b, rankMap);
      if (diff !== 0) return diff;
    }
    // Name last so the order is total; input order shifts between renders.
    return a.model_name.localeCompare(b.model_name);
  });
}
