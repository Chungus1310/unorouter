import { Elysia } from "elysia";
import { authRoute as authAccountRoute } from "./account/route";
import { freeConsentRoute } from "./free-consent/route";
import { ownPurposeObjectionRoute } from "./own-purpose-objection/route";
import { providerConsentRoute } from "./provider-consent/route";
import { settingsRoute } from "./settings/route";
import { termsAcceptanceRoute } from "./terms-acceptance/route";

export const authDomainRoute = new Elysia({ prefix: "/auth" })
  .use(authAccountRoute)
  .use(settingsRoute)
  .use(freeConsentRoute)
  .use(ownPurposeObjectionRoute)
  .use(providerConsentRoute)
  .use(termsAcceptanceRoute);
