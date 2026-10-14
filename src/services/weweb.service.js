import { SecurityCheckError } from '../core/errors.core.js';

import { sanitizeWorkflowDebugResults } from './workflowDebugTruncation.js';
import { truncateData, truncateDataRecursive } from '../utils/truncateData.ts';

const debugQueues = new Map();

function getQueueKey(workflowId, socketId) {
    return `${workflowId}_${socketId || 'default'}`;
}

async function processDebugQueue(workflowId, socketId) {
    const key = getQueueKey(workflowId, socketId);
    const queue = debugQueues.get(key);
    if (!queue || queue.processing || queue.pending.length === 0) return;

    queue.processing = true;

    while (queue.pending.length > 0) {
        const batch = queue.pending.splice(0, queue.pending.length);
        const mergedResults = {};
        for (const item of batch) {
            Object.assign(mergedResults, item.debugResults);
        }

        const sanitizedResults = truncateData(mergedResults);

        try {
            await fetch(`${process.env.WEWEB_BACK_URL}/v2/lambda/back/workflows/${workflowId}/debug`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ww-project-id': process.env.WEWEB_PROJECT_ID,
                    'ww-project-secret': process.env.WEWEB_PROJECT_SECRET,
                },
                body: JSON.stringify({ debugResults: sanitizedResults, socketId }),
            });
            for (const { resolve } of batch) resolve();
        } catch (error) {
            for (const { resolve } of batch) resolve();
        }
    }

    queue.processing = false;
    debugQueues.delete(key);
}

function buildHeaders(options = {}) {
    return {
        'Content-Type': 'application/json',
        'ww-project-id': process.env.WEWEB_PROJECT_ID,
        'ww-project-secret': process.env.WEWEB_PROJECT_SECRET,
        ...(options.socketId && { 'ww-socket-id': options.socketId }),
        ...(options.editorUserId && { 'ww-editor-user-id': options.editorUserId }),
    };
}

export default {
    sanitizeWorkflowDebugResults,
    async getBackWorkflowsByTrigger(trigger, options = {}) {
        if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') return {};
        const response = await fetch(
            `${process.env.WEWEB_BACK_URL}/v2/lambda/back/workflows/triggers?trigger=${trigger}&includeTableFormulaColumns=true`,
            { headers: buildHeaders(options) }
        );
        if (!response.ok) {
            if (response.status === 403) {
                const data = await response.json();
                if (data.error === 'WORKFLOW_SECURITY_CHECK_FAILED') {
                    throw new SecurityCheckError(data);
                }
            }
            throw new Error('Failed to fetch back workflows by trigger');
        }
        return await response.json();
    },
    async ensureDesignAccess(designId, userCookie) {
        console.log('Ensuring design access for designId:', designId, userCookie);
        if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') return {};
        console.log(process.env.WEWEB_BACK_URL);
        const response = await fetch(`${process.env.WEWEB_BACK_URL}/v2/designs/${designId}/ensure`, {
            headers: {
                'Content-Type': 'application/json',
                Cookie: `ww-access-token=${userCookie}`,
            },
        });
        if (!response.ok) throw new Error('Failed to ensure design access');
        return true;
    },
    sendWorkflowDebug(id, debugResults, socketId = null) {
        if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') {
            return Promise.resolve();
        }

        const key = getQueueKey(id, socketId);
        if (!debugQueues.has(key)) {
            debugQueues.set(key, { pending: [], processing: false });
        }
        const queue = debugQueues.get(key);

        return new Promise(resolve => {
            queue.pending.push({ debugResults, resolve });
            processDebugQueue(id, socketId);
        });
    },
    saveWorkflowLog(workflow, context) {
        const hasError = logs => {
            if (!logs || typeof logs !== 'object') return false;
            return Object.values(logs).some(log => log && log.error != null);
        };

        const workflowLog = {
            designId: workflow.designId,
            workflowId: workflow.id,
            logs: truncateDataRecursive(context.workflow || {}),
            traceId: context.traceId,
            context: {
                auth: context.auth,
                parameters: context.parameters,
                connections: Object.values(context.connections || {}).map(connection => {
                    return { id: connection.id, integration: connection.integration };
                }),
                callstack: context.callstack,
            },
            type: (() => {
                switch (workflow.trigger) {
                    case null:
                        return 'reusable';
                    case 'ww-middleware':
                        return 'middleware';
                    case 'ww-api':
                        return 'api';
                    default:
                        return 'workflow';
                }
            })(),
            origin: 'back',
            hasError: hasError(context.workflow),
        };

        const accessToken = context.http?.cookies?.['ww-access-token'];

        fetch(`${process.env.WEWEB_BACK_URL}/v2/designs/${workflowLog.designId}/workflows/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Cookie: `ww-access-token=${accessToken}` }),
            },
            body: JSON.stringify(workflowLog),
        }).catch(() => {});
    },
    async matchWorkflowByPath(method, path, options = {}) {
        if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') return null;
        const response = await fetch(`${process.env.WEWEB_BACK_URL}/v2/lambda/back/workflows/match`, {
            method: 'POST',
            headers: buildHeaders(options),
            body: JSON.stringify({ method, path, includeTableFormulaColumns: true }),
        });
        if (!response.ok) {
            if (response.status === 404) return null;
            if (response.status === 403) {
                const data = await response.json();
                if (data.error === 'WORKFLOW_SECURITY_CHECK_FAILED') {
                    throw new SecurityCheckError(data);
                }
            }
            throw new Error('Failed to match workflow by path');
        }
        return await response.json();
    },
    async getTableViewById(id, options = {}) {
        if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') return null;
        const url = new URL(`${process.env.WEWEB_BACK_URL}/v2/lambda/back/table-views/${id}`);
        if (options.wwEditionMode) {
            url.searchParams.append('wwEditionMode', options.wwEditionMode);
        }
        const response = await fetch(url, {
            headers: buildHeaders(options),
        });
        if (!response.ok) {
            if (response.status === 404) return null;
            if (response.status === 403) {
                const data = await response.json();
                if (
                    data.error === 'WORKFLOW_SECURITY_CHECK_FAILED' ||
                    data.error === 'TABLE_VIEW_SECURITY_CHECK_FAILED'
                ) {
                    throw new SecurityCheckError(data);
                }
            }
            throw new Error('Failed to fetch table view by id');
        }
        return await response.json();
    },
    async getIntegrationTableById(id, options = {}) {
        if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') return null;
        const response = await fetch(`${process.env.WEWEB_BACK_URL}/v2/lambda/back/integration-tables/${id}`, {
            headers: buildHeaders(options),
        });
        if (!response.ok) {
            if (response.status === 404) return null;
            if (response.status === 403) {
                const data = await response.json();
                if (data.error === 'TABLE_VIEW_SECURITY_CHECK_FAILED') {
                    throw new SecurityCheckError(data);
                }
            }
            throw new Error('Failed to fetch integration table by id');
        }
        return await response.json();
    },
    async getDatabaseSchema(env, options = {}) {
        if (process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production') return null;
        const url = new URL(`${process.env.WEWEB_BACK_URL}/v2/lambda/back/database/schema`);
        if (env) {
            url.searchParams.set('env', env);
        }
        const response = await fetch(url, {
            headers: buildHeaders(options),
        });
        if (!response.ok) throw new Error('Failed to fetch database schema');
        return await response.json();
    },
};
