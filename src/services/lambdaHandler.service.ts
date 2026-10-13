import { handle, streamHandle } from 'hono/aws-lambda';
import type { LambdaContext, LambdaEvent } from 'hono/aws-lambda';
import type { Writable } from 'node:stream';
import { jobsInvocation } from '../jobs/invocation.ts';

type AwsLambdaRuntime = {
    streamifyResponse?: (handler: (...args: any[]) => Promise<void>) => any;
};

function isResponseStreamingAvailable() {
    const runtime = (globalThis as typeof globalThis & { awslambda?: AwsLambdaRuntime }).awslambda;
    return typeof runtime?.streamifyResponse === 'function';
}

type StreamingHandler = (event: LambdaEvent, stream: Writable, context: LambdaContext) => Promise<void>;

interface LambdaHandlerOptions {
    afterResponse: (context: LambdaContext) => Promise<void>;
    runJobs: (event: { installationId: string }, context: LambdaContext) => Promise<void>;
}

export function getLambdaHandlerFactory({ afterResponse, runJobs }: LambdaHandlerOptions) {
    const isJobsEvent = (event: any) =>
        !event?.requestContext && event?.type === 'weweb-jobs' && typeof event.installationId === 'string';
    if (!isResponseStreamingAvailable()) {
        return (...args: Parameters<typeof handle>) => {
            const http = handle(...args);

            return async (event: any, context: LambdaContext) => {
                if (isJobsEvent(event)) {
                    return runJobs(event, context);
                }

                return http(event, context);
            };
        };
    }

    return (...args: Parameters<typeof streamHandle>) => {
        // Hono declares a buffered Handler here, although the streaming runtime supplies these three arguments.
        const handler = streamHandle(...args) as unknown as StreamingHandler;
        const runtime = (globalThis as typeof globalThis & { awslambda: AwsLambdaRuntime }).awslambda;

        return runtime.streamifyResponse!(async (...invocation: Parameters<StreamingHandler>) => {
            if (isJobsEvent(invocation[0])) {
                invocation[1].end();
                await runJobs(invocation[0] as unknown as { installationId: string }, invocation[2]);

                return;
            }

            await jobsInvocation.run({ queued: false }, async () => {
                await handler(...invocation);
                // Hono has ended the response stream. Keep this invocation alive until recovery finishes.
                try {
                    await afterResponse(invocation[2]);
                } catch (error) {
                    console.error('Post-response recovery failed', error);
                }
            });
        });
    };
}
