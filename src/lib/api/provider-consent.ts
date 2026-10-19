import type { ProviderConsentItem } from "@/openapi";

// The label (its lane tags, families collapsed) is the public name; the alias
// stays an identifier and only fills in for a gateway without labels.
export function providerName(p: ProviderConsentItem): string {
  return p.label || p.alias;
}
