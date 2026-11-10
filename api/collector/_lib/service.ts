import { HttpError } from './errors.ts';
import {
  createCollectorToken,
  hashCollectorToken,
  parseCollectorSample,
  validateProvisioningInput,
} from './domain.ts';
import type {
  CollectorIdentity,
  CollectorSample,
  ProvisionedCollector,
  AuthenticatedCollector,
} from './contracts.ts';

export interface CollectorRepository {
  provision(
    userId: string,
    integrationId: string,
    deviceId: string,
    tokenHash: string,
    issuedAt: Date,
  ): Promise<void>;
  getCredential(tokenHash: string): Promise<AuthenticatedCollector | null>;
  recordSuccess(
    identity: CollectorIdentity,
    tokenHash: string,
    sample: Extract<CollectorSample, { operation: 'success' }>,
    now: Date,
  ): Promise<'stored' | 'duplicate'>;
  recordFailure(
    identity: CollectorIdentity,
    tokenHash: string,
    sample: Extract<CollectorSample, { operation: 'error' }>,
    now: Date,
  ): Promise<void>;
}

export interface CollectorService {
  provision(userId: string, input: unknown): Promise<ProvisionedCollector>;
  ingest(token: string, input: unknown): Promise<{ result: 'stored' | 'duplicate' | 'failure-recorded' }>;
}

export function createCollectorService(
  repository: CollectorRepository,
  pepper: string,
  clock: () => Date = () => new Date(),
): CollectorService {
  if (pepper.length < 32) throw new Error('COLLECTOR_TOKEN_PEPPER must be at least 32 characters.');

  return {
    async provision(userId, input) {
      if (!userId) throw new HttpError(401, 'Autenticação necessária.');
      const integrationId = validateProvisioningInput(input);
      const token = createCollectorToken();
      const deviceId = `node-${integrationId}`;
      await repository.provision(
        userId,
        integrationId,
        deviceId,
        hashCollectorToken(token, pepper),
        clock(),
      );
      return { token, deviceId };
    },

    async ingest(token, input) {
      if (!token || token.length > 256) throw new HttpError(401, 'Credencial do coletor inválida.');
      const authenticated = await repository.getCredential(hashCollectorToken(token, pepper));
      if (!authenticated) throw new HttpError(401, 'Credencial do coletor inválida ou revogada.');
      const { identity, tokenHash } = authenticated;
      const now = clock();
      const sample = parseCollectorSample(input, identity, now);
      if (sample.operation === 'error') {
        await repository.recordFailure(identity, tokenHash, sample, now);
        return { result: 'failure-recorded' };
      }
      return { result: await repository.recordSuccess(identity, tokenHash, sample, now) };
    },
  };
}
