import { Type as t, type Static } from "@sinclair/typebox/type";
import type {
  PricingCatalogDetail,
  PricingModelGroupsData,
  UserGroupInfo,
} from "@/openapi";

export const promptsPolicySchema = t.Union([
  t.Literal("none"),
  t.Literal("retains"),
  t.Literal("trains"),
  t.Literal("unknown"),
]);
export type PromptsPolicy = Static<typeof promptsPolicySchema>;

export const transferBasisSchema = t.Union([
  t.Literal("adequacy"),
  t.Literal("dpf"),
  t.Literal("scc"),
  t.Literal("none"),
  t.Literal("unknown"),
]);
export type TransferBasis = Static<typeof transferBasisSchema>;

// Most conservative profile across the channels behind a group.
export type GroupDataPolicy = {
  seat_country?: string;
  prompts?: PromptsPolicy;
  transfer?: TransferBasis;
  unsafe_third_country?: boolean;
};

// A group without any recorded policy is absent from the map.
export type GroupProviders = Record<string, GroupDataPolicy>;

// The gateway sends these before src/openapi.ts does; once `bun openapi` runs
// against a gateway that has them, the generated types alone cover this.
export type ModelDetailData = PricingCatalogDetail & {
  group_providers?: GroupProviders;
};

export type ModelGroupsData = PricingModelGroupsData & {
  group_providers?: GroupProviders;
};

export type UserGroup = UserGroupInfo & GroupDataPolicy;
