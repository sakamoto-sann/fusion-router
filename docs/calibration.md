# Calibration by task type

QuorumRouter exposes a pure, additive API for summarizing externally evaluated
confidence observations by explicit `task_type` and provider/model source.
Calibration reports are advisory diagnostics only. The router does not consume
them and they carry no routing or execution authority.

## Truth boundary

Every observation must declare `evaluation_basis: "external_ground_truth"`. The
caller is responsible for supplying a correctness outcome produced by an
evaluation outside QuorumRouter. Never derive `correct` from a Decision Report,
consensus, a majority or minority position, disagreement, synthesis selection,
or any other router behavior.

The literal is an **unverified caller-supplied provenance assertion**.
QuorumRouter validates its shape but cannot establish that the evaluator is
independent, the label is reliable and matched to the right answer, or the
sample is free from label leakage, repetition, correlation, or selection bias.

`confidence` must be the model's probability, recorded **before the correctness
label is observed**, that the specific evaluated answer is correct. Evaluator
confidence, generic confidence about completing the task, or a score assigned
after seeing the label makes the Brier score and calibration gap
uninterpretable. The schema enforces only that the number is finite and within
`[0, 1]`; it cannot verify the score's timing or provenance.

The strict observation schema accepts only an ID, task type, provider/model
source, the external-ground-truth literal, binary correctness, confidence, and
evaluation timestamp. Prompts, responses, credentials, and freeform content are
not schema fields and are rejected.

## Example

```ts
import { aggregateTaskCalibration } from "../router.ts";

const report = aggregateTaskCalibration([
  {
    observation_id: "eval-001",
    task_type: "code_review",
    source: { provider: "OpenAI", model: "gpt-5" },
    evaluation_basis: "external_ground_truth",
    correct: true,
    confidence: 0.8,
    evaluated_at: "2026-07-13T00:00:00Z",
  },
  {
    observation_id: "eval-002",
    task_type: "code_review",
    source: { provider: "OpenAI", model: "gpt-5" },
    evaluation_basis: "external_ground_truth",
    correct: false,
    confidence: 0.6,
    evaluated_at: "2026-07-13T00:01:00Z",
  },
], { minimum_sample_count: 2 });
```

The example group has `sample_count: 2`, `accuracy: 0.5`,
`mean_confidence: 0.7`, `brier_score: 0.2`, and `calibration_gap: 0.2`. Metrics
use:

- accuracy: mean of the binary correctness outcomes
- mean confidence: mean of the submitted confidence values
- Brier score: mean of `(confidence - outcome)²`
- calibration gap: `mean_confidence - accuracy` (positive is overconfidence)

Groups below `minimum_sample_count` have `sample_status: "insufficient"`. The
minimum defaults to 20 and is only a reporting threshold; reaching it does not
make a group trusted or authorize automatic action. `"sufficient"` means only
`sample_count >= minimum_sample_count`; it does not establish statistical power,
independence, representativeness, validity, or routing fitness.
