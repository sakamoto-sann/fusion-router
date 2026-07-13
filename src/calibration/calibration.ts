import { z } from "zod";

const SourceLabelSchema = z.string().trim().min(1);

export const TaskCalibrationSourceSchema = z.object({
  provider: SourceLabelSchema,
  model: SourceLabelSchema,
}).strict();

/**
 * Structurally validated calibration input supplied by the caller.
 *
 * `evaluation_basis` records an unverified provenance assertion; this schema
 * cannot establish label independence, label quality, example matching, or
 * freedom from leakage. `confidence` must be the model's probability, recorded
 * before the correctness label is observed, that this specific answer is
 * correct. The schema can enforce only the numeric range, not that provenance.
 */
export const TaskCalibrationObservationSchema = z.object({
  observation_id: z.string().trim().min(1),
  task_type: z.string().trim().min(1),
  source: TaskCalibrationSourceSchema,
  evaluation_basis: z.literal("external_ground_truth"),
  correct: z.boolean(),
  confidence: z.number().finite().min(0).max(1),
  evaluated_at: z.string().datetime({ offset: true }),
}).strict();

export const TaskCalibrationObservationListSchema = z.array(
  TaskCalibrationObservationSchema,
).superRefine((observations, context) => {
  const ids = new Set<string>();
  for (const [index, observation] of observations.entries()) {
    if (ids.has(observation.observation_id)) {
      context.addIssue({
        code: "custom",
        message: "observation_id must be unique",
        path: [index, "observation_id"],
      });
    }
    ids.add(observation.observation_id);
  }
});

export const TaskCalibrationOptionsSchema = z.object({
  minimum_sample_count: z.number().finite().int().positive().default(20),
}).strict();

export const TaskCalibrationGroupSchema = z.object({
  task_type: z.string().trim().min(1),
  source: TaskCalibrationSourceSchema,
  sample_count: z.number().int().nonnegative(),
  accuracy: z.number().finite().min(0).max(1),
  mean_confidence: z.number().finite().min(0).max(1),
  brier_score: z.number().finite().min(0).max(1),
  calibration_gap: z.number().finite().min(-1).max(1),
  // "sufficient" means only that the configured sample-count threshold is met.
  sample_status: z.enum(["insufficient", "sufficient"]),
}).strict();

export const TaskCalibrationReportSchema = z.object({
  schema_version: z.literal("quorum-router.calibration-by-task.v1"),
  advisory_only: z.literal(true),
  minimum_sample_count: z.number().int().positive(),
  groups: z.array(TaskCalibrationGroupSchema),
}).strict();

export type TaskCalibrationSource = z.infer<
  typeof TaskCalibrationSourceSchema
>;
export type TaskCalibrationObservation = z.infer<
  typeof TaskCalibrationObservationSchema
>;
export type TaskCalibrationOptions = z.input<
  typeof TaskCalibrationOptionsSchema
>;
export type TaskCalibrationGroup = z.infer<
  typeof TaskCalibrationGroupSchema
>;
export type TaskCalibrationReport = z.infer<
  typeof TaskCalibrationReportSchema
>;

function stableMetric(value: number): number {
  return Number(value.toPrecision(15));
}

export function aggregateTaskCalibration(
  observations: readonly unknown[],
  options: TaskCalibrationOptions = {},
): TaskCalibrationReport {
  const parsedObservations = TaskCalibrationObservationListSchema.parse(
    observations,
  );
  const { minimum_sample_count } = TaskCalibrationOptionsSchema.parse(options);
  const grouped = new Map<string, TaskCalibrationObservation[]>();

  for (const observation of parsedObservations) {
    const key = JSON.stringify([
      observation.task_type,
      observation.source.provider,
      observation.source.model,
    ]);
    const group = grouped.get(key);
    if (group) {
      group.push(observation);
    } else {
      grouped.set(key, [observation]);
    }
  }

  const groups = [...grouped.values()].map((group) => {
    const sample_count = group.length;
    const correctCount = group.reduce(
      (total, observation) => total + Number(observation.correct),
      0,
    );
    const confidenceTotal = group.reduce(
      (total, observation) => total + observation.confidence,
      0,
    );
    const brierTotal = group.reduce((total, observation) => {
      const outcome = Number(observation.correct);
      return total + (observation.confidence - outcome) ** 2;
    }, 0);
    const accuracy = stableMetric(correctCount / sample_count);
    const mean_confidence = stableMetric(confidenceTotal / sample_count);

    return {
      task_type: group[0].task_type,
      source: group[0].source,
      sample_count,
      accuracy,
      mean_confidence,
      brier_score: stableMetric(brierTotal / sample_count),
      calibration_gap: stableMetric(mean_confidence - accuracy),
      sample_status: sample_count < minimum_sample_count
        ? "insufficient" as const
        : "sufficient" as const,
    };
  }).sort((left, right) =>
    left.task_type.localeCompare(right.task_type) ||
    left.source.provider.localeCompare(right.source.provider) ||
    left.source.model.localeCompare(right.source.model)
  );

  return TaskCalibrationReportSchema.parse({
    schema_version: "quorum-router.calibration-by-task.v1",
    advisory_only: true,
    minimum_sample_count,
    groups,
  });
}
