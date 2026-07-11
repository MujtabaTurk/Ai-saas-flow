import { MarketingHomePage } from "@/components/marketing/home-page";
import { getServerTranslator, resolveRequestLanguage } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const language = await resolveRequestLanguage();
  const t = await getServerTranslator(language, "public");

  return {
    title: t("metadata.home.title"),
    description: t("metadata.home.description")
  };
}

export default async function HomePage() {
  return <MarketingHomePage />;
}
