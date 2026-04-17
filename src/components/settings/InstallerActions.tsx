import { Loader2, RefreshCw, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InstallerActionsProps {
  canInstall: boolean;
  installing: boolean;
  loading: boolean;
  onInstall: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  onToggleManual: () => void;
  showManualCommands: boolean;
}

export function InstallerActions({
  canInstall,
  installing,
  loading,
  onInstall,
  onRefresh,
  onToggleManual,
  showManualCommands,
}: InstallerActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        onClick={() => void onRefresh()}
        disabled={loading || installing}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh
      </Button>
      <Button onClick={() => void onInstall()} disabled={!canInstall || installing}>
        {installing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wrench className="h-4 w-4" />
        )}
        Install Missing
      </Button>
      <Button variant="secondary" onClick={onToggleManual}>
        {showManualCommands ? "Hide Manual Commands" : "Manual Commands"}
      </Button>
    </div>
  );
}
