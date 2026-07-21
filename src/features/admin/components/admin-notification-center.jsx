"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminNotificationCenter() {
  const [data, setData] = useState({ notifications: [], summary: { unread: 0 } });
  const [error, setError] = useState("");

  async function load(unreadOnly = false) {
    const response = await fetch(`/api/admin/notifications${unreadOnly ? "?unreadOnly=true" : ""}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Could not load admin notifications.");
    setData(payload.data);
  }

  useEffect(() => { load().catch((loadError) => setError(loadError.message)); }, []);

  async function markRead(notification) {
    await fetch(`/api/admin/notifications/${notification.id}`, { method: "PATCH" });
    await load();
  }

  return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Admin notification center</CardTitle><p className="text-sm text-muted-foreground">Pending withdrawals, financial alerts, and platform events.</p></div><Button variant="outline" onClick={() => load(true)}>Unread ({data.summary.unread})</Button></div></CardHeader><CardContent className="space-y-3">{error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}{data.notifications.length ? data.notifications.map((notification) => <div className={`rounded-xl border p-4 ${notification.isRead || notification.readAt ? "border-growth-border" : "border-primary bg-primary/5"}`} key={notification.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-growth-sidebar">{notification.title}</p><Badge variant="outline">{notification.type}</Badge>{!notification.isRead && !notification.readAt ? <Badge>Unread</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">{notification.message}</p></div>{!notification.isRead && !notification.readAt ? <Button size="sm" variant="ghost" onClick={() => markRead(notification)}>Mark read</Button> : null}</div></div>) : <p className="text-sm text-muted-foreground">No platform notifications.</p>}</CardContent></Card>;
}
