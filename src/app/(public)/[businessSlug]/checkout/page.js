import { notFound } from "next/navigation";
import { getPublicBookingPaymentContext } from "@/features/bookings/payment";
import { BookingPaymentPage } from "@/features/bookings/components/booking-payment-page";

export default async function BookingCheckoutPage({ params, searchParams }) {
  const { businessSlug } = await params;
  const query = await searchParams;
  if (!query.booking || !query.token) notFound();
  let context;
  try { context = await getPublicBookingPaymentContext({ businessSlug, bookingNumber: query.booking, token: query.token }); } catch (error) { if (error?.status === 404) notFound(); throw error; }
  return <BookingPaymentPage businessSlug={businessSlug} bookingNumber={query.booking} token={query.token} initialBusiness={context.business} initialBooking={context.booking} />;
}
