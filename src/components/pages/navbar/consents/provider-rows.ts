import { countryName } from "@/components/elements/model/group-data-policy";
import { sortByKeys } from "@/lib/api/model-sort";
import type { ProviderConsentItem } from "@/openapi";

export const PROVIDER_STATUSES = ["given", "missing"] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export const PROVIDER_SORT_VALUES = [
  "activeFirst",
  "activeModelsDesc",
  "activeLanesDesc",
  "modelsDesc",
  "alias",
  "country",
] as const;
export type ProviderSort = (typeof PROVIDER_SORT_VALUES)[number];
export const DEFAULT_PROVIDER_SORT: readonly ProviderSort[] = [
  "activeFirst",
  "activeModelsDesc",
  "activeLanesDesc",
];

export type ProviderModel = { name: string; active: boolean };

// model_details is newer than models; a gateway without it lists names only.
export function providerModels(p: ProviderConsentItem): ProviderModel[] {
  if (p.model_details && p.model_details.length > 0) return p.model_details;
  return (p.models ?? []).map((name) => ({ name, active: true }));
}

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
      if (key === "activeFirst") return Number(b.active) - Number(a.active);
      if (key === "activeModelsDesc")
        return b.active_model_count - a.active_model_count;
      if (key === "activeLanesDesc")
        return b.active_lane_count - a.active_lane_count;
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
