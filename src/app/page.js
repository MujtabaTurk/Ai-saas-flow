import { MarketingHomePage } from "@/components/marketing/home-page";
import { getLandingFeaturedBusinesses } from "@/features/businesses/discovery";
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
  let featuredBusinesses = [];

  try {
    featuredBusinesses = await getLandingFeaturedBusinesses();
  } catch (error) {
    console.error("Could not load featured businesses for landing page.", error);
  }

  return <MarketingHomePage featuredBusinesses={featuredBusinesses} />;
}
