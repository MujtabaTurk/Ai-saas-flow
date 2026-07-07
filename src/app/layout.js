import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/noto-sans-arabic";
import "@fontsource-variable/noto-nastaliq-urdu";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { getLanguageDirection } from "@/i18n/settings";
import { resolveRequestLanguage } from "@/i18n/server";

export const metadata = {
  title: "ServiceFlow SaaS",
  description: "AI-assisted booking and subscription platform for service businesses."
};

export default async function RootLayout({ children }) {
  const language = await resolveRequestLanguage();
  const direction = getLanguageDirection(language);

  return (
    <html lang={language} dir={direction} suppressHydrationWarning>
      <body className="font-sans" data-language={language}>
        <AppProviders initialLanguage={language}>{children}</AppProviders>
      </body>
    </html>
  );
}
