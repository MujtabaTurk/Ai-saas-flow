"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal, ModalError, ModalFooter } from "@/components/ui/modal";
import { HorizontalScrollArea } from "@/components/ui/scroll-area";
import { MetricCardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  createWithdrawal,
  fetchWallet,
  fetchWalletTransactions,
  fetchWithdrawals
} from "@/features/wallet/api";

const EMPTY_WALLET = {
  currentBalance: 0,
  availableCredits: 0,
  pendingCredits: 0,
  holdCredits: 0,
  withdrawnCredits: 0,
  lifetimeCredits: 0,
  monthlyRevenue: 0,
  currency: "USD"
};

const STATISTICS = [
  ["Current Balance", "currentBalance"],
  ["Available Credits", "availableCredits"],
  ["Pending Credits", "pendingCredits"],
  ["Hold Credits", "holdCredits"],
  ["Withdrawn Credits", "withdrawnCredits"],
  ["Lifetime Credits", "lifetimeCredits"],
  ["Monthly Revenue", "monthlyRevenue"]
];

const TRANSACTION_FILTERS = [
  ["ALL", "All"],
  ["PAYMENT", "Payment"],
  ["RELEASE", "Release"],
  ["WITHDRAWAL", "Withdrawal"],
  ["REFUND", "Refund"],
  ["ADJUSTMENT", "Adjustment"]
];

function statusVariant(status) {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "destructive";
  return "warning";
}

function formatTransactionDate(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function TransactionHistory() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const transactionsQuery = useQuery({
    queryKey: ["dashboard", "wallet", "transactions", page],
    queryFn: () => fetchWalletTransactions(page),
    retry: false
  });
  const filteredTransactions = useMemo(
    () => {
      const transactions = transactionsQuery.data?.transactions || [];
      return typeFilter === "ALL"
        ? transactions
        : transactions.filter((transaction) => transaction.type === typeFilter);
    },
    [transactionsQuery.data?.transactions, typeFilter]
  );
  const pagination = transactionsQuery.data?.pagination;

  return (
    <section className="space-y-4" aria-labelledby="wallet-transaction-history">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 id="wallet-transaction-history" className="text-xl font-bold text-growth-sidebar">Transaction History</h2>
          <p className="text-sm text-muted-foreground">Read-only wallet activity.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Transaction type filters">
          {TRANSACTION_FILTERS.map(([value, label]) => (
            <button
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${typeFilter === value ? "border-primary bg-primary-soft text-primary" : "border-growth-border bg-card text-muted-foreground hover:bg-accent"}`}
              key={value}
              onClick={() => setTypeFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {transactionsQuery.isLoading ? <TableSkeleton columns={6} /> : null}

      {!transactionsQuery.isLoading && filteredTransactions.length > 0 ? (
        <HorizontalScrollArea className="rounded-xl border border-growth-border bg-card">
          <table className="w-full min-w-[760px] border-collapse text-start text-sm">
            <thead className="bg-growth-dashboard">
              <tr>
                {["Date", "Type", "Status", "Amount", "Reference", "Notes"].map((heading) => (
                  <th className="px-4 py-3 font-semibold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-growth-border">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{formatTransactionDate(transaction.createdAt)}</td>
                  <td className="px-4 py-4 font-semibold text-growth-sidebar">{transaction.type}</td>
                  <td className="px-4 py-4"><Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-growth-sidebar">{transaction.amount ?? 0}</td>
                  <td className="max-w-48 px-4 py-4 text-muted-foreground">{[transaction.referenceType, transaction.referenceId].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="max-w-64 px-4 py-4 text-muted-foreground">{transaction.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </HorizontalScrollArea>
      ) : null}

      {!transactionsQuery.isLoading && filteredTransactions.length === 0 ? (
        <EmptyState title="No transactions yet" description="Wallet activity will appear here when transactions are recorded." />
      ) : null}

      {!transactionsQuery.isLoading && pagination?.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-growth-border bg-card px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button>
            <button className="rounded-lg border border-growth-border bg-card px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} type="button">Next</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function WalletDashboard() {
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");
  const [withdrawalError, setWithdrawalError] = useState("");
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const walletQuery = useQuery({
    queryKey: ["dashboard", "wallet"],
    queryFn: fetchWallet,
    retry: false
  });
  const withdrawalsQuery = useQuery({
    queryKey: ["dashboard", "wallet", "withdrawals"],
    queryFn: fetchWithdrawals,
    retry: false
  });
  const wallet = walletQuery.data || EMPTY_WALLET;
  const walletWithCurrentBalance = {
    ...wallet,
    currentBalance: Number(wallet.currentBalance ?? (Number(wallet.availableCredits) + Number(wallet.pendingCredits) + Number(wallet.holdCredits))) || 0
  };
  const hasCredits = STATISTICS.some(([, key]) => Number(wallet[key]) > 0);

  async function submitWithdrawal(event) {
    event.preventDefault();
    setWithdrawalError("");
    setWithdrawalMessage("");
    console.info(JSON.stringify({
      event: "WITHDRAW_SUBMITTED",
      businessId: wallet.businessId || null,
      requestedAmount: Number(withdrawalAmount)
    }));
    try {
      const withdrawal = await createWithdrawal({
        requestedAmount: Number(withdrawalAmount),
        notes: withdrawalNotes
      });
      console.info(JSON.stringify({
        event: "WITHDRAW_REQUEST_CREATED",
        businessId: wallet.businessId || null,
        requestId: withdrawal?.id || null,
        requestedAmount: withdrawal?.requestedAmount ?? Number(withdrawalAmount)
      }));
      setWithdrawalAmount("");
      setWithdrawalNotes("");
      setWithdrawalOpen(false);
      setWithdrawalMessage("Withdrawal request submitted for manual approval.");
      await Promise.all([walletQuery.refetch(), withdrawalsQuery.refetch()]);
    } catch (error) {
      setWithdrawalError(error.message);
    }
  }

  function openWithdrawalModal() {
    console.info(JSON.stringify({
      event: "WITHDRAW_CLICKED",
      businessId: wallet.businessId || null,
      availableCredits: Number(wallet.availableCredits) || 0
    }));
    setWithdrawalError("");
    setWithdrawalOpen(true);
    console.info(JSON.stringify({
      event: "WITHDRAW_MODAL_OPENED",
      businessId: wallet.businessId || null
    }));
  }

  return (
    <div className="space-y-6">
      {walletQuery.isLoading ? <MetricCardsSkeleton /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STATISTICS.map(([label, key]) => (
            <Card key={key}>
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">{Number(walletWithCurrentBalance[key]) || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">{wallet.currency || "USD"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!walletQuery.isLoading && !hasCredits ? <EmptyState title="Your wallet is ready" description="Credits will appear here when your wallet balance changes." /> : null}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-growth-sidebar">Withdraw funds</h2>
              <p className="text-sm text-muted-foreground">Requests are reviewed and paid manually by a Super Admin.</p>
            </div>
            <Button onClick={withdrawalOpen ? () => setWithdrawalOpen(false) : openWithdrawalModal} type="button">
              {withdrawalOpen ? "Cancel" : "Withdraw Funds"}
            </Button>
          </div>
          {withdrawalMessage ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{withdrawalMessage}</p> : null}
          {withdrawalsQuery.data?.length ? <div className="space-y-2 text-sm"><p className="font-semibold text-growth-sidebar">Recent requests</p>{withdrawalsQuery.data.slice(0, 5).map((request) => <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-growth-border px-3 py-2" key={request.id}><span>{request.requestedAmount} {wallet.currency}</span><span className="font-semibold">{request.status}</span></div>)}</div> : null}
        </CardContent>
      </Card>
      <Modal
        description="Credits are held until a Super Admin reviews your request."
        footer={<ModalFooter>
          <Button onClick={() => setWithdrawalOpen(false)} type="button" variant="outline">Cancel</Button>
          <Button form="withdrawal-form" type="submit">Submit Request</Button>
        </ModalFooter>}
        onOpenChange={(open) => {
          setWithdrawalOpen(open);
          if (open) {
            console.info(JSON.stringify({ event: "WITHDRAW_MODAL_OPENED", businessId: wallet.businessId || null }));
          }
        }}
        open={withdrawalOpen}
        title="Withdraw funds"
      >
        <form className="space-y-4" id="withdrawal-form" onSubmit={submitWithdrawal}>
          <Input aria-label="Withdrawal amount" min="1" max={Number(wallet.availableCredits) || undefined} required type="number" value={withdrawalAmount} onChange={(event) => setWithdrawalAmount(event.target.value)} placeholder="Amount" />
          <Input aria-label="Withdrawal notes" value={withdrawalNotes} onChange={(event) => setWithdrawalNotes(event.target.value)} placeholder="Notes (optional)" />
          <ModalError>{withdrawalError}</ModalError>
        </form>
      </Modal>
      <TransactionHistory />
    </div>
  );
}
