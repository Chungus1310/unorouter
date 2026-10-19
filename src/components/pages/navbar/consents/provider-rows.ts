import { countryName } from "@/components/elements/model/group-data-policy";
import { sortByKeys } from "@/lib/api/model-sort";
import type { ProviderConsentItem } from "@/openapi";

export const PROVIDER_STATUSES = ["given", "missing"] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export const PROVIDER_SORT_VALUES = [
  "activeFirst",
  "activeChannelsDesc",
  "activeModelsDesc",
  "activeLanesDesc",
  "modelsDesc",
  "alias",
  "country",
] as const;
export type ProviderSort = (typeof PROVIDER_SORT_VALUES)[number];
export const DEFAULT_PROVIDER_SORT: readonly ProviderSort[] = [
  "activeFirst",
  "activeChannelsDesc",
  "activeModelsDesc",
  "activeLanesDesc",
];

export type ProviderModel = {
  name: string;
  active: boolean;
  channels: number;
  active_channels: number;
};

// model_details is newer than models; a gateway without it lists names only.
// Most active channels first, then active, then by name.
export function providerModels(p: ProviderConsentItem): ProviderModel[] {
  const details: ProviderModel[] =
    p.model_details && p.model_details.length > 0
      ? p.model_details
      : (p.models ?? []).map((name) => ({
          name,
          active: true,
          channels: 0,
          active_channels: 0,
        }));
  return [...details].sort(
    (a, b) =>
      b.active_channels - a.active_channels ||
      Number(b.active) - Number(a.active) ||
      a.name.localeCompare(b.name),
  );
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
      if (key === "activeChannelsDesc")
        return b.active_channel_count - a.active_channel_count;
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

export type TagGroup = { label: string; tags: string[] };

// Numbered lane families (dahl1..dahl100) collapse into one chip; a prefix
// with a single member stays as the plain tag.
export function groupTags(tags: string[]): TagGroup[] {
  const families = new Map<string, string[]>();
  for (const tag of tags) {
    const prefix = /^(.*?\D)\d+$/.exec(tag)?.[1] ?? tag;
    families.set(prefix, [...(families.get(prefix) ?? []), tag]);
  }
  return [...families.entries()].map(([prefix, members]) => {
    const sorted = [...members].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    return {
      label: sorted.length > 1 ? `${prefix} ×${sorted.length}` : sorted[0]!,
      tags: sorted,
    };
  });
}
