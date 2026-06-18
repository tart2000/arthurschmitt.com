import type { ResponseContext } from '@better-fetch/fetch';

type RequestHeaders = Record<string, unknown>;

function sanitizeHeaders(headers: RequestHeaders = {}) {
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined || value === null) continue;
        sanitizedHeaders[key] = typeof value === 'string' ? value : `${value}`;
    }
    return sanitizedHeaders;
}

export function buildEditorRequestHeaders({
    isTest = false,
    headers = {},
    actionId = null,
    encodedPreviousResults = null,
    env = null,
}: {
    isTest?: boolean;
    headers?: RequestHeaders;
    actionId?: string | null;
    encodedPreviousResults?: string | null;
    env?: string | null;
} = {}) {
    const baseHeaders: RequestHeaders = {
        'ww-socket-id': wwLib.$socket?.id,
        'ww-editor-user-id': wwLib.$store.getters['manager/getUser']?.id,
        'ww-editor-test': isTest ? 'true' : 'false',
        ...(actionId ? { 'ww-editor-action-id': actionId } : {}),
        ...(encodedPreviousResults ? { 'ww-editor-previous-results': encodedPreviousResults } : {}),
        ...(env ? { 'ww-editor-env': env } : {}),
        ...headers,
    };

    return sanitizeHeaders(baseHeaders);
}

export function buildRequestPayload({
    method,
    parameters = {},
    body,
}: {
    method?: string;
    parameters?: Record<string, unknown>;
    body?: unknown;
}) {
    const methodUpper = method?.toUpperCase() || 'POST';
    if (methodUpper === 'GET' || methodUpper === 'DELETE') {
        return { query: { ...parameters } };
    }

    return { body: body ?? parameters };
}

export async function requestWithOptionalSSE<T = unknown>({
    url,
    requestOptions = {},
    stream = false,
}: {
    url: string;
    requestOptions?: WwServerRequestOptions<T>;
    stream?: boolean;
}): Promise<T | ReadableStream<Uint8Array> | null> {
    const existingHookOptions = requestOptions.hookOptions;
    const existingOnResponse = requestOptions.onResponse;

    const hookOptions = stream ? { ...existingHookOptions, cloneResponse: true } : existingHookOptions;

    return await new Promise((resolve, reject) => {
        wwServerClient<T>(url, {
            ...requestOptions,
            ...(hookOptions ? { hookOptions } : {}),
            onResponse: async (context: ResponseContext) => {
                const contentType = context.response.headers.get('content-type');
                const isSSE = contentType?.includes('text/event-stream');
                if (isSSE && stream) {
                    resolve(context.response?.body);
                    return null;
                }

                if (existingOnResponse) {
                    return await existingOnResponse(context);
                }

                return context.response;
            },
        })
            .then(resolve)
            .catch(reject);
    });
}
