import { Elysia } from "elysia";
import { authRoute as authAccountRoute } from "./account/route";
import { freeConsentRoute } from "./free-consent/route";
import { ownPurposeObjectionRoute } from "./own-purpose-objection/route";
import { settingsRoute } from "./settings/route";

export const authDomainRoute = new Elysia({ prefix: "/auth" })
  .use(authAccountRoute)
  .use(settingsRoute)
  .use(freeConsentRoute)
  .use(ownPurposeObjectionRoute);
