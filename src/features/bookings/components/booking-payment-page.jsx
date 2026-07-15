"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function apiError(payload, fallback) { return payload?.error?.message || payload?.message || fallback; }

function PaymentForm({ businessSlug, bookingNumber, token }) {
  const [method, setMethod] = useState("CARD");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (method === "CARD") {
        const response = await fetch(`/api/public/businesses/${businessSlug}/bookings/${bookingNumber}/payment`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "checkout", token }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(apiError(payload, "Unable to confirm card payment."));
        if (payload.data?.checkoutUrl) { window.location.assign(payload.data.checkoutUrl); return; }
      } else {
        const response = await fetch(`/api/public/businesses/${businessSlug}/bookings/${bookingNumber}/payment`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "manual", method: "BUSINESS_LOCATION", token }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(apiError(payload, "Unable to select payment method."));
      }
      window.location.href = `/${businessSlug}/booking/${bookingNumber}?token=${token}`;
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }

  return <Card><CardHeader><CardTitle>Payment method</CardTitle></CardHeader><CardContent>
    <div className="grid gap-3">
      <button className={`rounded-2xl border p-4 text-start ${method === "CARD" ? "border-primary bg-primary/5" : "border-growth-border"}`} type="button" onClick={() => setMethod("CARD")}>Pay with Card<span className="mt-1 block text-sm text-muted-foreground">Secure card form powered by Stripe</span></button>
      <button className={`rounded-2xl border p-4 text-start ${method === "BUSINESS_LOCATION" ? "border-primary bg-primary/5" : "border-growth-border"}`} type="button" onClick={() => setMethod("BUSINESS_LOCATION")}>Pay at Business Location<span className="mt-1 block text-sm text-muted-foreground">Your booking is confirmed; payment remains pending until collected.</span></button>
    </div>
    {method === "CARD" ? <div className="mt-5 rounded-2xl bg-growth-dashboard p-4 text-sm text-muted-foreground">You’ll be redirected to Stripe’s secure hosted checkout to enter your card details.</div> : <div className="mt-5 rounded-2xl bg-growth-dashboard p-4 text-sm text-muted-foreground">Payment will be collected at the business location.</div>}
    {message ? <div className="mt-4 rounded-2xl bg-growth-dashboard p-4 text-sm">{message}</div> : null}
    <Button className="mt-5 w-full" disabled={busy} onClick={submit}>{busy ? "Processing…" : method === "CARD" ? "Pay securely" : "Confirm booking"}</Button>
  </CardContent></Card>;
}

export function BookingPaymentPage({ businessSlug, bookingNumber, token, initialBusiness }) {
  return <main className="min-h-screen overflow-x-hidden bg-growth-dashboard px-4 py-10 text-growth-sidebar sm:px-6"><div className="mx-auto max-w-3xl"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Booking payment</p><h1 className="mt-2 text-3xl font-bold">Complete your booking</h1><p className="mt-2 text-muted-foreground">Everything stays inside {initialBusiness.name}.</p></div><Badge variant="warning">Payment required</Badge><div className="mt-4"><PaymentForm {...{ businessSlug, bookingNumber, token }} /></div></div></main>;
}
