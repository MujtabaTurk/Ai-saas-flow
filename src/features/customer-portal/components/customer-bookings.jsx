import Link from "next/link";
import { Filter, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CustomerBookingCard } from "@/features/customer-portal/components/customer-booking-card";
import { cn } from "@/lib/utils";

const scopeOptions = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" }
];

const statusOptions = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW"
];

function buildFilterHref(scope, status) {
  const params = new URLSearchParams();

  if (scope && scope !== "all") {
    params.set("scope", scope);
  }

  if (status && status !== "ALL") {
    params.set("status", status);
  }

  const query = params.toString();

  return query ? `/customer/bookings?${query}` : "/customer/bookings";
}

function statusLabel(status) {
  return status.toLowerCase().replace("_", " ");
}

export function CustomerBookings({
  data,
  language = "en",
  scope = "all",
  status = "ALL"
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">
            Customer bookings
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Your appointments
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Review upcoming and past bookings across every linked customer
            profile.
          </p>
        </div>
        <Badge>
          {data.summary.filteredTotal} of {data.summary.total}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5 text-primary" aria-hidden="true" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {scopeOptions.map((option) => (
              <Button
                asChild
                key={option.value}
                size="sm"
                variant={scope === option.value ? "default" : "outline"}
              >
                <Link href={buildFilterHref(option.value, status)}>
                  {option.label}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = status === option;

              return (
                <Link
                  className={cn(
                    "rounded-full border border-growth-border bg-white px-3 py-1 text-xs font-semibold capitalize text-muted-foreground transition hover:border-primary hover:text-growth-sidebar",
                    isActive && "border-primary bg-growth-mint text-growth-sidebar"
                  )}
                  href={buildFilterHref(scope, option)}
                  key={option}
                >
                  {statusLabel(option)}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {data.bookings.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.bookings.map((booking) => (
            <CustomerBookingCard
              booking={booking}
              key={booking.id}
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-growth-border bg-white/70 p-8 text-center">
          <Inbox className="mx-auto size-10 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">No bookings found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Try a different filter or book through a business page using the
            same verified email address.
          </p>
        </div>
      )}
    </div>
  );
}
