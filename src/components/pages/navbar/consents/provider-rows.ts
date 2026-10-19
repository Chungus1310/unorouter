import { countryName } from "@/components/elements/model/group-data-policy";
import { sortByKeys } from "@/lib/api/model-sort";
import type { ProviderConsentItem } from "@/openapi";

export const PROVIDER_STATUSES = ["given", "missing"] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export const PROVIDER_SORT_VALUES = ["modelsDesc", "alias", "country"] as const;
export type ProviderSort = (typeof PROVIDER_SORT_VALUES)[number];
export const DEFAULT_PROVIDER_SORT: readonly ProviderSort[] = ["modelsDesc"];

export function providerStatus(p: ProviderConsentItem): ProviderStatus {
  return p.status === "given" ? "given" : "missing";
}

export function sortProviders(
  items: ProviderConsentItem[],
  keys: readonly ProviderSort[],
  locale: string,
): ProviderConsentItem[] {
  return sortByKeys(
    items,
    keys,
    (key, a, b) => {
      if (key === "modelsDesc") return b.model_count - a.model_count;
      if (key === "country")
        return countryName(a.country, locale).localeCompare(
          countryName(b.country, locale),
        );
      return a.alias.localeCompare(b.alias);
    },
    (a, b) => a.alias.localeCompare(b.alias),
  );
}
