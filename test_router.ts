// test_router.ts — quick smoke test of the failure paths
import {
  FusionRouter,
  ModelClient,
  mockSynthesis,
  ModelOutputSchema,
  ModelOutput,
} from "./router.ts";

// 1. Slow model that always times out
const slowClient: ModelClient = {
  name: "Slow",
  async call(_prompt, signal) {
    await new Promise<void>((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), {
        once: true,
      });
    });
    return { content: "unreachable", model: "Slow", latencyMs: 0 };
  },
};

// 2. Fast ok model
const fastClient: ModelClient = {
  name: "Fast",
  async call(prompt) {
    return { content: `ok: ${prompt}`, model: "Fast", latencyMs: 5 };
  },
};

// 3. Garbage model that returns invalid output
const garbageClient: ModelClient = {
  name: "Garbage",
  async call() {
    // Zod schema requires content: z.string().min(1) — empty string fails.
    return { content: "", model: "Garbage", latencyMs: 1 };
  },
};

async function main() {
  // Case A: slow + fast (timeout fires only on slow, fast still gets to return)
  console.log("=== Case A: 1 slow + 1 fast, timeoutMs=200 ===");
  const routerA = new FusionRouter([slowClient, fastClient], {
    defaultTimeoutMs: 200,
    minSuccesses: 1,
  });
  const resA = await routerA.route("hello");
  console.log("perModel:", Object.fromEntries(
    Object.entries(resA.perModel).map(([k, v]) => [k, v.kind]),
  ));
  console.log("synthesis sources:", resA.synthesis.sources);
  console.log("totalLatencyMs:", resA.totalLatencyMs);
  console.log();

  // Case B: slow + garbage, minSuccesses=2 — should throw
  console.log("=== Case B: 1 slow + 1 garbage, minSuccesses=2 ===");
  const routerB = new FusionRouter([slowClient, garbageClient], {
    defaultTimeoutMs: 200,
    minSuccesses: 2,
  });
  try {
    await routerB.route("hi");
    console.log("UNEXPECTED: no throw");
  } catch (e) {
    console.log("threw:", e instanceof Error ? e.message : e);
  }
  console.log();

  // Case C: garbage alone with minSuccesses=1, with retries=0 — should mark validation
  console.log("=== Case C: garbage only, minSuccesses=1, retries=0 ===");
  const routerC = new FusionRouter([garbageClient], {
    defaultTimeoutMs: 500,
    minSuccesses: 1,
  });
  try {
    const resC = await routerC.route("x");
    console.log("synthesis:", resC.synthesis.sources);
  } catch (e) {
    console.log("threw:", e instanceof Error ? e.message : e);
  }
  console.log("garbage perModel status:",
    Object.entries((await routerC.route("x2").catch((e) => ({ perModel: {}, e }))).perModel || {})
      .map(([k, v]: any) => `${k}=${v.kind}`).join(",") ||
    "(failed above)");
}

await main();
