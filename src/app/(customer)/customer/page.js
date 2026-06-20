import { CustomerDashboard } from "@/features/customer-portal/components/customer-dashboard";
import { CustomerPortalShell } from "@/features/customer-portal/components/customer-portal-shell";
import { getCustomerDashboard } from "@/features/customer-portal/server";
import { resolveRequestLanguage } from "@/i18n/server";

export const metadata = {
  title: "Customer Dashboard | ServiceFlow"
};

export default async function CustomerPortalPage() {
  const data = await getCustomerDashboard();
  const language = data.user.locale || (await resolveRequestLanguage());

  return (
    <CustomerPortalShell activePath="/customer" user={data.user}>
      <CustomerDashboard data={data} language={language} />
    </CustomerPortalShell>
  );
}
