import { CustomerPortalShell } from "@/features/customer-portal/components/customer-portal-shell";
import { CustomerSettingsForm } from "@/features/customer-portal/components/customer-settings-form";
import { getCustomerSettings } from "@/features/customer-portal/server";

export const metadata = {
  title: "Customer Settings | ServiceFlow"
};

export default async function CustomerSettingsPage() {
  const data = await getCustomerSettings();

  return (
    <CustomerPortalShell activePath="/customer/settings" user={data.user}>
      <CustomerSettingsForm data={data} />
    </CustomerPortalShell>
  );
}
