import { getCustomerBookingContext } from "@/features/customer-portal/server";
import { handleApiError } from "@/lib/api/handle-api-error";

export const runtime = "nodejs";

function formatIcsDate(value) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildIcs({ booking, business }) {
  const summary = `${booking.serviceNameSnapshot} at ${business.name}`;
  const description = [
    `Booking reference: ${booking.bookingNumber}`,
    `Status: ${booking.status}`,
    `Business: ${business.name}`,
    business.phone ? `Business phone: ${business.phone}` : null,
    business.email ? `Business email: ${business.email}` : null
  ].filter(Boolean);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ServiceFlow//Customer Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(booking.id)}@serviceflow`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(booking.startsAt)}`,
    `DTEND:${formatIcsDate(booking.endsAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description.join("\n"))}`,
    `LOCATION:${escapeIcsText(business.name)}`,
    `STATUS:${booking.status === "CANCELED" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

export async function GET(_request, { params }) {
  try {
    const { bookingId } = await params;
    const { booking, business } = await getCustomerBookingContext({
      bookingId
    });
    const filename = `booking-${booking.bookingNumber}.ics`;

    return new Response(buildIcs({ booking, business }), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
