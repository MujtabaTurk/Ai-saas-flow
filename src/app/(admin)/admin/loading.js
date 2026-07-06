import { AppShell, AppShellPageSkeleton } from "@/components/layout/app-shell";
import { adminNavigation } from "@/config/navigation";

export default function Loading() {
  return (
    <AppShell isLoading navigation={adminNavigation} workspaceLabel="ServiceFlow Admin">
      <AppShellPageSkeleton />
    </AppShell>
  );
}
