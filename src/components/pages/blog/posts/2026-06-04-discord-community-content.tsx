import { LINK_CHUNKS } from "@/components/pages/blog/post-sections";
import { Link } from "@/i18n/navigation";
import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { getTranslations } from "next-intl/server";

export async function DiscordCommunityContent() {
  const t = await getTranslations();
  const values = { ...LINK_CHUNKS, ...APP_VALUES };

  return (
    <>
      <p>{t.rich("BLOG.POSTS.DISCORD_COMMUNITY.INTRO", values)}</p>

      <h2 id="what">{t("BLOG.POSTS.DISCORD_COMMUNITY.H_WHAT")}</h2>
      <p>{t.rich("BLOG.POSTS.DISCORD_COMMUNITY.P_WHAT", values)}</p>

      <h2 id="earn">{t("BLOG.POSTS.DISCORD_COMMUNITY.H_EARN")}</h2>
      <p>{t.rich("BLOG.POSTS.DISCORD_COMMUNITY.P_EARN", values)}</p>

      <h2 id="boost">{t("BLOG.POSTS.DISCORD_COMMUNITY.H_BOOST")}</h2>
      <p>{t("BLOG.POSTS.DISCORD_COMMUNITY.P_BOOST", APP_VALUES)}</p>

      <h2 id="bugs">{t("BLOG.POSTS.DISCORD_COMMUNITY.H_BUGS")}</h2>
      <p>{t.rich("BLOG.POSTS.DISCORD_COMMUNITY.P_BUGS", values)}</p>

      <h2 id="join">{t("BLOG.POSTS.DISCORD_COMMUNITY.H_JOIN")}</h2>
      <p>
        {t.rich("BLOG.POSTS.DISCORD_COMMUNITY.CTA", {
          ...values,
          invite: (chunks) =>
            env.discordUrl ? (
              <a
                href={env.discordUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {chunks}
              </a>
            ) : (
              <>{chunks}</>
            ),
          register: (chunks) => <Link href="/register">{chunks}</Link>,
          settings: (chunks) => <Link href="/settings">{chunks}</Link>,
        })}
      </p>
    </>
  );
}
