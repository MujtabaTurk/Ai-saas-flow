import Link from "next/link";
import {
  Activity,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  History,
  ListChecks
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CustomerBookingCard } from "@/features/customer-portal/components/customer-booking-card";
import { formatLocalizedDateTime } from "@/i18n/format";

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-growth-mint text-growth-forest">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {helper ? (
            <p className="text-xs text-muted-foreground">{helper}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ title, description, actionHref = null }) {
  return (
    <div className="rounded-2xl border border-dashed border-growth-border bg-white/70 p-6 text-sm text-muted-foreground">
      <p className="font-semibold text-growth-sidebar">{title}</p>
      <p className="mt-1">{description}</p>
      {actionHref ? (
        <Button asChild className="mt-4" size="sm" variant="outline">
          <Link href={actionHref}>View bookings</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function CustomerDashboard({
  data,
  language = "en"
}) {
  const {
    nextAppointment,
    pastBookings,
    recentActivity,
    stats,
    upcomingBookings,
    user
  } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">
            Customer dashboard
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.displayName}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Track upcoming appointments, booking history, and account activity
            across every business you book with.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/businesses">Browse businesses</Link>
          </Button>
          <Button asChild>
            <Link href="/customer/bookings">View all bookings</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          helper={`${stats.pending} pending, ${stats.confirmed} confirmed`}
          icon={ListChecks}
          label="Total bookings"
          value={stats.total}
        />
        <StatCard
          helper="Pending or confirmed"
          icon={Clock3}
          label="Upcoming"
          value={stats.upcoming}
        />
        <StatCard
          helper="Finished appointments"
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
        />
        <StatCard
          helper={`${stats.canceled} canceled, ${stats.noShow} no-show`}
          icon={History}
          label="Past outcomes"
          value={stats.completed + stats.canceled + stats.noShow}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <CalendarCheck2 className="size-5 text-primary" aria-hidden="true" />
              Next Appointment
            </h2>
          </div>
          {nextAppointment ? (
            <CustomerBookingCard
              booking={nextAppointment}
              language={language}
            />
          ) : (
            <EmptyPanel
              description="When a business confirms or receives your next booking, it will appear here."
              title="No upcoming appointment yet"
            />
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" aria-hidden="true" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Link
                  className="block rounded-2xl border border-growth-border bg-white p-4 transition hover:border-primary"
                  href={activity.href}
                  key={activity.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{activity.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <Badge>{activity.type.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatLocalizedDateTime(
                      activity.occurredAt,
                      user.timezone || "UTC",
                      language,
                      {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }
                    )}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyPanel
                description="Booking updates and reviews will be collected here."
                title="No activity yet"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Upcoming Bookings</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/customer/bookings?scope=upcoming">Open</Link>
            </Button>
          </div>
          <div className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <CustomerBookingCard
                booking={booking}
                compact
                key={booking.id}
                language={language}
              />
            ))
          ) : (
            <EmptyPanel
              description="Your pending and confirmed future bookings will show up here."
              title="No upcoming bookings"
            />
          )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Past Bookings</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/customer/bookings?scope=past">Open</Link>
            </Button>
          </div>
          <div className="space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => (
              <CustomerBookingCard
                booking={booking}
                compact
                key={booking.id}
                language={language}
              />
            ))
          ) : (
            <EmptyPanel
              description="Completed, canceled, and older appointments will appear here."
              title="No past bookings"
            />
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
