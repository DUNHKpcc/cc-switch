import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AboutSection } from "@/components/settings/AboutSection";

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn().mockResolvedValue("3.13.0"),
}));

vi.mock("@/contexts/UpdateContext", () => ({
  useUpdate: () => ({
    hasUpdate: false,
    updateInfo: null,
    updateHandle: null,
    checkUpdate: vi.fn().mockResolvedValue(false),
    resetDismiss: vi.fn(),
    isChecking: false,
  }),
}));

vi.mock("@/lib/updater", () => ({
  relaunchApp: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  settingsApi: {
    getToolVersions: vi.fn().mockResolvedValue([]),
    openExternal: vi.fn().mockResolvedValue(undefined),
    checkUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/api/installer", () => ({
  installerApi: {
    detectEnvironment: vi.fn().mockResolvedValue({
      platform: "linux",
      autoInstallSupported: false,
      dependencies: [
        {
          name: "node",
          kind: "core",
          state: "missing",
          version: null,
          path: null,
          message: "node was not found on PATH.",
          autoInstallSupported: false,
        },
      ],
      lastCheckedAt: "2026-04-16T00:00:00Z",
      readyCount: 0,
      totalCount: 1,
    }),
    installMissing: vi.fn(),
    getManualCommands: vi.fn().mockResolvedValue([
      {
        name: "node",
        title: "Node.js",
        commands: ["Install Node.js with your package manager or nvm."],
      },
    ]),
    subscribeProgress: vi.fn().mockResolvedValue(() => {}),
  },
}));

test("opens installer center from about section", async () => {
  const user = userEvent.setup();

  render(<AboutSection isPortable={false} />);

  await user.click(
    await screen.findByRole("button", { name: /environment check/i }),
  );

  expect(await screen.findByText(/environment summary/i)).toBeInTheDocument();
});
