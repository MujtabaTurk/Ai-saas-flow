"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"];
const money = (value) => `${(Number(value) || 0).toLocaleString()} credits`;
const date = (value) => value ? new Date(value).toLocaleDateString() : "—";

function statusVariant(status) {
  if (status === "PAID") return "success";
  if (status === "REJECTED") return "destructive";
  if (status === "APPROVED") return "outline";
  return "warning";
}

function BarList({ rows, labelKey, valueKey }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey]) || 0), 1);
  return <div className="space-y-3">{rows.length ? rows.slice(0, 8).map((row) => <div key={`${row[labelKey]}-${row[valueKey]}`}>
    <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate">{row[labelKey]}</span><span className="font-semibold">{money(row[valueKey])}</span></div>
    <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, ((Number(row[valueKey]) || 0) / max) * 100)}%` }} /></div>
  </div>) : <p className="text-sm text-muted-foreground">No data yet.</p>}</div>;
}

export function FinanceCenter({ initialData = null }) {
  const [status, setStatus] = useState("ALL");
  const [data, setData] = useState(initialData);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/finance?status=${status}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message || "Could not load finance data.");
        if (!cancelled) setData(payload.data);
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, [status]);

  const overview = data?.overview || {};
  const monthRows = (data?.revenueByMonth || []).map((row) => ({ label: row.month, amount: row.amount }));

  function exportReport(report, format = "csv") {
    window.location.assign(`/api/admin/finance/export?report=${report}&format=${format}`);
  }

  return <div className="space-y-6">
    {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["Platform Revenue", overview.totalPlatformRevenue],
        ["Pending Credits", overview.totalPendingCredits],
        ["Available Credits", overview.totalAvailableCredits],
        ["Withdrawn Credits", overview.totalWithdrawnCredits],
        ["Outstanding Liability", overview.totalOutstandingLiability]
      ].map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold text-growth-sidebar">{money(value)}</p></CardContent></Card>)}
    </div>
    <Card><CardHeader><CardTitle>Treasury Overview</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[["Current Treasury Balance", overview.treasury?.currentTreasuryBalance], ["Total Collected", overview.treasury?.totalCollectedCredits], ["Total Pending Liability", overview.treasury?.totalPendingLiability], ["Total Available Liability", overview.treasury?.totalAvailableLiability], ["Total Paid Out", overview.treasury?.totalPaidOutCredits]].map(([label, value]) => <div className="rounded-xl border border-growth-border p-3" key={label}><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold text-growth-sidebar">{money(value)}</p></div>)}
    </CardContent></Card>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-growth-sidebar">Finance Operations</h2><p className="text-sm text-muted-foreground">Wallets, payouts, liabilities, and revenue reporting.</p></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => exportReport("withdrawals", "csv")}>Export CSV</Button><Button size="sm" variant="outline" onClick={() => exportReport("withdrawals", "xls")}>Export Excel</Button><Button size="sm" variant="outline" onClick={() => exportReport("revenue", "csv")}>Revenue CSV</Button></div>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Revenue By Month</CardTitle></CardHeader><CardContent><BarList rows={monthRows} labelKey="label" valueKey="amount" /></CardContent></Card>
      <Card><CardHeader><CardTitle>Top Earning Businesses</CardTitle></CardHeader><CardContent><BarList rows={(data?.revenueByBusiness || []).map((row) => ({ label: row.businessName, amount: row.amount }))} labelKey="label" valueKey="amount" /></CardContent></Card>
      <Card><CardHeader><CardTitle>Pending Withdrawal Amounts</CardTitle></CardHeader><CardContent><BarList rows={(data?.pendingWithdrawalAmounts || []).map((row) => ({ label: row.businessName, amount: row.amount }))} labelKey="label" valueKey="amount" /></CardContent></Card>
      <Card><CardHeader><CardTitle>Paid Withdrawal Amounts</CardTitle></CardHeader><CardContent><BarList rows={(data?.paidWithdrawalAmounts || []).map((row) => ({ label: row.businessName, amount: row.amount }))} labelKey="label" valueKey="amount" /></CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>Withdrawal Requests &amp; Payout History</CardTitle><div className="flex flex-wrap gap-2">{STATUSES.map((item) => <Button key={item} size="sm" variant={status === item ? "default" : "outline"} onClick={() => setStatus(item)}>{item}</Button>)}</div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead><tr className="border-b border-growth-border text-muted-foreground"><th className="px-3 py-3">Business</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Request Date</th><th className="px-3 py-3">Approval Date</th><th className="px-3 py-3">Paid Date</th><th className="px-3 py-3">Processed By</th></tr></thead><tbody>{(data?.requests || []).map((request) => <tr className="border-b border-growth-border/70" key={request.id}><td className="px-3 py-3 font-semibold">{request.businessName}</td><td className="px-3 py-3">{money(request.requestedAmount)}</td><td className="px-3 py-3"><Badge variant={statusVariant(request.status)}>{request.status}</Badge></td><td className="px-3 py-3">{date(request.createdAt)}</td><td className="px-3 py-3">{date(request.approvedAt)}</td><td className="px-3 py-3">{date(request.paidAt)}</td><td className="px-3 py-3">{request.processedBy?.name || request.processedBy?.email || "—"}</td></tr>)}</tbody></table></div>{data?.requests?.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No matching withdrawal requests.</p> : null}</CardContent></Card>
  </div>;
}
