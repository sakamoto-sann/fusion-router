import {
  aggregateTaskCalibration,
  type TaskCalibrationOptions,
  type TaskCalibrationReport,
} from "./calibration.ts";

export async function loadCalibrationEvidence(
  path: string | undefined,
): Promise<TaskCalibrationReport | undefined> {
  if (path === undefined) return undefined;
  const normalizedPath = path.trim();
  if (!normalizedPath) {
    throw new Error("--calibration-evidence requires a local JSON file path");
  }
  const parsed: unknown = JSON.parse(
    await Deno.readTextFile(normalizedPath),
  );
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      "calibration evidence must be an object with observations and optional options",
    );
  }
  const record = parsed as Record<string, unknown>;
  if (!Array.isArray(record.observations)) {
    throw new Error("calibration evidence observations must be an array");
  }
  return aggregateTaskCalibration(
    record.observations,
    record.options as TaskCalibrationOptions | undefined,
  );
}
