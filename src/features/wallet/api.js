async function parseWalletResponse(response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Could not load wallet.");
  }

  return payload.data?.wallet || null;
}

const EMPTY_WALLET = {
  availableCredits: 0,
  pendingCredits: 0,
  withdrawnCredits: 0,
  lifetimeCredits: 0,
  monthlyRevenue: 0,
  currency: "USD"
};

export async function fetchWallet() {
  try {
    const response = await fetch("/api/dashboard/wallet");
    return (await parseWalletResponse(response)) || EMPTY_WALLET;
  } catch {
    return EMPTY_WALLET;
  }
}

export async function fetchWalletTransactions(page = 1, pageSize = 20) {
  try {
    const response = await fetch(
      `/api/dashboard/wallet/transactions?page=${page}&pageSize=${pageSize}`
    );
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message || "Could not load transactions.");
    }

    return payload.data || { transactions: [], pagination: null };
  } catch {
    return { transactions: [], pagination: null };
  }
}

export async function fetchWithdrawals() {
  const response = await fetch("/api/wallet/withdrawals", {
    cache: "no-store"
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Could not load withdrawals.");
  }
  return payload.data?.requests || [];
}

export async function createWithdrawal({ requestedAmount, notes }) {
  const response = await fetch("/api/wallet/withdrawals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    },
    body: JSON.stringify({ requestedAmount, notes })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Could not submit withdrawal.");
  }
  return payload.data?.withdrawal;
}
