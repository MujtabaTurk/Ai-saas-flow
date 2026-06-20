import Link from "next/link";
import {
  CalendarClock,
  Clock,
  RotateCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerBookingActions } from "@/features/customer-portal/components/customer-booking-actions";
import {
  formatLocalizedDateTime,
  formatLocalizedMoney
} from "@/i18n/format";

function statusVariant(status) {
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return "success";
  }

  if (status === "PENDING") {
    return "warning";
  }

  if (status === "CANCELED" || status === "NO_SHOW") {
    return "destructive";
  }

  return "default";
}

function formatStatus(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", " ");
}

export function CustomerBookingCard({
  booking,
  language = "en",
  compact = false
}) {
  const startsAt = formatLocalizedDateTime(
    booking.startsAt,
    booking.timezone,
    language,
    {
      dateStyle: compact ? "medium" : "full",
      timeStyle: "short"
    }
  );
  const price =
    booking.servicePriceCents === null ||
    booking.servicePriceCents === undefined
      ? "Free"
      : formatLocalizedMoney(
          booking.servicePriceCents,
          booking.serviceCurrencySnapshot,
          language
        );

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">
              {booking.business.name}
            </p>
            <h3 className="mt-1 text-lg font-bold">
              {booking.serviceNameSnapshot}
            </h3>
          </div>
          <Badge variant={statusVariant(booking.status)}>
            {formatStatus(booking.status)}
          </Badge>
        </div>

        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="flex gap-2">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{startsAt}</span>
          </div>
          <div className="flex gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {booking.serviceDurationMinSnapshot} min | {price}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-growth-border pt-4">
          <p className="text-sm text-muted-foreground">
            Ref {booking.bookingNumber}
          </p>
          <div className="flex flex-wrap gap-2">
            <CustomerBookingActions
              bookingId={booking.id}
              language={language}
            />
            <Button asChild size="sm" variant="outline">
              <Link href={`/${booking.business.slug}`}>
                <RotateCcw className="mr-2 size-4" aria-hidden="true" />
                Book again
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
