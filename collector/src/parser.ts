import { CollectorError } from './config.ts';

export interface MetricSample {
  name: string;
  labels: Readonly<Record<string, string>>;
  value: number;
}

const SUPPORTED_METRICS = new Set([
  'node_cpu_seconds_total',
  'node_memory_MemTotal_bytes',
  'node_memory_MemAvailable_bytes',
  'node_filesystem_size_bytes',
  'node_filesystem_free_bytes',
  'node_filesystem_device_error',
  'node_network_receive_bytes_total',
  'node_network_transmit_bytes_total',
]);

function parseLabels(source: string): Record<string, string> {
  const labels: Record<string, string> = {};
  let index = 0;

  while (index < source.length) {
    const keyMatch = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(source.slice(index));
    if (!keyMatch) throw new CollectorError('Rótulos inválidos em uma métrica suportada.');
    const key = keyMatch[0];
    index += key.length;

    if (source[index] !== '=') throw new CollectorError('Rótulos inválidos em uma métrica suportada.');
    index += 1;
    if (source[index] !== '"') throw new CollectorError('Rótulos inválidos em uma métrica suportada.');
    index += 1;

    let value = '';
    let closed = false;
    while (index < source.length) {
      const character = source[index];
      index += 1;

      if (character === '"') {
        closed = true;
        break;
      }
      if (character === '\\') {
        const escaped = source[index];
        index += 1;
        if (escaped === 'n') value += '\n';
        else if (escaped === '"' || escaped === '\\') value += escaped;
        else throw new CollectorError('Escape inválido em rótulo de métrica suportada.');
      } else {
        value += character;
      }
    }

    if (!closed || Object.hasOwn(labels, key)) {
      throw new CollectorError('Rótulos inválidos em uma métrica suportada.');
    }
    labels[key] = value;

    if (index === source.length) break;
    if (source[index] !== ',') throw new CollectorError('Rótulos inválidos em uma métrica suportada.');
    index += 1;
    if (index === source.length) throw new CollectorError('Rótulos inválidos em uma métrica suportada.');
  }

  return labels;
}

function parseMetricLine(line: string, lineNumber: number): MetricSample | null {
  const nameMatch = /^([a-zA-Z_:][a-zA-Z0-9_:]*)/.exec(line);
  if (!nameMatch) return null;

  const name = nameMatch[1];
  if (!SUPPORTED_METRICS.has(name)) return null;

  let remainder = line.slice(name.length).trimStart();
  let labels: Record<string, string> = {};

  if (remainder.startsWith('{')) {
    let quoted = false;
    let escaped = false;
    let closingIndex = -1;

    for (let index = 1; index < remainder.length; index += 1) {
      const character = remainder[index];
      if (escaped) {
        escaped = false;
      } else if (character === '\\' && quoted) {
        escaped = true;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === '}' && !quoted) {
        closingIndex = index;
        break;
      }
    }

    if (closingIndex < 0) throw new CollectorError(`Rótulos malformados na linha ${lineNumber}.`);
    labels = parseLabels(remainder.slice(1, closingIndex));
    remainder = remainder.slice(closingIndex + 1).trimStart();
  }

  const fields = remainder.split(/\s+/);
  const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
  if (fields.length < 1 || fields.length > 2 || !numericPattern.test(fields[0])) {
    throw new CollectorError(`Valor inválido na métrica suportada da linha ${lineNumber}.`);
  }
  if (fields.length === 2 && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(fields[1])) {
    throw new CollectorError(`Timestamp inválido na métrica suportada da linha ${lineNumber}.`);
  }

  const value = Number(fields[0]);
  if (!Number.isFinite(value) || value < 0) {
    throw new CollectorError(`Valor inválido na métrica suportada da linha ${lineNumber}.`);
  }

  if (name === 'node_cpu_seconds_total') {
    if (!/^\d+$/.test(labels.cpu ?? '') || !labels.mode) {
      throw new CollectorError(`Rótulos cpu/mode ausentes ou inválidos na linha ${lineNumber}.`);
    }
  } else if (name.startsWith('node_filesystem_')) {
    if (!labels.device || !labels.fstype || !labels.mountpoint) {
      throw new CollectorError(`Rótulos device/fstype/mountpoint ausentes na linha ${lineNumber}.`);
    }
    if (name === 'node_filesystem_device_error' && value > 1) {
      throw new CollectorError(`Valor inválido em node_filesystem_device_error na linha ${lineNumber}.`);
    }
  } else if (name.startsWith('node_network_')) {
    if (!labels.device) {
      throw new CollectorError(`Rótulo device ausente na métrica de rede na linha ${lineNumber}.`);
    }
  } else if (Object.keys(labels).length > 0) {
    throw new CollectorError(`A métrica de memória contém rótulos inesperados na linha ${lineNumber}.`);
  }

  return { name, labels, value };
}

export function parsePrometheusText(text: string): MetricSample[] {
  if (!text.trim()) throw new CollectorError('A resposta do Node Exporter está vazia.');

  const samples: MetricSample[] = [];
  const seen = new Set<string>();

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const sample = parseMetricLine(line, index + 1);
    if (!sample) continue;

    const labelKey = Object.entries(sample.labels)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    const identity = `${sample.name}{${labelKey}}`;
    if (seen.has(identity)) throw new CollectorError(`Série duplicada na linha ${index + 1}.`);
    seen.add(identity);
    samples.push(sample);
  }

  return samples;
}