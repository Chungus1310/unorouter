import {
  LINK_CHUNKS,
  PostSections,
} from "@/components/pages/blog/post-sections";
import { APP_VALUES } from "@/lib/config/constants";
import { getTranslations } from "next-intl/server";

export async function ConsentForFreeModelsContent() {
  const t = await getTranslations();

  return (
    <>
      <p>
        <em>
          {t.rich("BLOG.POSTS.CONSENT_FOR_FREE_MODELS.NOTE", {
            ...LINK_CHUNKS,
            ...APP_VALUES,
          })}
        </em>
      </p>
      <PostSections slug="consent-for-free-models" />
    </>
  );
}
