import { FAR_FUTURE } from "@/lib/config/constants";
import { unwrap } from "@/lib/utils/base";
import { getQuotaDataSummary } from "@/openapi";
import { Elysia } from "elysia";

// Anonymous homepage ticker: only the totals it renders, never quota (revenue).
export const statsRoute = new Elysia({ prefix: "/stats" }).get(
  "/history",
  async () => {
    const res = await getQuotaDataSummary({
      start_timestamp: 0,
      end_timestamp: FAR_FUTURE,
    });
    const summary = unwrap(res).data;
    return {
      count: summary.count,
      token_used: summary.token_used,
      avg_tpm: summary.avg_tpm,
    };
  },
);
