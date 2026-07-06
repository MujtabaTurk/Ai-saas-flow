import { AppShell, AppShellPageSkeleton } from "@/components/layout/app-shell";

export default function Loading() {
  return (
    <AppShell isLoading>
      <AppShellPageSkeleton />
    </AppShell>
  );
}
