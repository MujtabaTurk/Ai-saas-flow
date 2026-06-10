"use client";

import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { t } = useTranslation("common");
  const translatedFeatures = t("landing.features", { returnObjects: true });
  const features = Array.isArray(translatedFeatures) ? translatedFeatures : [];

  return (
    <main className="min-h-screen bg-growth-dashboard px-6 py-12">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex justify-end">
          <LanguageSwitcher className="w-56 text-growth-sidebar" />
        </div>
        <div className="max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-growth-border bg-white px-4 py-2 text-sm font-medium text-growth-forest">
            {t("landing.badge")}
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-growth-sidebar md:text-6xl">
            {t("landing.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("landing.description")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>{t("actions.startBuilding")}</Button>
            <Button variant="outline">{t("actions.viewArchitecture")}</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((item) => (
            <Card key={item}>
              <CardHeader>
                <CardTitle>{item}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {t("landing.featureDescription")}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
