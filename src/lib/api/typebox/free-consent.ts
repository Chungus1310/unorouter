import { t } from "elysia";

export const freeConsentGrantBody = t.Object({
  model: t.String({ maxLength: 255 }),
  locale: t.String({ maxLength: 16 }),
  text: t.String({ minLength: 1, maxLength: 20000 }),
});

export const freeConsentRevokeBody = t.Object({
  model: t.String({ maxLength: 255 }),
});
