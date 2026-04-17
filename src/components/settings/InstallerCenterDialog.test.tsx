import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { InstallerCenterDialog } from "@/components/settings/InstallerCenterDialog";

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

test("loads environment status when opened", async () => {
  render(<InstallerCenterDialog open onOpenChange={() => {}} />);

  await waitFor(() => {
    expect(screen.getByText("node")).toBeInTheDocument();
  });
});

test("shows manual commands on linux", async () => {
  const user = userEvent.setup();

  render(<InstallerCenterDialog open onOpenChange={() => {}} />);

  await user.click(await screen.findByRole("button", { name: /manual/i }));

  expect(
    await screen.findByText(/package manager or nvm/i),
  ).toBeInTheDocument();
});
