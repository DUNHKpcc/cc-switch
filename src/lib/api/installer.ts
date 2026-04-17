import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import type {
  InstallerEnvironment,
  InstallerRunResult,
  ManualInstallCommandGroup,
  InstallExecutionStep,
} from "@/types/installer";

export const installerApi = {
  detectEnvironment(): Promise<InstallerEnvironment> {
    return invoke("detect_installer_environment");
  },

  installMissing(): Promise<InstallerRunResult> {
    return invoke("install_missing_dependencies");
  },

  getManualCommands(): Promise<ManualInstallCommandGroup[]> {
    return invoke("get_manual_install_commands");
  },

  async subscribeProgress(
    handler: (event: InstallExecutionStep) => void,
  ): Promise<UnlistenFn> {
    return listen<InstallExecutionStep>("installer-progress", ({ payload }) => {
      handler(payload);
    });
  },
};
