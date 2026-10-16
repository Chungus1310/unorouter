import { FreeModelsPage } from "@/components/pages/navbar/free-models/free-models-page";
import { pageMetadata } from "@/lib/seo/metadata";

export function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata({
    props,
    namespace: "FREE_CONSENT",
    href: "/free-models",
    robots: false,
  });
}

export default function Page() {
  return <FreeModelsPage />;
}
