import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta"
});

export const metadata = {
  title: "ServiceFlow SaaS",
  description: "AI-assisted booking and subscription platform for service businesses."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={plusJakartaSans.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
