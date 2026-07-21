"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const money = (amount) => `${(Number(amount) || 0).toLocaleString()} credits`;

async function loadRequests() {
  const response = await fetch("/api/admin/withdrawals", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "Could not load withdrawal requests.");
  return payload.data?.requests || [];
}

async function processRequest(id, action) {
  const response = await fetch(`/api/admin/withdrawals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "Could not process withdrawal request.");
  return payload.data?.withdrawal;
}

function statusVariant(status) {
  if (status === "PAID") return "success";
  if (status === "REJECTED") return "destructive";
  if (status === "APPROVED") return "outline";
  return "warning";
}

export function WithdrawalManagement() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setRequests(await loadRequests());
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    loadRequests()
      .then((loadedRequests) => {
        if (!cancelled) {
          setRequests(loadedRequests);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function act(request, action) {
    setProcessing(request.id);
    setError("");
    try {
      await processRequest(request.id, action);
      setSelected(null);
      await refresh();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setProcessing("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <p className="text-sm text-muted-foreground">Review and manually process business withdrawal requests.</p>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">Loading requests...</p> : requests.length === 0 ? <p className="text-sm text-muted-foreground">No withdrawal requests.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="border-b border-growth-border text-muted-foreground"><th className="px-3 py-3">Business</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Created Date</th><th className="px-3 py-3">Actions</th></tr></thead>
              <tbody>{requests.map((request) => <tr className="border-b border-growth-border/70" key={request.id}>
                <td className="px-3 py-4 font-semibold">{request.business?.name || request.businessId}</td>
                <td className="px-3 py-4">{money(request.requestedAmount)}</td>
                <td className="px-3 py-4"><Badge variant={statusVariant(request.status)}>{request.status}</Badge></td>
                <td className="px-3 py-4">{new Date(request.createdAt).toLocaleString()}</td>
                <td className="px-3 py-4"><div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(request)}>View</Button>
                  {request.status === "PENDING" ? <><Button disabled={processing === request.id} size="sm" onClick={() => act(request, "APPROVE")}>Approve</Button><Button disabled={processing === request.id} size="sm" variant="destructive" onClick={() => act(request, "REJECT")}>Reject</Button></> : null}
                  {request.status === "APPROVED" ? <Button disabled={processing === request.id} size="sm" onClick={() => act(request, "PAID")}>Mark as Paid</Button> : null}
                </div></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
        {selected ? <div className="mt-5 rounded-xl border border-growth-border bg-growth-dashboard p-4 text-sm"><div className="flex justify-between gap-3"><p className="font-semibold">Request details</p><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button></div><p className="mt-3">Request ID: {selected.id}</p><p>Notes: {selected.notes || "None"}</p><p>Wallet ID: {selected.walletId}</p><p>Processed by: {selected.processedByUserId || "Not processed"}</p></div> : null}
      </CardContent>
    </Card>
  );
}
