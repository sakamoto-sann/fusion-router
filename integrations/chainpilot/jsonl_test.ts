import { assertEquals, assertThrows } from "@std/assert";
import { assertToollessReviewerConfig, canonicalize, reviewerSessionKey, sha256 } from "./jsonl.ts";

Deno.test("ChainPilot canonical JSON is stable", async () => {
  assertEquals(
    canonicalize({ z: 1, a: [3, { c: true, b: "x" }] }),
    '{"a":[3,{"b":"x","c":true}],"z":1}',
  );
  assertEquals(
    await sha256({ b: 2, a: 1 }),
    "sha256:43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
  );
});

Deno.test("ChainPilot canonical JSON rejects non-finite numbers", () => {
  assertThrows(() => canonicalize({ value: Number.NaN }), Error, "non-finite");
});

Deno.test("ChainPilot OpenAI reviewer requires an explicit zero-tool agent", () => {
  assertThrows(() => assertToollessReviewerConfig([]), Error, "not_enforced");
  assertThrows(() => assertToollessReviewerConfig([{ id: "chainpilot-reviewer", tools: { allow: [], deny: [] } }]), Error, "not_enforced");
  assertToollessReviewerConfig([{ id: "chainpilot-reviewer", tools: { allow: [], deny: ["*"] } }]);
});

Deno.test("ChainPilot reviewer session is scoped to the tool-less reviewer agent", () => {
  assertEquals(reviewerSessionKey("qr_boundary_probe", 1), "agent:chainpilot-reviewer:chainpilot-qr_boundary_probe-1");
  assertThrows(() => reviewerSessionKey("bad:session", 1), Error, "invalid");
  assertThrows(() => reviewerSessionKey("qr_boundary_probe", 3), Error, "invalid");
});
