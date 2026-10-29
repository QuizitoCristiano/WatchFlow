import assert from 'node:assert/strict';
import test from 'node:test';
import { createIngestHandler, createProvisionHandler } from '../collector/_lib/httpHandlers.ts';
import type { ApiRequest, ApiResponse } from '../collector/_lib/httpHandlers.ts';
import { createCollectorService, type CollectorRepository } from '../collector/_lib/service.ts';
import { hashCollectorToken } from '../collector/_lib/domain.ts';
import type {
  AuthenticatedCollector,
  CollectorIdentity,
  FailedSample,
  SuccessfulSample,
} from '../collector/_lib/contracts.ts';
import { HttpError } from '../collector/_lib/errors.ts';

const PEPPER = 'test-pepper-with-at-least-thirty-two-characters';
const NOW = new Date('2026-10-28T20:00:00.000Z');
const USER_ID = 'authenticated-user';
const INTEGRATION_ID = 'integration-123';
const DEVICE_ID = `node-${INTEGRATION_ID}`;

const validPayload = (sampleId = 'c0d45abc-73cd-4a46-9e83-566a990f82cc'): SuccessfulSample => ({
  schemaVersion: 1,
  operation: 'success',
  sampleId,
  integrationId: INTEGRATION_ID,
  deviceId: DEVICE_ID,
  collectedAt: NOW.toISOString(),
  cpuUsagePercent: 25.5,
  memoryUsagePercent: 75,
  memoryUsedBytes: 75_000,
  memoryTotalBytes: 100_000,
  filesystems: [{
    device: '/dev/sda1',
    mountpoint: '/',
    filesystemType: 'ext4',
    usedBytes: 750,
    totalBytes: 1000,
    usedPercent: 75,
  }],
  network: {
    receiveBytesTotal: 10_000,
    transmitBytesTotal: 20_000,
    receiveBytesPerSecond: 100,
    transmitBytesPerSecond: 200,
  },
});

class MemoryRepository implements CollectorRepository {
  readonly credentials = new Map<string, CollectorIdentity>();
  readonly samples = new Map<string, SuccessfulSample>();
  readonly failures: FailedSample[] = [];
  readonly ownedIntegrations = new Set([`${USER_ID}/${INTEGRATION_ID}`]);

  async provision(
    userId: string,
    integrationId: string,
    deviceId: string,
    tokenHash: string,
  ): Promise<void> {
    if (!this.ownedIntegrations.has(`${userId}/${integrationId}`)) {
      throw new HttpError(403, 'Integração não pertence ao usuário autenticado.');
    }
    this.credentials.set(tokenHash, { userId, integrationId, deviceId });
  }

  async getCredential(tokenHash: string): Promise<AuthenticatedCollector | null> {
    const identity = this.credentials.get(tokenHash);
    return identity ? { identity, tokenHash } : null;
  }

  async recordSuccess(
    identity: CollectorIdentity,
    _tokenHash: string,
    sample: SuccessfulSample,
  ): Promise<'stored' | 'duplicate'> {
    if (!this.ownedIntegrations.has(`${identity.userId}/${identity.integrationId}`)) {
      throw new HttpError(403, 'Integração não pertence ao proprietário da credencial.');
    }
    if (this.samples.has(sample.sampleId)) return 'duplicate';
    this.samples.set(sample.sampleId, sample);
    return 'stored';
  }

  async recordFailure(
    identity: CollectorIdentity,
    _tokenHash: string,
    sample: FailedSample,
  ): Promise<void> {
    if (!this.ownedIntegrations.has(`${identity.userId}/${identity.integrationId}`)) {
      throw new HttpError(403, 'Integração não pertence ao proprietário da credencial.');
    }
    this.failures.push(sample);
  }
}

class MemoryResponse implements ApiResponse {
  statusCode = 200;
  readonly headers = new Map<string, string>();
  body = '';

  setHeader(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  end(body = ''): void {
    this.body = body;
  }

  json(): Record<string, unknown> {
    return JSON.parse(this.body) as Record<string, unknown>;
  }
}

function request(
  body: unknown,
  authorization?: string,
  extraHeaders: Record<string, string> = {},
): ApiRequest {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authorization ? { authorization } : {}),
      ...extraHeaders,
    },
    body,
  };
}

function serviceFixture() {
  const repository = new MemoryRepository();
  const service = createCollectorService(repository, PEPPER, () => new Date(NOW));
  const provision = createProvisionHandler({
    verifyIdToken: async (idToken) => {
      if (idToken !== 'valid-firebase-id-token') {
        throw Object.assign(new Error('invalid'), { code: 'auth/invalid-id-token' });
      }
      return { uid: USER_ID };
    },
    provision: service.provision,
  });
  const ingest = createIngestHandler({ ingest: service.ingest });
  return { repository, service, provision, ingest };
}

async function provisionValid(
  provision: ReturnType<typeof createProvisionHandler>,
): Promise<{ token: string; deviceId: string }> {
  const response = new MemoryResponse();
  await provision(
    request({ integrationId: INTEGRATION_ID }, 'Bearer valid-firebase-id-token'),
    response,
  );
  assert.equal(response.statusCode, 200);
  return response.json() as { token: string; deviceId: string };
}

test('provisioning requires a valid Firebase ID token', async () => {
  const { provision } = serviceFixture();
  const missing = new MemoryResponse();
  await provision(request({ integrationId: INTEGRATION_ID }), missing);
  assert.equal(missing.statusCode, 401);

  const invalid = new MemoryResponse();
  await provision(request({ integrationId: INTEGRATION_ID }, 'Bearer invalid-firebase-id-token'), invalid);
  assert.equal(invalid.statusCode, 401);
});

test('provisioning verifies integration ownership before storing a credential hash', async () => {
  const repository = new MemoryRepository();
  const service = createCollectorService(repository, PEPPER, () => new Date(NOW));
  const handler = createProvisionHandler({
    verifyIdToken: async () => ({ uid: 'another-user' }),
    provision: service.provision,
  });
  const response = new MemoryResponse();
  await handler(request({ integrationId: INTEGRATION_ID }, 'Bearer valid-firebase-id-token'), response);
  assert.equal(response.statusCode, 403);
  assert.equal(repository.credentials.size, 0);
});

test('invalid metric payload is rejected without persistence', async () => {
  const { repository, provision, ingest } = serviceFixture();
  const credentials = await provisionValid(provision);
  const payload = { ...validPayload(), cpuUsagePercent: 101 };
  const response = new MemoryResponse();
  await ingest(request(payload, `Bearer ${credentials.token}`), response);
  assert.equal(response.statusCode, 400);
  assert.equal(repository.samples.size, 0);

  const fractionalBytes = new MemoryResponse();
  await ingest(
    request(
      { ...validPayload(), memoryUsedBytes: 75_000.5 },
      `Bearer ${credentials.token}`,
    ),
    fractionalBytes,
  );
  assert.equal(fractionalBytes.statusCode, 400);
  assert.equal(repository.samples.size, 0);
});

test('valid telemetry is persisted under its owner and retries are idempotent', async () => {
  const { repository, provision, ingest } = serviceFixture();
  const credentials = await provisionValid(provision);
  const payload = validPayload();

  const stored = new MemoryResponse();
  await ingest(request(payload, `Bearer ${credentials.token}`), stored);
  assert.equal(stored.statusCode, 200);
  assert.equal(stored.json().result, 'stored');
  assert.equal(repository.samples.size, 1);
  assert.equal(repository.samples.get(payload.sampleId)?.deviceId, DEVICE_ID);

  const duplicate = new MemoryResponse();
  await ingest(request(payload, `Bearer ${credentials.token}`), duplicate);
  assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.json().result, 'duplicate');
  assert.equal(repository.samples.size, 1);
});

test('a collector credential cannot submit for another integration or device', async () => {
  const { provision, ingest, repository } = serviceFixture();
  const credentials = await provisionValid(provision);
  const payload = { ...validPayload(), deviceId: 'other-device' };
  const response = new MemoryResponse();
  await ingest(request(payload, `Bearer ${credentials.token}`), response);
  assert.equal(response.statusCode, 403);
  assert.equal(repository.samples.size, 0);
});

test('userId supplied in the sample is rejected instead of being trusted', async () => {
  const { provision, ingest, repository } = serviceFixture();
  const credentials = await provisionValid(provision);
  const payload = { ...validPayload(), userId: 'attacker-chosen-user' };
  const response = new MemoryResponse();
  await ingest(request(payload, `Bearer ${credentials.token}`), response);
  assert.equal(response.statusCode, 400);
  assert.equal(repository.samples.size, 0);
});

test('failed Node Exporter collection updates operational failure state without a metric', async () => {
  const { repository, provision, ingest } = serviceFixture();
  const credentials = await provisionValid(provision);
  const payload: FailedSample = {
    schemaVersion: 1,
    operation: 'error',
    sampleId: 'c0d45abc-73cd-4a46-9e83-566a990f82cc',
    integrationId: INTEGRATION_ID,
    deviceId: DEVICE_ID,
    collectedAt: NOW.toISOString(),
    error: 'Tempo limite ao consultar o Node Exporter. Authorization: Bearer abcdef1234567890 token=not-a-real-secret',
  };
  const response = new MemoryResponse();
  await ingest(request(payload, `Bearer ${credentials.token}`), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().result, 'failure-recorded');
  assert.equal(repository.failures.length, 1);
  assert.equal(repository.failures[0].error.includes('abcdef1234567890'), false);
  assert.equal(repository.failures[0].error.includes('not-a-real-secret'), false);
  assert.equal(repository.samples.size, 0);
});

test('invalid and oversized requests are rejected', async () => {
  const { ingest } = serviceFixture();
  const missingCredential = new MemoryResponse();
  await ingest(request(validPayload()), missingCredential);
  assert.equal(missingCredential.statusCode, 401);

  const oversized = new MemoryResponse();
  await ingest(
    request(validPayload(), `Bearer ${'a'.repeat(43)}`, { 'content-length': String(65 * 1024) }),
    oversized,
  );
  assert.equal(oversized.statusCode, 413);
});

test('credential storage keys are HMACs rather than plaintext tokens', () => {
  const token = 'A'.repeat(43);
  const hash = hashCollectorToken(token, PEPPER);
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f0-9]{64}$/);
});
