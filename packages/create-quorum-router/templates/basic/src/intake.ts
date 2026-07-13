import {
  discoverInventoryWithModelListing,
  invokableEntries,
} from "./auth_session.ts";
import { printInventoryTable, writeInventory } from "./model_inventory.ts";
import { buildTrace, writeTrace } from "./trace.ts";

export async function runIntake(): Promise<void> {
  const inventory = await discoverInventoryWithModelListing();
  await writeInventory(inventory);
  const invokable = invokableEntries(inventory);
  console.log("QuorumRouter intake");
  console.log("");
  console.log("Step 1 — Detect local providers");
  console.log("");
  printInventoryTable(inventory);
  console.log("");
  console.log("Step 2 — OAuth/session status");
  console.log(
    `Discovered invokable OAuth/session/wrapper providers: ${invokable.length}`,
  );
  console.log("Live provider authentication verified: false");
  console.log("Provider request sent: false");
  console.log("Credential values printed: false");
  console.log("");
  console.log("Step 3 — Browser/device login");
  console.log(
    "No browser was opened. Run deno task auth:login for provider login guidance.",
  );
  console.log("");
  console.log("Step 4 — Model inventory");
  console.log(
    "Wrote safe inventory under out/model-inventory.json and out/model-inventory.md",
  );
  console.log("");
  console.log("Step 5 — Health check");
  const trace = await buildTrace({
    command: "intake-health",
    mode: "health",
    authMode: inventory.auth_mode,
    errors: invokable.length === 0
      ? ["no invokable OAuth/session/wrapper provider was discovered"]
      : [],
  });
  const tracePath = await writeTrace("intake-health-trace", trace);
  console.log(`Health trace: ${tracePath}`);
  console.log("");
  console.log("Step 6 — Recommended next action");
  console.log("");
  if (invokable.length === 0) {
    console.log("QuorumRouter intake blocked");
    console.log("");
    console.log("No invokable OAuth/session/wrapper provider was discovered.");
    console.log("");
    console.log("Next:");
    console.log("  deno task auth:login");
    return;
  }
  console.log("You can run:");
  console.log(
    '  RUN_EXTERNAL_MODEL_DOGFOOD=1 deno task route:once --prompt "Review this README for risky claims."',
  );
  console.log("");
  console.log("Optional:");
  console.log("  deno task auth:login");
  console.log("  deno task models:list");
  console.log("  deno task health");
}
