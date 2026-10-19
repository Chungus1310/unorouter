"use client";

import { matchesModality, OUTPUT_MODALITIES } from "@/lib/api/model-modality";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  CONSENT_KINDS,
  CONSENT_STATUSES,
  PRICE_KINDS,
  type ConsentRow,
} from "./consent-rows";

const PARSERS = {
  q: parseAsString.withDefault(""),
  modality: parseAsStringLiteral(OUTPUT_MODALITIES).withDefault("all"),
  status: parseAsArrayOf(parseAsStringLiteral(CONSENT_STATUSES)).withDefault(
    [],
  ),
  kind: parseAsArrayOf(parseAsStringLiteral(CONSENT_KINDS)).withDefault([]),
  country: parseAsArrayOf(parseAsString).withDefault([]),
  price: parseAsArrayOf(parseAsStringLiteral(PRICE_KINDS)).withDefault([]),
  view: parseAsStringLiteral(["table", "list"] as const).withDefault("table"),
};

export function useConsentFilters(rows: ConsentRow[]) {
  const [params, setParams] = useQueryStates(PARSERS);

  const needle = params.q.trim().toLowerCase();
  // Everything but the modality, so the tab counts follow the other filters
  // the way they do on the models page.
  const tabRows = rows.filter((row) => {
    const m = row.model;
    const matchesSearch =
      needle.length === 0 ||
      m.model_name.toLowerCase().includes(needle) ||
      (m.vendor?.toLowerCase().includes(needle) ?? false);
    const matchesStatus =
      params.status.length === 0 ||
      params.status.some((status) => status === row.status);
    const matchesKind =
      params.kind.length === 0 || params.kind.includes(row.kind);
    const matchesCountry =
      params.country.length === 0 ||
      row.countries.some((code) => params.country.includes(code));
    const matchesPrice =
      params.price.length === 0 ||
      params.price.includes(m.is_free ? "free" : "paid");
    return (
      matchesSearch &&
      matchesStatus &&
      matchesKind &&
      matchesCountry &&
      matchesPrice
    );
  });
  const filtered = tabRows.filter((row) =>
    matchesModality(row.model, params.modality),
  );

  const activeFilterCount =
    params.status.length +
    params.kind.length +
    params.country.length +
    params.price.length +
    (params.modality !== "all" ? 1 : 0) +
    (needle.length > 0 ? 1 : 0);

  function reset() {
    void setParams({
      q: null,
      modality: null,
      status: null,
      kind: null,
      country: null,
      price: null,
    });
  }

  return {
    params,
    setParams,
    tabRows,
    filtered,
    activeFilterCount,
    reset,
  };
}
