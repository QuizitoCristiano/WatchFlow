import { fetchMetricsText } from './http.ts';
import { calculateMetrics } from './metrics.ts';
import { parsePrometheusText } from './parser.ts';
import type { CollectedMetrics } from './metrics.ts';

export type Fetcher = typeof fetch;
export type Wait = (milliseconds: number) => Promise<void>;

const wait: Wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function collectMetrics(
  endpoint: URL,
  timeoutMs: number,
  sampleIntervalMs: number,
  fetcher: Fetcher = fetch,
  waitBetweenSamples: Wait = wait,
  deviceId = endpoint.hostname,
): Promise<CollectedMetrics> {
  const firstText = await fetchMetricsText(endpoint, timeoutMs, fetcher);
  const firstSampleAt = performance.now();
  const firstSample = parsePrometheusText(firstText);

  await waitBetweenSamples(sampleIntervalMs);

  const secondSampleAt = performance.now();
  const secondText = await fetchMetricsText(endpoint, timeoutMs, fetcher);
  const secondSample = parsePrometheusText(secondText);

  return calculateMetrics(
    firstSample,
    secondSample,
    new Date().toISOString(),
    deviceId,
    (secondSampleAt - firstSampleAt) / 1000,
  );
}