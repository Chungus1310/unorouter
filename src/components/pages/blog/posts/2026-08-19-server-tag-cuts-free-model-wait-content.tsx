import { DocPageLink } from "@/components/pages/docs/doc-parts";
import { LINK_CHUNKS } from "@/components/pages/blog/post-sections";
import { Link } from "@/i18n/navigation";
import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { getRewardAmounts } from "@/lib/config/rewards";
import { getLocale, getTranslations } from "next-intl/server";

const P = "BLOG.POSTS.SERVER_TAG_CUTS_FREE_MODEL_WAIT";

export async function ServerTagCutsFreeModelWaitContent() {
  const locale = await getLocale();
  const t = await getTranslations();
  const rewards = await getRewardAmounts(locale);
  const values = { ...LINK_CHUNKS, ...APP_VALUES };

  const discord = (chunks: React.ReactNode) =>
    env.discordUrl ? (
      <a href={env.discordUrl} rel="noopener" target="_blank">
        {chunks}
      </a>
    ) : (
      <>{chunks}</>
    );

  return (
    <>
      <p>{t.rich(`${P}.INTRO`, values)}</p>

      <h2 id="what-changes">{t(`${P}.H_WHAT_CHANGES`)}</h2>
      <p>{t.rich(`${P}.P_WHAT_CHANGES_1`, values)}</p>
      <p>{t(`${P}.P_WHAT_CHANGES_2`)}</p>

      <h2 id="how-to-get-it">{t(`${P}.H_HOW_TO_GET_IT`)}</h2>
      <p>
        {t.rich(`${P}.P_HOW_TO_GET_IT`, {
          ...values,
          discord,
        })}
      </p>
      <p>
        {t.rich(`${P}.P_LINKED`, {
          ...values,
          tagReward: rewards.tagReward,
          rewards: (chunks) => (
            <DocPageLink slug="discord-rewards">{chunks}</DocPageLink>
          ),
        })}
      </p>

      <h2 id="what-it-does-not-do">{t(`${P}.H_WHAT_IT_DOES_NOT_DO`)}</h2>
      <p>{t(`${P}.P_NOT_DO_1`, APP_VALUES)}</p>
      <p>
        {t.rich(`${P}.P_NOT_DO_2`, {
          ...values,
          pricing: (chunks) => <Link href="/pricing">{chunks}</Link>,
        })}
      </p>

      <p>
        {t.rich(`${P}.CTA`, {
          ...values,
          discord,
          models: (chunks) => <Link href="/models">{chunks}</Link>,
        })}
      </p>
    </>
  );
}
