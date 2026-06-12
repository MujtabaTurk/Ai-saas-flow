"use client";

import { signOut } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { t } = useTranslation("common");

  return (
    <Button type="button" variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
      {t("actions.signOut")}
    </Button>
  );
}
