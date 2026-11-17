export type MetricSeverity = 'warning' | 'critical';

/** Threshold policy shared by the ingestion use case and its unit tests. */
export function getMetricSeverity(value: number): MetricSeverity | null {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError('Metric value must be a finite percentage between 0 and 100.');
  }
  if (value >= 90) return 'critical';
  if (value >= 80) return 'warning';
  return null;
}
