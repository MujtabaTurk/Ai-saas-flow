import { CustomerBookings } from "@/features/customer-portal/components/customer-bookings";
import { CustomerPortalShell } from "@/features/customer-portal/components/customer-portal-shell";
import { getCustomerBookings } from "@/features/customer-portal/server";
import { resolveRequestLanguage } from "@/i18n/server";

export const metadata = {
  title: "Customer Bookings | ServiceFlow"
};

const scopeValues = ["all", "upcoming", "past"];
const statusValues = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW"
];

export default async function CustomerBookingsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const requestedScope =
    typeof resolvedSearchParams?.scope === "string"
      ? resolvedSearchParams.scope
      : "all";
  const requestedStatus =
    typeof resolvedSearchParams?.status === "string"
      ? resolvedSearchParams.status
      : "ALL";
  const scope = scopeValues.includes(requestedScope)
    ? requestedScope
    : "all";
  const status = statusValues.includes(requestedStatus)
    ? requestedStatus
    : "ALL";
  const data = await getCustomerBookings({ scope, status });
  const language = data.user.locale || (await resolveRequestLanguage());

  return (
    <CustomerPortalShell activePath="/customer/bookings" user={data.user}>
      <CustomerBookings
        data={data}
        language={language}
        scope={scope}
        status={status}
      />
    </CustomerPortalShell>
  );
}
