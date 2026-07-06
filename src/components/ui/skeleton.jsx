"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function useDelayedVisibility(isVisible, delay = 180) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      const resetTimer = window.setTimeout(() => {
        setShouldShow(false);
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }

    const timer = window.setTimeout(() => {
      setShouldShow(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, isVisible]);

  return isVisible && shouldShow;
}

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-[#d8d5e8] via-[#eef3ff] to-[#d8d5e8] bg-[length:240%_100%]",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

function MetricCardsSkeleton({ count = 4, className }) {
  return (
    <div
      className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-4", className)}
      role="status"
      aria-label="Loading summary metrics"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="rounded-xl border border-growth-border bg-white p-4 shadow-sm"
          key={index}
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({
  columns = 5,
  rows = 6,
  minWidth = "760px",
  className
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-growth-border bg-white",
        className
      )}
      role="status"
      aria-label="Loading table rows"
    >
      <table className="w-full border-collapse text-start text-sm" style={{ minWidth }}>
        <thead className="bg-growth-dashboard">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th className="px-4 py-3" key={index}>
                <Skeleton className="h-3 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-growth-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <td className="px-4 py-4" key={columnIndex}>
                  <Skeleton
                    className={cn(
                      "h-4",
                      columnIndex === 0 ? "w-36" : "w-24",
                      columnIndex === columns - 1 && "ms-auto"
                    )}
                  />
                  {columnIndex === 0 ? (
                    <Skeleton className="mt-2 h-3 w-24" />
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardListSkeleton({ count = 4, className }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading records">
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="rounded-xl border border-growth-border bg-white p-4 shadow-sm"
          key={index}
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-full max-w-xl" />
              <Skeleton className="mt-2 h-3 w-52" />
            </div>
            <div className="flex shrink-0 gap-2">
              <Skeleton className="h-9 w-20 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ className, bars = 18 }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-growth-border bg-white p-5",
        className
      )}
      role="status"
      aria-label="Loading chart"
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-3 h-3 w-64 max-w-full" />
      <div className="mt-6 flex h-56 items-end gap-2 border-b border-growth-border px-1">
        {Array.from({ length: bars }).map((_, index) => (
          <Skeleton
            className="flex-1 rounded-t-lg"
            key={index}
            style={{
              height: `${28 + ((index * 17) % 68)}%`
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-between gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function FormSkeleton({ fields = 5, className }) {
  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-label="Loading form controls"
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div className="space-y-2" key={index}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export {
  CardListSkeleton,
  ChartSkeleton,
  FormSkeleton,
  MetricCardsSkeleton,
  Skeleton,
  TableSkeleton,
  useDelayedVisibility
};
