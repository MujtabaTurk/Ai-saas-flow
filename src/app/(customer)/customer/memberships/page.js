import { CustomerPortalShell } from "@/features/customer-portal/components/customer-portal-shell";
import { CustomerMemberships } from "@/features/memberships/components/customer-memberships";
import { getCustomerMemberships } from "@/features/memberships/server";
import { resolveRequestLanguage } from "@/i18n/server";

export const metadata = {
  title: "Customer Memberships | ServiceFlow"
};

export default async function CustomerMembershipsPage() {
  const data = await getCustomerMemberships();
  const language = data.user.locale || (await resolveRequestLanguage());

  return (
    <CustomerPortalShell activePath="/customer/memberships" user={data.user}>
      <CustomerMemberships initialData={data} language={language} />
    </CustomerPortalShell>
  );
}
