import { assertEquals, assertFalse } from "@std/assert";
import { boundedContent, healthPayload } from "./hermes_bridge.ts";
import type { ModelInventory } from "./schema.ts";

Deno.test("Hermes bridge preserves bounded responses", () => {
  assertEquals(boundedContent("ready"), {
    content: "ready",
    truncated: false,
  });
});

Deno.test("Hermes bridge truncates oversized responses", () => {
  const result = boundedContent("x".repeat(24_001));
  assertEquals(result.content.length, 24_000);
  assertEquals(result.truncated, true);
});

Deno.test("Hermes health separates command discovery from live auth", () => {
  const inventory: ModelInventory = {
    generated_at: "2026-07-14T00:00:00.000Z",
    auth_mode: "wrapper",
    available_count: 1,
    blocked_count: 0,
    env_fallback_configured: false,
    env_fallback_used: false,
    entries: [{
      provider: "Anthropic",
      auth_mode: "oauth",
      model: "claude-code",
      model_id: "anthropic/claude-code",
      source: "oauth_session",
      available: true,
      can_list_models: false,
      can_invoke: true,
      notes: [],
      command: "claude",
      args_template: ["-p", "__PROMPT__"],
    }],
  };

  const payload = healthPayload(inventory);
  assertEquals(payload.command_discovered_count, 1);
  assertEquals(payload.command_executable_count, 1);
  assertEquals(payload.live_verified_count, 0);
  assertEquals(payload.available_count, 0);
  assertEquals(payload.invokable_count, 0);
  assertEquals(payload.legacy_readiness_fields, "deprecated_fail_closed");
  const providers = payload.providers as Array<Record<string, unknown>>;
  assertEquals(providers[0].command_discovered, true);
  assertEquals(providers[0].command_executable, true);
  assertEquals(providers[0].live_auth_status, "not_checked");
  assertFalse(providers[0].available as boolean);
  assertFalse(providers[0].can_invoke as boolean);
});

Deno.test("Hermes bridge rejects oversized stdin before JSON parsing", async () => {
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-env",
      "--allow-read",
      `${import.meta.dirname}/hermes_bridge.ts`,
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const writer = child.stdin.getWriter();
  const chunk = new TextEncoder().encode("x".repeat(60_000));
  await writer.write(chunk);
  await writer.write(chunk);
  await writer.write(new TextEncoder().encode("x")).catch(() => undefined);
  await writer.close().catch(() => undefined);
  const output = await child.output();
  assertEquals(output.code, 1);
  const payload = JSON.parse(new TextDecoder().decode(output.stdout));
  assertEquals(payload.ok, false);
  assertEquals(
    payload.error,
    "quorum-router Hermes bridge input exceeds 120000 bytes",
  );
});
