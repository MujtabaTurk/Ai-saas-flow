import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata = {
  title: "ServiceFlow SaaS",
  description: "AI-assisted booking and subscription platform for service businesses."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
