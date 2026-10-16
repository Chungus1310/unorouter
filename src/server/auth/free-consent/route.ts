import {
  freeConsentGrantBody,
  freeConsentRevokeBody,
} from "@/lib/api/typebox/free-consent";
import { unwrap } from "@/lib/utils/base";
import {
  getFreeConsents,
  getGuestFreeConsents,
  grantFreeConsent,
  grantGuestFreeConsent,
  revokeFreeConsent,
  revokeGuestFreeConsent,
} from "@/openapi";
import { deriveUpstream, getUserId } from "@/server/constants";
import { Elysia } from "elysia";
import {
  ensureGuestId,
  forgetGuestConsents,
  guestConsentHeaders,
  readGuestId,
} from "./free-consent.service";

// One surface for accounts and guests: a logged-in caller's consent belongs to
// the account, everyone else's to the browser's guest id.
export const freeConsentRoute = new Elysia({ prefix: "/free-consents" })
  .derive(deriveUpstream)

  .get("/", async ({ cookie, upstream }) => {
    if ((await getUserId(cookie, true)) !== null)
      return unwrap(await getFreeConsents({ headers: upstream.headers }));
    const guestId = readGuestId(cookie);
    if (!guestId) return { success: true, message: "", data: { consents: [] } };
    return unwrap(
      await getGuestFreeConsents({ headers: guestConsentHeaders(guestId) }),
    );
  })

  .post(
    "/",
    async ({ body, cookie, upstream }) => {
      if ((await getUserId(cookie, true)) !== null)
        return unwrap(
          await grantFreeConsent(body, { headers: upstream.headers }),
        );
      const guestId = ensureGuestId(cookie);
      forgetGuestConsents(guestId);
      return unwrap(
        await grantGuestFreeConsent(body, {
          headers: guestConsentHeaders(guestId),
        }),
      );
    },
    { body: freeConsentGrantBody },
  )

  .delete(
    "/",
    async ({ body, cookie, upstream }) => {
      if ((await getUserId(cookie, true)) !== null)
        return unwrap(
          await revokeFreeConsent(body, { headers: upstream.headers }),
        );
      const guestId = readGuestId(cookie);
      if (!guestId) return { success: true, message: "ok" };
      forgetGuestConsents(guestId);
      return unwrap(
        await revokeGuestFreeConsent(body, {
          headers: guestConsentHeaders(guestId),
        }),
      );
    },
    { body: freeConsentRevokeBody },
  );
