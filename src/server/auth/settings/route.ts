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
  type AuthRotationData,
  deleteSelf,
  disable2FA,
  emailBind,
  enable2FA,
  generateAccessToken,
  generateOAuthCodeQuery,
  get2FAStatus,
  getVerificationMethods,
  passkeyDelete,
  passkeyRegisterBegin,
  passkeyRegisterFinish,
  passkeyStatus,
  passkeyVerifyBegin,
  passkeyVerifyFinish,
  sendEmailVerification,
  setup2FA,
  universalVerify,
  updateSelf,
  updateTimeoutPreference,
  updateUserSetting,
} from "@/openapi";
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

  // POST, not GET: Lax cookies ride a cross-site link, so a GET here rotated the
  // victim's token from any page they clicked.
  .post("/token", async ({ upstream }) => {
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

  // POST, not GET: the code only proves control of the NEW address, so a link
  // carrying the attacker's own address and code repointed the victim's reset email.
  .post(
    "/email/bind",
    async ({ body, upstream }) => {
      const res = await emailBind(
        { email: body.email, code: body.code },
        { headers: upstream.headers },
      );
      return unwrap(res);
    },
    { body: emailBindQuery },
  )

  .get("/2fa/status", async ({ upstream }) => {
    const res = await get2FAStatus({ headers: upstream.headers });
    return unwrap(res);
  })

  .get(
    "/verify/methods",
    async ({ query, upstream }) => {
      const res = await getVerificationMethods(
        { scope: query.scope },
        { headers: upstream.headers },
      );
      return unwrap(res);
    },
    { query: verificationMethodsQuery },
  )

  .post(
    "/verify",
    async ({ body, upstream }) => {
      const res = await universalVerify(body, {
        headers: upstream.headers,
      });
      return unwrap(res);
    },
    { body: securityVerifyBody },
  )

  .get(
    "/verify/oauth",
    async ({ query, upstream }) => {
      const res = await generateOAuthCodeQuery(
        {
          provider: query.provider,
          intent: "verify",
          scope: query.scope,
          redirect_uri: query.redirect,
        },
        { headers: upstream.headers },
      );
      return unwrap(res);
    },
    { query: oauthVerifyStateQuery },
  )

  .post(
    "/passkey/verify/begin",
    async ({ body, upstream }) => {
      const res = await passkeyVerifyBegin(body, {
        headers: upstream.headers,
      });
      return unwrap(res);
    },
    { body: passkeyVerifyBeginBody },
  )

  .post(
    "/passkey/verify/finish",
    async ({ body, upstream }) => {
      const res = await passkeyVerifyFinish(body, {
        headers: upstream.headers,
      });
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
      const res = await enable2FA(body, { headers: upstream.headers });
      await keepRotatedSession(cookie, res.data.data);
      return unwrap(res);
    },
    { body: twoFAEnableBody },
  )

  .post("/2fa/disable", async ({ cookie, upstream }) => {
    const res = await disable2FA({ headers: upstream.headers });
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
      const res = await passkeyRegisterFinish(body, {
        headers: upstream.headers,
      });
      await keepRotatedSession(cookie, res.data.data);
      return unwrap(res);
    },
    { body: passkeyRegisterFinishBody },
  )

  .delete("/passkey", async ({ cookie, upstream }) => {
    const res = await passkeyDelete({ headers: upstream.headers });
    await keepRotatedSession(cookie, res.data.data);
    return unwrap(res);
  });
