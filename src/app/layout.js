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

const themeScript = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem("serviceflow:theme");
      var themePreference =
        storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
          ? storedTheme
          : "system";
      var systemTheme =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      var theme = themePreference === "system" ? systemTheme : themePreference;
      var root = document.documentElement;

      root.classList.toggle("dark", theme === "dark");
      root.dataset.theme = theme;
      root.dataset.themePreference = themePreference;
      root.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "light";
      document.documentElement.dataset.themePreference = "system";
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export default async function RootLayout({ children }) {
  const language = await resolveRequestLanguage();
  const direction = getLanguageDirection(language);

  return (
    <html lang={language} dir={direction} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans" data-language={language}>
        <AppProviders initialLanguage={language}>{children}</AppProviders>
      </body>
    </html>
  );
}
