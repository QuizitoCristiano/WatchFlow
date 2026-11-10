# WatchFlow Node Exporter Collector

The collector can run in local one-shot mode or periodically send authenticated metrics through the Vercel API. The full contract, setup, security controls, retention and limitations are documented in [monitoring-collector.md](../docs/architecture/monitoring-collector.md).

## Production setup

1. Sign in to WatchFlow and create a Node Exporter integration.
2. In Integrações, choose **Gerar credencial do coletor** and securely copy the one-time PowerShell command. It contains a 90-day per-integration token; generating another token revokes the previous one.
3. Configure `FIREBASE_SERVICE_ACCOUNT_JSON` and `COLLECTOR_TOKEN_PEPPER` as server-only Vercel environment variables. Do not use `VITE_` names and do not put either value on the collector host.
4. Deploy the application/API and configure Firestore TTL for the `metrics` collection group on `expiresAt`.
5. Run the copied command on a host that can reach the private Node Exporter and the Vercel HTTPS endpoint. The default collection interval is 60 seconds. Stop with Ctrl+C.

The API persists real data under `users/{uid}/devices/{deviceId}/metrics/{sampleId}`. The Vercel server validates Firebase ownership during enrollment and uses Firebase Admin only server-side. The collector does not send a `userId`; its token is bound to the provisioned integration and device. Never expose port 9100 to the Internet.

With `WATCHFLOW_INGEST_URL` and `WATCHFLOW_INGEST_TOKEN` unset, `npm run collector:start` performs one local collection and prints JSON without persisting it.

## Local frontend demonstration

For the local read-only page, run `npm run dev`, sign in and open `/collector-demo`. This loopback-only Vite endpoint reads the Node Exporter and writes no Firestore data. It is separate from the authenticated ingestion flow.