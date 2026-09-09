import { handle, streamHandle } from 'hono/aws-lambda';

type AwsLambdaRuntime = {
    streamifyResponse?: unknown;
};

function isResponseStreamingAvailable() {
    const runtime = (globalThis as typeof globalThis & { awslambda?: AwsLambdaRuntime }).awslambda;
    return typeof runtime?.streamifyResponse === 'function';
}

export function getLambdaHandlerFactory() {
    if (!isResponseStreamingAvailable()) return handle;
    return streamHandle;
}
