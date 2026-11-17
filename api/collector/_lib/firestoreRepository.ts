import { createHash } from 'node:crypto';
import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore';
import { HttpError } from './errors.ts';
import { getMetricSeverity } from './alertPolicy.ts';
import type {
  AuthenticatedCollector,
  CollectorIdentity,
  FailedSample,
  SuccessfulSample,
} from './contracts.ts';
import type { CollectorRepository } from './service.ts';

const MIN_WRITE_INTERVAL_MS = 15_000;
const MIN_PROVISION_INTERVAL_MS = 60_000;
const PROVISION_WINDOW_MS = 60 * 60_000;
const MAX_PROVISIONS_PER_WINDOW = 5;
const BUCKET_MS = 60 * 60_000;
const WINDOW_BUCKETS = 24;

type DocumentData = Record<string, unknown>;

function getRecord(value: unknown): DocumentData {
  return typeof value === 'object' && value !== null
    ? value as DocumentData
    : {};
}

function getBucketMap(data: DocumentData, now: Date, successful: boolean): {
  buckets: Record<string, { attempts: number; successes: number }>;
  attempts: number;
  successes: number;
} {
  const rawBuckets = getRecord(data.collectorAttemptBuckets);
  const currentHour = Math.floor(now.getTime() / BUCKET_MS);
  const oldestHour = currentHour - WINDOW_BUCKETS + 1;
  const buckets: Record<string, { attempts: number; successes: number }> = {};

  for (const [hour, rawValue] of Object.entries(rawBuckets)) {
    const parsedHour = Number(hour);
    const value = getRecord(rawValue);
    const attempts = value.attempts;
    const successes = value.successes;
    if (
      Number.isSafeInteger(parsedHour) &&
      parsedHour >= oldestHour &&
      parsedHour <= currentHour &&
      typeof attempts === 'number' &&
      Number.isSafeInteger(attempts) &&
      attempts >= 0 &&
      typeof successes === 'number' &&
      Number.isSafeInteger(successes) &&
      successes >= 0 &&
      successes <= attempts
    ) {
      buckets[hour] = {
        attempts,
        successes,
      };
    }
  }

  const current = buckets[String(currentHour)] ?? { attempts: 0, successes: 0 };
  current.attempts += 1;
  if (successful) current.successes += 1;
  buckets[String(currentHour)] = current;

  const totals = Object.values(buckets).reduce(
    (result, bucket) => ({
      attempts: result.attempts + bucket.attempts,
      successes: result.successes + bucket.successes,
    }),
    { attempts: 0, successes: 0 },
  );
  return { buckets, ...totals };
}

function metricDocument(sample: SuccessfulSample): DocumentData {
  const collectedAt = new Date(sample.collectedAt);
  const memoryTotalMb = sample.memoryTotalBytes / (1024 * 1024);
  const memoryUsedMb = sample.memoryUsedBytes / (1024 * 1024);
  const diskTotalBytes = sample.filesystems.reduce((sum, filesystem) => sum + filesystem.totalBytes, 0);
  const diskUsedBytes = sample.filesystems.reduce((sum, filesystem) => sum + filesystem.usedBytes, 0);
  const diskTotalGb = diskTotalBytes / (1024 ** 3);
  const diskUsedGb = diskUsedBytes / (1024 ** 3);
  const result: DocumentData = {
    integrationId: sample.integrationId,
    deviceId: sample.deviceId,
    source: 'node_exporter',
    isDemoData: false,
    collectedAt: Timestamp.fromDate(collectedAt),
    expiresAt: Timestamp.fromDate(new Date(collectedAt.getTime() + 90 * 24 * 60 * 60_000)),
    cpu: { usagePercent: sample.cpuUsagePercent },
    memory: {
      usedPercent: sample.memoryUsagePercent,
      totalMb: memoryTotalMb,
      usedMb: memoryUsedMb,
      freeMb: memoryTotalMb - memoryUsedMb,
    },
    disk: {
      usedPercent: diskTotalBytes > 0 ? (diskUsedBytes / diskTotalBytes) * 100 : 0,
      totalGb: diskTotalGb,
      usedGb: diskUsedGb,
      freeGb: diskTotalGb - diskUsedGb,
    },
    filesystems: sample.filesystems,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (sample.network) {
    result.network = {
      bytesInSec: sample.network.receiveBytesPerSecond,
      bytesOutSec: sample.network.transmitBytesPerSecond,
      receiveBytesTotal: sample.network.receiveBytesTotal,
      transmitBytesTotal: sample.network.transmitBytesTotal,
    };
  }
  return result;
}

type AlertMetric = { type: 'CPU_HIGH' | 'RAM_HIGH' | 'DISK_HIGH'; metric: string; value: number };

function alertReference(db: Firestore, userId: string, deviceId: string, type: AlertMetric['type']) {
  // Hashing creates a stable Firestore-safe ID without exposing identifiers in document names.
  const id = createHash('sha256').update(`${userId}:${deviceId}:${type}`).digest('hex');
  return db.doc(`alerts/collector-${id}`);
}

function updateMetricAlert(
  transaction: Transaction,
  reference: DocumentReference,
  snapshot: DocumentSnapshot,
  identity: CollectorIdentity,
  deviceName: string,
  metric: AlertMetric,
  now: Date,
): void {
  const previous = getRecord(snapshot.data());
  const severity = getMetricSeverity(metric.value);

  if (!severity) {
    if (previous.status === 'active' || previous.status === 'acknowledged') {
      transaction.set(reference, {
        status: 'resolved',
        resolvedAt: Timestamp.fromDate(now),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    return;
  }

  const wasOpen = previous.status === 'active' || previous.status === 'acknowledged';
  const threshold = severity === 'critical' ? 90 : 80;
  transaction.set(reference, {
    userId: identity.userId,
    deviceId: identity.deviceId,
    integrationId: identity.integrationId,
    deviceName,
    type: metric.type,
    title: `${metric.metric}: uso elevado`,
    description: `${metric.metric} está em ${metric.value.toFixed(1)}% (limite de atenção: 80%; crítico: 90%).`,
    severity,
    status: wasOpen && previous.status === 'acknowledged' ? 'acknowledged' : 'active',
    isDemoData: false,
    metricTriggered: {
      metric: metric.metric,
      value: Number(metric.value.toFixed(2)),
      threshold,
      operator: '>' as const,
    },
    firstDetectedAt: wasOpen && previous.firstDetectedAt instanceof Timestamp
      ? previous.firstDetectedAt
      : Timestamp.fromDate(now),
    lastDetectedAt: Timestamp.fromDate(now),
    resolvedAt: null,
    createdAt: wasOpen && previous.createdAt ? previous.createdAt : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

function integrationReference(db: Firestore, identity: CollectorIdentity) {
  return db.doc(`users/${identity.userId}/integrations/${identity.integrationId}`);
}

function credentialReference(db: Firestore, tokenHash: string) {
  return db.doc(`collectorCredentials/${tokenHash}`);
}

export function validateNodeExporterEndpoint(value: unknown): void {
  if (typeof value !== 'string' || value.length > 2048) {
    throw new HttpError(400, 'Endpoint do Node Exporter inválido.');
  }
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    throw new HttpError(400, 'Endpoint do Node Exporter inválido.');
  }
  const port = endpoint.port || (endpoint.protocol === 'https:' ? '443' : '80');
  const hostname = endpoint.hostname.toLowerCase();
  if (
    !['http:', 'https:'].includes(endpoint.protocol) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== '/metrics' ||
    !['9100', '443'].includes(port) ||
    (port === '443' && endpoint.protocol !== 'https:') ||
    hostname === '169.254.169.254' ||
    hostname.startsWith('169.254.') ||
    hostname === '100.100.100.200' ||
    hostname === 'metadata.google.internal' ||
    hostname === 'metadata.azure.internal'
  ) {
    throw new HttpError(400, 'Endpoint do Node Exporter viola a política de protocolo, porta ou destino.');
  }
}

function ensureOwner(
  integrationSnapshot: DocumentSnapshot,
  identity: CollectorIdentity,
): DocumentData {
  if (!integrationSnapshot.exists) throw new HttpError(401, 'Integração removida ou não autorizada.');
  const data = getRecord(integrationSnapshot.data());
  if (data.userId !== identity.userId || data.type !== 'node_exporter') {
    throw new HttpError(403, 'A integração não pertence ao proprietário da credencial.');
  }
  return data;
}

function ensureCredential(
  credentialSnapshot: DocumentSnapshot,
  identity: CollectorIdentity,
  now: Date,
): DocumentData {
  const data = getRecord(credentialSnapshot.data());
  if (
    !credentialSnapshot.exists ||
    data.userId !== identity.userId ||
    data.integrationId !== identity.integrationId ||
    data.deviceId !== identity.deviceId ||
    !(data.expiresAt instanceof Timestamp) ||
    data.expiresAt.toMillis() <= now.getTime()
  ) {
    throw new HttpError(401, 'Credencial do coletor revogada.');
  }
  return data;
}

function ensureWriteInterval(data: DocumentData, now: Date): void {
  const lastAttempt = data.lastIngestAt;
  if (
    lastAttempt instanceof Timestamp &&
    now.getTime() - lastAttempt.toMillis() < MIN_WRITE_INTERVAL_MS
  ) {
    throw new HttpError(429, 'Coleta recebida antes do intervalo mínimo de 15 segundos.');
  }
}

function updateAttemptFields(
  integrationData: DocumentData,
  now: Date,
  successful: boolean,
) {
  const counts = getBucketMap(integrationData, now, successful);
  return {
    collectorAttemptBuckets: counts.buckets,
    attemptsLast24h: counts.attempts,
    successesLast24h: counts.successes,
    lastAttemptAt: Timestamp.fromDate(now),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export function createFirestoreCollectorRepository(db: Firestore): CollectorRepository {
  return {
    async provision(userId, integrationId, deviceId, tokenHash, issuedAt) {
      const integrationRef = db.doc(`users/${userId}/integrations/${integrationId}`);
      const credentialStateId = createHash('sha256').update(`${userId}:${integrationId}`).digest('hex');
      const credentialStateRef = db.doc(`collectorCredentialState/${credentialStateId}`);
      const newCredentialRef = credentialReference(db, tokenHash);

      await db.runTransaction(async (transaction) => {
        const [integrationSnapshot, stateSnapshot, newCredentialSnapshot] = await Promise.all([
          transaction.get(integrationRef),
          transaction.get(credentialStateRef),
          transaction.get(newCredentialRef),
        ]);
        if (!integrationSnapshot.exists) throw new HttpError(404, 'Integração não encontrada.');
        const integration = getRecord(integrationSnapshot.data());
        if (integration.userId !== userId) throw new HttpError(403, 'Integração não pertence ao usuário autenticado.');
        if (integration.type !== 'node_exporter') {
          throw new HttpError(400, 'A ingestão ainda suporta somente Node Exporter.');
        }
        validateNodeExporterEndpoint(integration.baseUrl);
        const previousState = getRecord(stateSnapshot.data());
        const lastRotation = previousState.rotatedAt;
        if (lastRotation instanceof Timestamp && issuedAt.getTime() - lastRotation.toMillis() < MIN_PROVISION_INTERVAL_MS) {
          throw new HttpError(429, 'Aguarde 60 segundos antes de gerar outra credencial.');
        }
        const windowStartedAt = previousState.rotationWindowStartedAt;
        const windowIsCurrent = windowStartedAt instanceof Timestamp &&
          issuedAt.getTime() - windowStartedAt.toMillis() < PROVISION_WINDOW_MS;
        const rotationCount = windowIsCurrent && Number.isSafeInteger(previousState.rotationCount)
          ? Number(previousState.rotationCount)
          : 0;
        if (rotationCount >= MAX_PROVISIONS_PER_WINDOW) {
          throw new HttpError(429, 'Limite de 5 provisionamentos por hora atingido.');
        }
        if (newCredentialSnapshot.exists) throw new HttpError(409, 'Não foi possível gerar uma credencial exclusiva.');

        const previousHash = previousState.tokenHash;
        const previousCredentialRef = typeof previousHash === 'string'
          ? credentialReference(db, previousHash)
          : null;
        const previousCredentialSnapshot = previousCredentialRef
          ? await transaction.get(previousCredentialRef)
          : null;

        transaction.set(newCredentialRef, {
          userId,
          integrationId,
          deviceId,
          createdAt: Timestamp.fromDate(issuedAt),
          expiresAt: Timestamp.fromDate(new Date(issuedAt.getTime() + 90 * 24 * 60 * 60_000)),
        });
        if (previousCredentialRef && previousCredentialSnapshot?.exists) {
          transaction.delete(previousCredentialRef);
        }
        transaction.set(credentialStateRef, {
          userId,
          integrationId,
          tokenHash,
          rotatedAt: Timestamp.fromDate(issuedAt),
          expiresAt: Timestamp.fromDate(new Date(issuedAt.getTime() + 90 * 24 * 60 * 60_000)),
          rotationWindowStartedAt: windowIsCurrent ? windowStartedAt : Timestamp.fromDate(issuedAt),
          rotationCount: rotationCount + 1,
        });
      });
    },

    async getCredential(tokenHash): Promise<AuthenticatedCollector | null> {
      const reference = credentialReference(db, tokenHash);
      return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) return null;
        const data = getRecord(snapshot.data());
        const now = new Date();
        if (
          typeof data.userId !== 'string' ||
          typeof data.integrationId !== 'string' ||
          typeof data.deviceId !== 'string' ||
          !(data.expiresAt instanceof Timestamp) ||
          data.expiresAt.toMillis() <= now.getTime()
        ) return null;

        // Persist the request timestamp so the interval is enforced across serverless instances.
        const lastRequestAt = data.lastRequestAt;
        if (
          lastRequestAt instanceof Timestamp &&
          now.getTime() - lastRequestAt.toMillis() < MIN_WRITE_INTERVAL_MS
        ) {
          throw new HttpError(429, 'Limite de ingestão atingido. Aguarde pelo menos 15 segundos.');
        }
        transaction.update(reference, { lastRequestAt: Timestamp.fromDate(now) });
        return {
          identity: {
            userId: data.userId,
            integrationId: data.integrationId,
            deviceId: data.deviceId,
          },
          tokenHash,
        };
      });
    },

    async recordSuccess(identity, tokenHash, sample, now) {
      const integrationRef = integrationReference(db, identity);
      const deviceRef = db.doc(`users/${identity.userId}/devices/${identity.deviceId}`);
      const metricRef = deviceRef.collection('metrics').doc(sample.sampleId);
      const credentialRef = credentialReference(db, tokenHash);
      const diskPercent = sample.filesystems.reduce((sum, filesystem) => sum + filesystem.usedBytes, 0) /
        sample.filesystems.reduce((sum, filesystem) => sum + filesystem.totalBytes, 0) * 100;
      const alertMetrics: AlertMetric[] = [
        { type: 'CPU_HIGH', metric: 'CPU', value: sample.cpuUsagePercent },
        { type: 'RAM_HIGH', metric: 'RAM', value: sample.memoryUsagePercent },
        { type: 'DISK_HIGH', metric: 'Disco', value: diskPercent },
      ];
      const alertRefs = alertMetrics.map((metric) => alertReference(db, identity.userId, identity.deviceId, metric.type));

      return db.runTransaction(async (transaction) => {
        const snapshots = await Promise.all([
          transaction.get(integrationRef),
          transaction.get(deviceRef),
          transaction.get(metricRef),
          transaction.get(credentialRef),
          ...alertRefs.map((reference) => transaction.get(reference)),
        ]);
        const [integrationSnapshot, deviceSnapshot, metricSnapshot, credentialSnapshot] = snapshots;
        const alertSnapshots = snapshots.slice(4);
        const integration = ensureOwner(integrationSnapshot, identity);
        const credential = ensureCredential(credentialSnapshot, identity, now);
        if (metricSnapshot.exists) {
          const existingMetric = getRecord(metricSnapshot.data());
          if (
            existingMetric.integrationId === identity.integrationId &&
            existingMetric.deviceId === identity.deviceId &&
            existingMetric.isDemoData === false
          ) return 'duplicate';
          throw new HttpError(409, 'O sampleId já pertence a outro documento.');
        }
        if (
          credential.lastAcceptedSampleId === sample.sampleId &&
          credential.lastAcceptedOperation === 'error'
        ) {
          throw new HttpError(409, 'O sampleId já foi usado para reportar uma falha.');
        }
        ensureWriteInterval(credential, now);
        if (
          deviceSnapshot.exists &&
          (deviceSnapshot.data()?.userId !== identity.userId ||
            deviceSnapshot.data()?.integrationId !== identity.integrationId)
        ) {
          throw new HttpError(409, 'O dispositivo já está associado a outro proprietário ou integração.');
        }

        const diskTotalBytes = sample.filesystems.reduce((sum, filesystem) => sum + filesystem.totalBytes, 0);
        const diskUsedBytes = sample.filesystems.reduce((sum, filesystem) => sum + filesystem.usedBytes, 0);
        const memoryTotalGb = sample.memoryTotalBytes / (1024 ** 3);
        const memoryUsedGb = sample.memoryUsedBytes / (1024 ** 3);
        const baseUrl = typeof integration.baseUrl === 'string' ? integration.baseUrl : '';
        let host: string;
        try {
          const endpoint = new URL(baseUrl);
          if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') throw new Error();
          host = endpoint.hostname;
        } catch {
          throw new HttpError(409, 'O endpoint salvo na integração não é válido.');
        }
        const deviceData: DocumentData = {
          userId: identity.userId,
          integrationId: identity.integrationId,
          hostname: typeof integration.name === 'string' ? integration.name : identity.deviceId,
          ip: host,
          status: alertMetrics.some((metric) => metric.value >= 90) ? 'critical' :
            alertMetrics.some((metric) => metric.value >= 80) ? 'warning' : 'online',
          isDemoData: false,
          lastSeen: Timestamp.fromDate(now),
          updatedAt: FieldValue.serverTimestamp(),
          latestMetricsSummary: {
            cpu: sample.cpuUsagePercent,
            memory: sample.memoryUsagePercent,
            memoryUsedGb,
            memoryTotalGb,
            disk: diskTotalBytes > 0 ? (diskUsedBytes / diskTotalBytes) * 100 : 0,
            diskUsedGb: diskUsedBytes / (1024 ** 3),
            diskTotalGb: diskTotalBytes / (1024 ** 3),
            networkInBytesSec: sample.network?.receiveBytesPerSecond ?? null,
            networkOutBytesSec: sample.network?.transmitBytesPerSecond ?? null,
          },
        };
        if (!deviceSnapshot.exists) deviceData.createdAt = FieldValue.serverTimestamp();

        transaction.set(metricRef, metricDocument(sample));
        transaction.set(deviceRef, deviceData, { merge: true });
        transaction.update(credentialRef, {
          lastIngestAt: Timestamp.fromDate(now),
          lastAcceptedSampleId: sample.sampleId,
          lastAcceptedOperation: 'success',
        });
        transaction.update(integrationRef, {
          ...updateAttemptFields(integration, now, true),
          status: 'online',
          lastSuccessAt: Timestamp.fromDate(now),
          lastSync: Timestamp.fromDate(now),
          lastError: null,
        });

        // Alert lifecycle is evaluated in the same transaction as the metric write.
        alertMetrics.forEach((metric, index) => {
          updateMetricAlert(
            transaction,
            alertRefs[index],
            alertSnapshots[index],
            identity,
            typeof integration.name === 'string' ? integration.name : identity.deviceId,
            metric,
            now,
          );
        });
        return 'stored';
      });
    },

    async recordFailure(identity, tokenHash, sample: FailedSample, now) {
      const integrationRef = integrationReference(db, identity);
      const deviceRef = db.doc(`users/${identity.userId}/devices/${identity.deviceId}`);
      const credentialRef = credentialReference(db, tokenHash);

      await db.runTransaction(async (transaction) => {
        const [integrationSnapshot, deviceSnapshot, credentialSnapshot] = await Promise.all([
          transaction.get(integrationRef),
          transaction.get(deviceRef),
          transaction.get(credentialRef),
        ]);
        const integration = ensureOwner(integrationSnapshot, identity);
        const credential = ensureCredential(credentialSnapshot, identity, now);
        if (
          credential.lastAcceptedSampleId === sample.sampleId &&
          credential.lastAcceptedOperation === 'error'
        ) return;
        if (
          credential.lastAcceptedSampleId === sample.sampleId &&
          credential.lastAcceptedOperation === 'success'
        ) {
          throw new HttpError(409, 'O sampleId já foi usado para registrar uma métrica.');
        }
        ensureWriteInterval(credential, now);
        if (
          deviceSnapshot.exists &&
          (deviceSnapshot.data()?.userId !== identity.userId ||
            deviceSnapshot.data()?.integrationId !== identity.integrationId)
        ) {
          throw new HttpError(409, 'O dispositivo já está associado a outro proprietário ou integração.');
        }

        transaction.update(integrationRef, {
          ...updateAttemptFields(integration, now, false),
          status: 'error',
          lastError: sample.error,
        });
        transaction.update(credentialRef, {
          lastIngestAt: Timestamp.fromDate(now),
          lastAcceptedSampleId: sample.sampleId,
          lastAcceptedOperation: 'error',
        });
        if (deviceSnapshot.exists) {
          transaction.update(deviceRef, {
            status: 'offline',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });
    },
  };
}
