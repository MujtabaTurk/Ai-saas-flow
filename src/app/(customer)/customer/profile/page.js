import { CustomerPortalShell } from "@/features/customer-portal/components/customer-portal-shell";
import { CustomerProfileForm } from "@/features/customer-portal/components/customer-profile-form";
import { getCustomerProfile } from "@/features/customer-portal/server";

export const metadata = {
  title: "Customer Profile | ServiceFlow"
};

export default async function CustomerProfilePage() {
  const data = await getCustomerProfile();

  return (
    <CustomerPortalShell activePath="/customer/profile" user={data.user}>
      <CustomerProfileForm data={data} />
    </CustomerPortalShell>
  );
}
