import { setSessionCookies } from "@/lib/api/auth";
import { twoFAEnableBody, verificationQuery } from "@/lib/api/typebox/common";
import {
  emailBindQuery,
  passkeyRegisterFinishBody,
  passkeyVerifyBeginBody,
  oauthVerifyStateQuery,
  passkeyVerifyFinishBody,
  securityVerifyBody,
  updateSelfBody,
  updateSettingBody,
  updateTimeoutBody,
  verificationMethodsQuery,
} from "@/lib/api/typebox/settings";
import { unwrap } from "@/lib/utils/base";
import {
  deleteSelf,
  emailBind,
  generateAccessToken,
  passkeyRegisterBegin,
  passkeyStatus,
  sendEmailVerification,
  updateSelf,
  updateTimeoutPreference,
  updateUserSetting,
} from "@/openapi";
import {
  type AuthRotationData,
  beginPasskeyVerification,
  deletePasskeyWithProof,
  disable2FAWithProof,
  enable2FAEnrollment,
  finishPasskeyRegistration,
  finishPasskeyVerification,
  get2FAStatus,
  getVerificationMethods,
  setup2FA,
  startOAuthVerification,
  verifySecurity,
} from "@/lib/api/gateway-gaps";
import { Elysia, type Context } from "elysia";
import { deriveUpstream, getUserId } from "@/server/constants";

// Changing 2FA or the passkey bumps the user's auth version, so the old token
// stops working and the gateway hands back its replacement.
async function keepRotatedSession(
  cookie: Context["cookie"],
  data: AuthRotationData | undefined,
) {
  if (!data?.access_token) return;
  await setSessionCookies(
    cookie,
    await getUserId(cookie),
    data.access_token,
    data.access_expires_at,
  );
}

export const settingsRoute = new Elysia({ prefix: "/settings" })
  .derive(deriveUpstream)

  .put(
    "/self",
    async ({ body, upstream }) => {
      const res = await updateSelf({
        headers: {
          "Content-Type": "application/json",
          ...upstream.headers,
        },
        body: JSON.stringify(body),
      });
      return unwrap(res);
    },
    { body: updateSelfBody },
  )

  .delete("/self", async ({ upstream }) => {
    const res = await deleteSelf({ headers: upstream.headers });
    return unwrap(res);
  })

  .get("/token", async ({ upstream }) => {
    const res = await generateAccessToken({ headers: upstream.headers });
    return unwrap(res);
  })

  .post(
    "/setting",
    async ({ body, upstream }) => {
      const res = await updateUserSetting(body, {
        headers: upstream.headers,
      });
      return unwrap(res);
    },
    { body: updateSettingBody },
  )

  .put(
    "/timeout",
    async ({ body, upstream }) => {
      const res = await updateTimeoutPreference(body, {
        headers: upstream.headers,
      });
      return unwrap(res);
    },
    { body: updateTimeoutBody },
  )

  .get(
    "/verification",
    async ({ query, upstream }) => {
      const res = await sendEmailVerification(
        { email: query.email, turnstile: query.turnstile },
        { headers: upstream.headers },
      );
      return unwrap(res);
    },
    { query: verificationQuery },
  )

  .get(
    "/email/bind",
    async ({ query, upstream }) => {
      const res = await emailBind(
        { email: query.email, code: query.code },
        { headers: upstream.headers },
      );
      return unwrap(res);
    },
    { query: emailBindQuery },
  )

  .get("/2fa/status", async ({ upstream }) => {
    const res = await get2FAStatus({ headers: upstream.headers });
    return unwrap(res);
  })

  .get(
    "/verify/methods",
    async ({ query, upstream }) => {
      const res = await getVerificationMethods(query.scope, upstream);
      return unwrap(res);
    },
    { query: verificationMethodsQuery },
  )

  .post(
    "/verify",
    async ({ body, upstream }) => {
      const res = await verifySecurity(body, upstream);
      return unwrap(res);
    },
    { body: securityVerifyBody },
  )

  .get(
    "/verify/oauth",
    async ({ query, upstream }) => {
      const res = await startOAuthVerification(
        {
          provider: query.provider,
          scope: query.scope,
          redirect_uri: query.redirect,
        },
        upstream,
      );
      return unwrap(res);
    },
    { query: oauthVerifyStateQuery },
  )

  .post(
    "/passkey/verify/begin",
    async ({ body, upstream }) => {
      const res = await beginPasskeyVerification(body, upstream);
      return unwrap(res);
    },
    { body: passkeyVerifyBeginBody },
  )

  .post(
    "/passkey/verify/finish",
    async ({ body, upstream }) => {
      const res = await finishPasskeyVerification(body, upstream);
      return unwrap(res);
    },
    { body: passkeyVerifyFinishBody },
  )

  .post("/2fa/setup", async ({ upstream }) => {
    const res = await setup2FA({ headers: upstream.headers });
    return unwrap(res);
  })

  .post(
    "/2fa/enable",
    async ({ body, cookie, upstream }) => {
      const res = await enable2FAEnrollment(body, upstream);
      await keepRotatedSession(cookie, res.data.data);
      return unwrap(res);
    },
    { body: twoFAEnableBody },
  )

  .post("/2fa/disable", async ({ cookie, upstream }) => {
    const res = await disable2FAWithProof(upstream);
    await keepRotatedSession(cookie, res.data.data);
    return unwrap(res);
  })

  .get("/passkey", async ({ upstream }) => {
    const res = await passkeyStatus({ headers: upstream.headers });
    return unwrap(res);
  })

  .post("/passkey/register/begin", async ({ upstream }) => {
    const res = await passkeyRegisterBegin({ headers: upstream.headers });
    return unwrap(res);
  })

  .post(
    "/passkey/register/finish",
    async ({ body, cookie, upstream }) => {
      const res = await finishPasskeyRegistration(body, upstream);
      await keepRotatedSession(cookie, res.data.data);
      return unwrap(res);
    },
    { body: passkeyRegisterFinishBody },
  )

  .delete("/passkey", async ({ cookie, upstream }) => {
    const res = await deletePasskeyWithProof(upstream);
    await keepRotatedSession(cookie, res.data.data);
    return unwrap(res);
  });
