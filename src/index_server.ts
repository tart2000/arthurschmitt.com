import { serve } from '@hono/node-server';
import * as path from 'node:path';
import './core/env.core.js';
import { initializeDataFiles } from './services/dataFiles.service.ts';

await initializeDataFiles(path.resolve(import.meta.dirname, '..'));

const { default: app } = await import('./core/app.core.js');

const PORT = Number.parseInt(process.env.PORT) || 3030;
const server = serve({ fetch: app.fetch, port: PORT }, info =>
    console.log(`Server is running on http://localhost:${info.port}`)
);
const { startJobsLoop } = await import('./jobs/runtime.ts');
const shutdown = new AbortController();
void startJobsLoop(shutdown.signal);
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
        shutdown.abort();
        server.close();
    });
}
