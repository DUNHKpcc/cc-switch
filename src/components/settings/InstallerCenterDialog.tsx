import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, TerminalSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { installerApi } from "@/lib/api/installer";
import type {
  InstallExecutionStep,
  InstallerEnvironment,
  InstallerRunResult,
  ManualInstallCommandGroup,
} from "@/types/installer";
import { InstallerActions } from "./InstallerActions";
import { InstallerDependencyCard } from "./InstallerDependencyCard";
import { InstallerProgressPanel } from "./InstallerProgressPanel";

interface InstallerCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallerCenterDialog({
  open,
  onOpenChange,
}: InstallerCenterDialogProps) {
  const { t } = useTranslation();
  const [environment, setEnvironment] = useState<InstallerEnvironment | null>(null);
  const [manualCommands, setManualCommands] = useState<ManualInstallCommandGroup[]>([]);
  const [progress, setProgress] = useState<InstallExecutionStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showManualCommands, setShowManualCommands] = useState(false);

  async function refreshEnvironment() {
    setLoading(true);
    try {
      const [nextEnvironment, nextManualCommands] = await Promise.all([
        installerApi.detectEnvironment(),
        installerApi.getManualCommands(),
      ]);
      setEnvironment(nextEnvironment);
      setManualCommands(nextManualCommands);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    let unlisten: (() => void) | undefined;

    void (async () => {
      setLoading(true);
      try {
        unlisten = await installerApi.subscribeProgress((event) => {
          if (!active) {
            return;
          }
          setProgress((current) => [...current, event].slice(-30));
        });

        const [nextEnvironment, nextManualCommands] = await Promise.all([
          installerApi.detectEnvironment(),
          installerApi.getManualCommands(),
        ]);

        if (!active) {
          return;
        }

        setEnvironment(nextEnvironment);
        setManualCommands(nextManualCommands);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      unlisten?.();
    };
  }, [open]);

  const groupedDependencies = useMemo(() => {
    const dependencies = environment?.dependencies ?? [];
    return {
      core: dependencies.filter((dependency) => dependency.kind === "core"),
      tool: dependencies.filter((dependency) => dependency.kind === "tool"),
    };
  }, [environment]);

  const canInstall = useMemo(() => {
    if (!environment?.autoInstallSupported) {
      return false;
    }

    return environment.dependencies.some((dependency) =>
      ["missing", "outdated"].includes(dependency.state),
    );
  }, [environment]);

  async function handleInstall() {
    setInstalling(true);
    setProgress([]);

    try {
      const result: InstallerRunResult = await installerApi.installMissing();
      if (result.steps.length > 0) {
        setProgress(result.steps);
      }
      await refreshEnvironment();
    } finally {
      setInstalling(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[88vh] overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>
            {t("settings.installerCenter.title", {
              defaultValue: "Environment Check & Install",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("settings.installerCenter.description", {
              defaultValue:
                "Detect CLI dependencies, install missing tools, and review manual setup commands.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 overflow-y-auto p-6">
          <Card className="border-border-default/80">
            <CardHeader>
              <CardTitle className="text-base">
                {t("settings.installerCenter.summaryTitle", {
                  defaultValue: "Environment Summary",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>
                    {environment
                      ? `${environment.readyCount}/${environment.totalCount} dependencies ready`
                      : "Loading installer environment..."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4" />
                  <span>{environment?.platform ?? "unknown"}</span>
                </div>
              </div>
              <InstallerActions
                canInstall={canInstall}
                installing={installing}
                loading={loading}
                onInstall={handleInstall}
                onRefresh={refreshEnvironment}
                onToggleManual={() => setShowManualCommands((current) => !current)}
                showManualCommands={showManualCommands}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("settings.installerCenter.coreDependencies", {
                    defaultValue: "Core Dependencies",
                  })}
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {groupedDependencies.core.map((dependency) => (
                  <InstallerDependencyCard
                    key={dependency.name}
                    dependency={dependency}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("settings.installerCenter.toolDependencies", {
                    defaultValue: "CLI Tools",
                  })}
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {groupedDependencies.tool.map((dependency) => (
                  <InstallerDependencyCard
                    key={dependency.name}
                    dependency={dependency}
                  />
                ))}
              </div>
            </section>
          </div>

          {showManualCommands ? (
            <Card className="border-border-default/80">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("settings.installerCenter.manualCommands", {
                    defaultValue: "Manual Commands",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {manualCommands.map((group) => (
                  <div
                    key={group.name}
                    className="rounded-lg border border-border-default/70 p-4"
                  >
                    <p className="mb-3 text-sm font-semibold">{group.title}</p>
                    <div className="space-y-2">
                      {group.commands.map((command) => (
                        <pre
                          key={command}
                          className="overflow-x-auto rounded-md bg-muted/70 p-3 text-xs text-foreground"
                        >
                          <code>{command}</code>
                        </pre>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <InstallerProgressPanel steps={progress} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
