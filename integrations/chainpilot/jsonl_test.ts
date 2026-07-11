import { assertEquals, assertThrows } from "@std/assert";
import { canonicalize, sha256 } from "./jsonl.ts";

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
