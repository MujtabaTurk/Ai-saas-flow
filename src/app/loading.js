import { LoadingMessage } from "@/components/i18n/loading-message";
import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <LoadingState
        className="w-full max-w-md"
        description={<LoadingMessage />}
        title="Loading ServiceFlow"
      />
    </div>
  );
}
