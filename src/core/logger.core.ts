import type { Context } from 'hono';
import { truncateData, removeSensitiveData } from '../utils/truncateData.ts';

type Env = {
    Variables: {
        _requestId: string;
        _startTime: number;
        workflow?: { id: string };
        tableView?: { id: string };
    };
};

export const logEndpoint = async (c: Context<Env>) => {
    // Clone the response before any other await: the Lambda adapter consumes it as soon as the route returns.
    const responseData = await getResponseBody(c);
    const logMessage = {
        type: 'request',
        executionId: c.get('_requestId'),
        projectLogsSecret: process.env.WEWEB_PROJECT_LOGS_SECRET,
        env: process.env.ENV,
        data: {
            endpointId: c.get('workflow')?.id,
            tableViewId: c.get('tableView')?.id,
            request: {
                method: c.req.method,
                path: c.req.path,
                body: await getRequestBody(c),
                params: c.req.param(),
                query: c.req.queries(),
                headers: c.req.header(),
            },
            response: {
                data: responseData,
                status: c.res.status,
                headers: Object.fromEntries(c.res.headers.entries()),
            },
        },
        executionTimeMs: Date.now() - c.get('_startTime'),
    };
    removeSensitiveData(logMessage);

    console.log(`WW-SERVER-JSON:${JSON.stringify(truncateData(logMessage))}`);
};

// Hono caches the body, so re-reading after the route is safe. It throws when the route consumed c.req.raw directly (e.g. better-auth).
async function getRequestBody(c: Context<Env>) {
    const type = c.req.header('content-type') || '';
    try {
        switch (type.split(';')[0]) {
            case 'application/json':
                return await c.req.json();
            case 'multipart/form-data':
            case 'application/x-www-form-urlencoded':
                return await c.req.parseBody({ all: true });
            default:
                return await c.req.text();
        }
    } catch {
        return null;
    }
}

async function getResponseBody(c: Context<Env>) {
    const type = c.res.headers.get('content-type') || '';
    switch (type.split(';')[0]) {
        case 'application/json':
            try {
                return await c.res.clone().json();
            } catch {
                return null;
            }
        default:
            return await c.res.clone().text();
    }
}
