import {
  needsTransferConsent,
  usesInputsForOwnPurposes,
} from "@/lib/api/own-purpose";
import { unwrap } from "@/lib/utils/base";
import { ownPurposeEnabled } from "@/server/auth/free-consent/free-consent.service";
import {
  getPricingCatalog,
  getPricingCounts,
  getPricingModelGroups,
  getPricingVendors,
} from "@/openapi";
import {
  getCatalog,
  getImageModels,
  getTaskImageModels,
  getModelByName,
  getSubscriptionPlansSummary,
} from "@/server/models/pricing/pricing.service";
import { Elysia, t } from "elysia";
import type { ModelGroupsData } from "@/lib/validation/data-policy";

export const pricingRoute = new Elysia({ prefix: "/pricing" })
  .get("/counts", async () => unwrap(await getPricingCounts()))

  .get("/vendors", async () => unwrap(await getPricingVendors()))

  .get("/browse", async () => getCatalog(true))

  .get("/catalog", async () => getCatalog())

  // Offline ones included: a consent can be given before the model is back.
  // Paid models whose providers use inputs for their own purposes belong here
  // too; the route keeps its old name.
  .get("/free-models", async () => {
    const enabled = await ownPurposeEnabled();
    return (await getCatalog(false, true)).models.filter(
      (m) =>
        m.is_free ||
        needsTransferConsent(m, enabled) ||
        usesInputsForOwnPurposes(m, enabled),
    );
  })

  .get("/image-models", async () => getImageModels())

  .get("/task-image-models", async () => getTaskImageModels())

  .get(
    "/vendor",
    async (ctx) =>
      unwrap(
        await getPricingCatalog({
          vendor: ctx.query.name,
          include_offline: true,
        }),
      ).models,
    { query: t.Object({ name: t.String() }) },
  )

  .get(
    "/detail",
    async (ctx) => {
      const model = await getModelByName(ctx.query.model);
      if (!model) ctx.set.status = 404;
      return model;
    },
    { query: t.Object({ model: t.String() }) },
  )

  .get(
    "/model-groups",
    async (ctx): Promise<ModelGroupsData> =>
      unwrap(await getPricingModelGroups({ model: ctx.query.model })),
    { query: t.Object({ model: t.String() }) },
  )

  .get("/subscriptions", async () => getSubscriptionPlansSummary());
