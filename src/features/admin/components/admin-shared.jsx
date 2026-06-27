import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export function AdminSelect({ children, className = "", ...props }) {
  return (
    <Select
      className={`h-11 rounded-2xl border border-input bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    >
      {children}
    </Select>
  );
}

export function AdminSummaryCard({ label, value, tone = "default" }) {
  const valueClass =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-growth-sidebar";

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function AdminPagination({
  pagination,
  itemCount,
  isFetching,
  onPageChange
}) {
  if (!pagination || pagination.totalItems === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <p className="text-sm text-muted-foreground">
        Showing {itemCount} of {pagination.totalItems}. Page {pagination.page}{" "}
        of {pagination.totalPages}.
      </p>
      <div className="flex gap-2">
        <Button
          disabled={!pagination.hasPreviousPage || isFetching}
          onClick={() => onPageChange(Math.max(pagination.page - 1, 1))}
          size="sm"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={!pagination.hasNextPage || isFetching}
          onClick={() => onPageChange(pagination.page + 1)}
          size="sm"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function formatAdminDate(value, includeTime = false) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {})
  }).format(new Date(value));
}

export function adminStatusVariant(status) {
  if (["ACTIVE", "TRIALING"].includes(status)) {
    return "success";
  }

  if (["SUSPENDED", "PAST_DUE", "INCOMPLETE", "PAUSED"].includes(status)) {
    return "warning";
  }

  if (["ARCHIVED", "CANCELED", "UNPAID", "INCOMPLETE_EXPIRED"].includes(status)) {
    return "destructive";
  }

  return "outline";
}

export function humanizeAdminValue(value) {
  return value.toLowerCase().replaceAll("_", " ");
}
