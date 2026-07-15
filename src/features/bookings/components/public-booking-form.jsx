"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreatePublicBooking, usePublicSlots } from "@/features/bookings/hooks/use-bookings";
import { publicBookingFormSchema } from "@/features/bookings/validation/booking-schema";
import { addDaysToDateValue, formatDateTimeInTimezone } from "@/features/availability/time";
import { formatLocalizedDateTime, formatLocalizedMoney } from "@/i18n/format";

const steps = ["Your details", "Date & time", "Review", "Payment", "Confirmation"];

function ServiceInformation({ business, service, language }) {
  return (
    <Card className="mb-8 overflow-hidden lg:mb-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <ScrollArea className="lg:min-h-0 lg:flex-1" viewportProps={{ tabIndex: 0 }}>
        <CardHeader>
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="size-14 shrink-0 rounded-2xl object-cover" src={business.logoUrl} />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-growth-mint font-bold text-growth-sidebar">
                {business.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{business.industry || "Service business"}</p>
              <CardTitle className="mt-1 text-xl">{business.name}</CardTitle>
              {business.description ? <p className="mt-2 text-sm text-muted-foreground">{business.description}</p> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {service?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="size-24 shrink-0 rounded-2xl object-cover" src={service.imageUrl} />
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Category: {business.industry || "Booking service"}</p>
              <h2 className="mt-1 text-lg font-bold text-growth-sidebar">{service?.name || "Select a service"}</h2>
              {service ? <p className="mt-2 text-sm font-semibold text-primary">{service.priceCents == null ? "Free" : formatLocalizedMoney(service.priceCents, service.currency, language)}</p> : null}
              {service?.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p> : null}
              {service ? <p className="mt-3 text-sm font-semibold text-growth-sidebar">{service.durationMin} minutes</p> : null}
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

function Stepper({ current }) {
  return (
    <nav aria-label="Booking progress" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step} className="min-w-0 space-y-2">
          <div className={`flex size-9 items-center justify-center rounded-full text-sm font-bold ${index < current ? "bg-primary text-primary-foreground" : index === current ? "bg-primary text-primary-foreground ring-4 ring-primary/15" : "bg-growth-dashboard text-muted-foreground"}`}>
            {index < current ? <Check className="size-4" /> : index + 1}
          </div>
          <p className={`break-words text-xs font-semibold ${index <= current ? "text-growth-sidebar" : "text-muted-foreground"}`}>{step}</p>
        </div>
      ))}
    </nav>
  );
}

export function PublicBookingForm({ business, services, language = "en" }) {
  const localToday = formatDateTimeInTimezone(new Date(), business.timezone).date;
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [date, setDate] = useState(localToday);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [values, setValues] = useState({ customerName: "", customerEmail: "", customerPhone: "", notes: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const idempotencyKey = useRef(null);
  const service = useMemo(() => services.find((item) => item.id === serviceId), [serviceId, services]);
  const slotsQuery = usePublicSlots(business.slug, serviceId, date);
  const bookingMutation = useCreatePublicBooking(business.slug);
  const slots = slotsQuery.data?.slots || [];
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const next = async () => {
    setError("");
    setFieldErrors({});
    if (step === 0) {
      try {
        await publicBookingFormSchema.pick(["customerName", "customerEmail", "customerPhone", "notes"]).validate(values, { abortEarly: false });
      } catch (validationError) {
        const errors = Object.fromEntries((validationError.inner || []).map((item) => [item.path, item.message]));
        setFieldErrors(errors);
        return setError("Please correct the highlighted fields.");
      }
    }
    if (step === 1 && !selectedSlot) return setError("Choose an available time to continue.");
    if (step < 2) return setStep(step + 1);
    if (step === 2) return setStep(3);
    try {
      idempotencyKey.current ??= globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const result = await bookingMutation.mutateAsync({ ...values, serviceId, startsAt: selectedSlot, idempotencyKey: idempotencyKey.current });
      if (service.requiresPayment) {
        window.location.href = `/${business.slug}/checkout?booking=${result.booking.bookingNumber}&token=${result.customerAccessToken}`;
      } else {
        setConfirmation(result);
      }
    } catch (bookingError) {
      setError(bookingError.message);
    }
  };

  if (confirmation) {
    return (
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <ServiceInformation business={business} language={language} service={service} />
        <div className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          <div className="lg:shrink-0"><Stepper current={4} /></div>
          <ScrollArea className="lg:min-h-0 lg:flex-1" viewportProps={{ tabIndex: 0 }}>
            <Card>
            <CardHeader><Badge variant="success">Booking created</Badge><CardTitle>{confirmation.booking.serviceNameSnapshot}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>Reference: <strong>{confirmation.booking.bookingNumber}</strong></p>
              <p>Status: {confirmation.booking.status}</p>
              <Button asChild><Link href={`/${business.slug}/booking/${confirmation.booking.bookingNumber}?token=${confirmation.customerAccessToken}`}>Manage booking</Link></Button>
            </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
      <ServiceInformation business={business} language={language} service={service} />
      <div className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
        <div className="lg:shrink-0"><Stepper current={step} /></div>
        <ScrollArea className="lg:min-h-0 lg:flex-1" viewportProps={{ tabIndex: 0 }}>
          {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          {step === 0 ? <Card><CardHeader><CardTitle>Tell us about you</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid min-w-0 gap-4 sm:grid-cols-2"><div className="min-w-0 space-y-2"><Label>Full name</Label><Input maxLength={80} value={values.customerName} onChange={(event) => update("customerName", event.target.value)} />{fieldErrors.customerName ? <p className="text-xs text-red-600">{fieldErrors.customerName}</p> : null}</div><div className="min-w-0 space-y-2"><Label>Email</Label><Input maxLength={254} type="email" value={values.customerEmail} onChange={(event) => update("customerEmail", event.target.value)} />{fieldErrors.customerEmail ? <p className="break-words text-xs text-red-600">{fieldErrors.customerEmail}</p> : null}</div><div className="min-w-0 space-y-2"><Label>Phone number</Label><Input maxLength={30} value={values.customerPhone} onChange={(event) => update("customerPhone", event.target.value)} />{fieldErrors.customerPhone ? <p className="text-xs text-red-600">{fieldErrors.customerPhone}</p> : null}</div></div><div className="min-w-0 space-y-2"><Label>Notes <span className="text-muted-foreground">(optional)</span></Label><Textarea maxLength={500} value={values.notes} onChange={(event) => update("notes", event.target.value)} />{fieldErrors.notes ? <p className="text-xs text-red-600">{fieldErrors.notes}</p> : null}</div></CardContent></Card> : null}
          {step === 1 ? <Card><CardHeader><CardTitle>Select a service and time</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-2">{services.map((item) => <button className={`rounded-2xl border p-4 text-start ${serviceId === item.id ? "border-primary bg-primary/5" : "border-growth-border"}`} key={item.id} type="button" onClick={() => { setServiceId(item.id); setSelectedSlot(""); }}>{item.name}<span className="mt-1 block text-sm text-muted-foreground">{item.durationMin} minutes · {item.priceCents == null ? "Free" : formatLocalizedMoney(item.priceCents, item.currency, language)}</span></button>)}</div><div className="space-y-2"><Label><CalendarDays className="mr-2 inline size-4" />Date</Label><Input min={localToday} max={addDaysToDateValue(localToday, business.bookingWindowDays || 30)} type="date" value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(""); }} /></div><div><p className="mb-2 text-sm font-semibold">Available times</p>{slotsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading availability...</p> : <div className="flex flex-wrap gap-2">{slots.map((slot) => <Button key={slot.startsAt} type="button" variant={selectedSlot === slot.startsAt ? "default" : "outline"} onClick={() => setSelectedSlot(slot.startsAt)}>{formatLocalizedDateTime(slot.startsAt, business.timezone, language, { hour: "numeric", minute: "2-digit" })}</Button>)}</div>}</div></CardContent></Card> : null}
          {step === 2 ? <Card><CardHeader><CardTitle>Review your booking</CardTitle></CardHeader><CardContent className="text-sm"><p><span className="text-muted-foreground">Payment method</span><br /><span className="font-semibold">{service?.requiresPayment ? "Choose on secure payment page" : "No payment required"}</span></p></CardContent></Card> : null}
          {step === 3 ? <Card><CardHeader><CardTitle>{service?.requiresPayment ? "Choose how to pay" : "Complete your booking"}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-2xl border border-growth-border p-4"><CreditCard className="mb-2 size-5 text-primary" /><p className="font-semibold">{service?.requiresPayment ? "Payment is required for this service." : "Payment not required"}</p><p className="mt-1 text-sm text-muted-foreground">{service?.requiresPayment ? "You'll choose card or pay at the business location on the secure payment page." : "Continue to create your booking."}</p></div></CardContent></Card> : null}
        </ScrollArea>
        <div className="mt-5 flex shrink-0 justify-between gap-3"><Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft className="mr-2 size-4" />Back</Button><Button type="button" disabled={bookingMutation.isPending} onClick={next}>{bookingMutation.isPending ? "Creating..." : step === 3 ? (service?.requiresPayment ? "Continue to payment" : "Complete booking") : "Continue"}<ChevronRight className="ml-2 size-4" /></Button></div>
      </div>
    </div>
  );
}
