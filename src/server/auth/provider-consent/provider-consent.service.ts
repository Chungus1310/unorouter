import { customFetch } from "@/lib/custom-fetch";
import {
  getGetGuestProviderConsentsUrl,
  getGetProviderConsentsUrl,
  type getGuestProviderConsentsResponse,
  type getProviderConsentsResponse,
} from "@/openapi";

// The generated client has no parameter for ?model=, the gateway reads it from
// the query string.
function withModel(url: string, model: string | undefined) {
  return model ? `${url}?model=${encodeURIComponent(model)}` : url;
}

export function fetchProviderConsents(
  headers: Record<string, string>,
  model?: string,
) {
  return customFetch<getProviderConsentsResponse>(
    withModel(getGetProviderConsentsUrl(), model),
    { headers, method: "GET" },
  );
}

export function fetchGuestProviderConsents(
  headers: Record<string, string>,
  model?: string,
) {
  return customFetch<getGuestProviderConsentsResponse>(
    withModel(getGetGuestProviderConsentsUrl(), model),
    { headers, method: "GET" },
  );
}
