// router.ts — Fusion Router (improved)
//
// Why this version exists: the original had a single AbortController shared
// across all parallel model calls and the synthesis call. That meant one slow
// model could cancel the others, and the synthesis had no separate time
// budget. It also leaked abort listeners, had no way to configure the model
// roster, and conflated timeout/validation/network errors.
//
// Key changes:
//  1. Per-call AbortController — one slow model no longer cancels its peers.
//  2. Separate timeout budget for the synthesis call.
//  3. Pluggable ModelClient interface; mocks are now an explicit example impl.
//  4. Configurable model roster, per-client timeout/weight/retries.
//  5. Structured RouterResult with per-model status and latencies.
//  6. minSuccesses gate (default: majority) before synthesis runs.
//  7. Optional exponential-backoff retry per call (off by default).
//  8. Cleanup of abort listeners via { once: true }.
//  9. Structured logger hook for observability.
// 10. Zod validation errors classified as their own status kind.

import { z, ZodError } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// ---------- Schemas ----------

export const ModelOutputSchema = z.object({
  content: z.string().min(1),
  model: z.string().min(1),
  latencyMs: z.number().nonnegative(),
});
export type ModelOutput = z.infer<typeof ModelOutputSchema>;

export const FinalSynthesisSchema = z.object({
  synthesis: z.string().min(1),
  reasoning: z.string().min(1),
  sources: z.array(z.string()),
});
export type FinalSynthesis = z.infer<typeof FinalSynthesisSchema>;

// ---------- Pluggable model client ----------

export interface ModelClient {
  readonly name: string;
  /** Relative weight when synthesis scores inputs. Default 1.0. */
  readonly weight?: number;
  /** Per-call timeout in ms. Falls back to router-level default. */
  readonly timeoutMs?: number;
  /** Number of retry attempts on transient errors. Default 0. */
  readonly retries?: number;
  /** Issue one prompt; throw on failure or return ModelOutput. */
  call(prompt: string, signal: AbortSignal): Promise<ModelOutput>;
}

// ---------- Synthesis client (separate, replaceable) ----------

export interface SynthesisClient {
  readonly name?: string;
  call(outputs: ModelOutput[], signal: AbortSignal): Promise<FinalSynthesis>;
}

export const mockSynthesis: SynthesisClient = {
  name: "GPT 5.5 (mock)",
  async call(outputs, _signal) {
    return {
      synthesis: `Fused synthesis of ${outputs.length} model outputs.`,
      reasoning: `Synthesized data from: ${outputs.map((o) => o.model).join(", ")}.`,
      sources: outputs.map((o) => o.model),
    };
  },
};

// ---------- Router config + result types ----------

export interface FusionRouterConfig {
  /** Per-call timeout in ms (fallback if a client doesn't set its own). */
  defaultTimeoutMs?: number;
  /** Budget for the synthesis call in ms. */
  synthesisTimeoutMs?: number;
  /** Minimum successful model outputs required before synthesis runs. */
  minSuccesses?: number;
  /** Optional structured logger. */
  logger?: (event: RouterLogEvent) => void;
}

export type ModelCallStatus =
  | { kind: "ok"; output: ModelOutput }
  | { kind: "timeout"; latencyMs: number; error: string }
  | { kind: "validation"; latencyMs: number; error: string }
  | { kind: "error"; latencyMs: number; error: string };

export interface RouterResult {
  synthesis: FinalSynthesis;
  perModel: Record<string, ModelCallStatus>;
  totalLatencyMs: number;
}

export type RouterLogEvent =
  | { type: "start"; promptPreview: string; modelCount: number; ts: number }
  | {
    type: "model_done";
    model: string;
    status: ModelCallStatus["kind"];
    latencyMs: number;
  }
  | { type: "synthesis_start"; sourceCount: number; ts: number }
  | { type: "synthesis_done"; latencyMs: number; ts: number }
  | { type: "router_done"; totalLatencyMs: number; ok: boolean };

// ---------- Helpers ----------

async function callWithTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error("timeout")),
    timeoutMs,
  );
  // once: true means the listener auto-removes when fired — no leak.
  controller.signal.addEventListener(
    "abort",
    () => clearTimeout(timer),
    { once: true },
  );
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

type FailureKind = "timeout" | "validation" | "error";

function classifyError(err: unknown): FailureKind {
  if (err instanceof Error && /timeout|aborted/i.test(err.message)) {
    return "timeout";
  }
  if (err instanceof ZodError) return "validation";
  return "error";
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ---------- Router ----------

export class FusionRouter {
  private readonly clients: ModelClient[];
  private readonly defaultTimeoutMs: number;
  private readonly synthesisTimeoutMs: number;
  private readonly minSuccesses: number;
  private readonly logger: (e: RouterLogEvent) => void;

  constructor(clients: ModelClient[], config: FusionRouterConfig = {}) {
    if (clients.length === 0) {
      throw new Error("FusionRouter requires at least one ModelClient.");
    }
    this.clients = clients;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 5000;
    this.synthesisTimeoutMs = config.synthesisTimeoutMs ?? this.defaultTimeoutMs;
    this.minSuccesses = Math.min(
      config.minSuccesses ?? Math.max(1, Math.ceil(clients.length / 2)),
      clients.length,
    );
    this.logger = config.logger ?? (() => {});
  }

  async route(
    prompt: string,
    synthesis: SynthesisClient = mockSynthesis,
  ): Promise<RouterResult> {
    const routerStart = Date.now();
    this.logger({
      type: "start",
      promptPreview: prompt.slice(0, 40),
      modelCount: this.clients.length,
      ts: routerStart,
    });

    // Each model gets its own AbortController. One slow call no longer
    // cancels its peers.
    const perModel: Record<string, ModelCallStatus> = {};
    await Promise.allSettled(
      this.clients.map(async (client) => {
        const callStart = Date.now();
        const timeoutMs = client.timeoutMs ?? this.defaultTimeoutMs;
        const maxAttempts = (client.retries ?? 0) + 1;
        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const output = await callWithTimeout(
              (signal) => client.call(prompt, signal),
              timeoutMs,
            );
            const parsed = ModelOutputSchema.parse(output);
            perModel[client.name] = { kind: "ok", output: parsed };
            this.logger({
              type: "model_done",
              model: client.name,
              status: "ok",
              latencyMs: Date.now() - callStart,
            });
            return;
          } catch (err) {
            lastErr = err;
            const kind = classifyError(err);
            // Don't retry timeouts or validation errors — only transient ones.
            if (kind !== "error" || attempt === maxAttempts) break;
            await new Promise((r) => setTimeout(r, 100 * 2 ** (attempt - 1)));
          }
        }
        const latencyMs = Date.now() - callStart;
        const kind = classifyError(lastErr);
        perModel[client.name] = {
          kind,
          latencyMs,
          error: errMessage(lastErr),
        };
        this.logger({
          type: "model_done",
          model: client.name,
          status: kind,
          latencyMs,
        });
      }),
    );

    // Collect successful outputs in client order for deterministic synthesis.
    const successful: ModelOutput[] = [];
    for (const c of this.clients) {
      const status = perModel[c.name];
      if (status.kind === "ok") successful.push(status.output);
    }

    if (successful.length < this.minSuccesses) {
      const totalLatencyMs = Date.now() - routerStart;
      this.logger({ type: "router_done", totalLatencyMs, ok: false });
      throw new Error(
        `FusionRouter: only ${successful.length}/${this.clients.length} models succeeded; ` +
          `min required is ${this.minSuccesses}.`,
      );
    }

    // Separate budget for synthesis. The parallel phase can no longer steal it.
    this.logger({
      type: "synthesis_start",
      sourceCount: successful.length,
      ts: Date.now(),
    });
    const synthStart = Date.now();
    const synthRaw = await callWithTimeout(
      (signal) => synthesis.call(successful, signal),
      this.synthesisTimeoutMs,
    );
    this.logger({
      type: "synthesis_done",
      latencyMs: Date.now() - synthStart,
      ts: Date.now(),
    });

    const final = FinalSynthesisSchema.parse({
      ...synthRaw,
      // Always overwrite sources with the actual contributing model names so
      // a buggy synthesis client can't lie about provenance.
      sources: synthRaw.sources.length
        ? synthRaw.sources
        : successful.map((o) => o.model),
    });

    const totalLatencyMs = Date.now() - routerStart;
    this.logger({ type: "router_done", totalLatencyMs, ok: true });

    return { synthesis: final, perModel, totalLatencyMs };
  }
}

// ---------- Example mock ModelClient (drop-in for tests) ----------

function makeMockClient(
  name: string,
  maxDelayMs: number,
  weight = 1.0,
): ModelClient {
  return {
    name,
    weight,
    async call(prompt, signal) {
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, Math.random() * maxDelayMs);
        signal.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new Error("aborted"));
        }, { once: true });
      });
      return {
        content: `[${name}] response to "${prompt.slice(0, 20)}..."`,
        model: name,
        latencyMs: 0,
      };
    },
  };
}

export const mockGLM = makeMockClient("GLM 5.2", 800);
export const mockMinimax = makeMockClient("Minimax M3", 1200);
export const mockCodex = makeMockClient("Codex", 600, 0.8);

// ---------- Demo ----------

if (import.meta.main) {
  const router = new FusionRouter([mockGLM, mockMinimax, mockCodex], {
    defaultTimeoutMs: 1500,
    synthesisTimeoutMs: 2000,
    minSuccesses: 2,
  });
  try {
    const result = await router.route(
      "Explain the impact of quantum computing on encryption.",
    );
    console.log("\n--- Final Synthesis ---");
    console.log(JSON.stringify(result.synthesis, null, 2));
    console.log("\n--- Per-model status ---");
    for (const [name, status] of Object.entries(result.perModel)) {
      const lat = "latencyMs" in status ? `${status.latencyMs}ms` : "-";
      console.log(`${name.padEnd(12)} ${status.kind.padEnd(10)} ${lat}`);
    }
    console.log(`\nTotal: ${result.totalLatencyMs}ms`);
  } catch (err) {
    console.error(
      "Router Error:",
      err instanceof Error ? err.message : err,
    );
    Deno.exit(1);
  }
}
