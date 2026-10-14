import { msg } from "@/lib/config/constants";
import { arrayBufferToBase64, base64ToUint8, isRecord } from "@/lib/utils/base";

// go-webauthn reads and writes binary fields as unpadded base64url.
function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return base64ToUint8(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

function toBase64Url(buf: ArrayBuffer): string {
  return arrayBufferToBase64(buf)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toRequestOptions(
  assertion: unknown,
): PublicKeyCredentialRequestOptions {
  const publicKey = isRecord(assertion) ? assertion.publicKey : undefined;
  if (!isRecord(publicKey) || typeof publicKey.challenge !== "string")
    throw new Error(msg("ERRORS.UNEXPECTED_RESPONSE"));
  const allowed = Array.isArray(publicKey.allowCredentials)
    ? publicKey.allowCredentials
    : [];
  const allowCredentials: PublicKeyCredentialDescriptor[] = allowed.flatMap(
    (credential) =>
      isRecord(credential) && typeof credential.id === "string"
        ? [{ type: "public-key", id: fromBase64Url(credential.id) }]
        : [],
  );
  const uv = publicKey.userVerification;
  return {
    challenge: fromBase64Url(publicKey.challenge),
    rpId: typeof publicKey.rpId === "string" ? publicKey.rpId : undefined,
    timeout:
      typeof publicKey.timeout === "number" ? publicKey.timeout : undefined,
    userVerification:
      uv === "required" || uv === "preferred" || uv === "discouraged"
        ? uv
        : "required",
    allowCredentials,
  };
}

// Runs the browser passkey prompt for a gateway assertion. Null when the
// browser returns something other than an assertion.
export async function getPasskeyAssertion(assertion: unknown) {
  const credential = await navigator.credentials.get({
    publicKey: toRequestOptions(assertion),
  });
  if (!(credential instanceof PublicKeyCredential)) return null;
  const response = credential.response;
  if (!(response instanceof AuthenticatorAssertionResponse)) return null;
  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: "public-key" as const,
    response: {
      authenticatorData: toBase64Url(response.authenticatorData),
      clientDataJSON: toBase64Url(response.clientDataJSON),
      signature: toBase64Url(response.signature),
      ...(response.userHandle && {
        userHandle: toBase64Url(response.userHandle),
      }),
    },
  };
}
