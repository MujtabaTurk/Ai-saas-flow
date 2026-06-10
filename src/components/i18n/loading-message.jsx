"use client";

import { useTranslation } from "react-i18next";

export function LoadingMessage() {
  const { t } = useTranslation("common");

  return <>{t("loading.message")}</>;
}
