import { APIError } from 'better-call';
import connectionService from '../services/connection.service.js';
import wewebService from '../services/weweb.service.js';
import workflowCore from '../core/workflow.core.js';
import workflows from '../data/workflows.json' with { type: 'json' };
import CONNECTIONS from '../data/connections.json' with { type: 'json' };

const isEditor = process.env.ENV === 'editor';

function formatError(err, workflow) {
    if (err instanceof APIError) {
        return err;
    }
    const message = isEditor ? err.message : 'Internal Server Error';
    return new APIError('INTERNAL_SERVER_ERROR', {
        message,
        ...(isEditor && {
            workflow: {
                id: workflow?.id,
                name: workflow?.name,
            },
            name: err.name,
            stack: err.stack,
            cause: err.cause,
            code: err.code,
        }),
    });
}

export default {
    async execute(trigger, event, { socketId = null, editorUserId = null, honoContext = null }) {
        let _workflows = workflows;
        let connections = CONNECTIONS;
        let triggeredWorkflows = workflows.filter(workflow => workflow.trigger === trigger);
        let tableFormulaColumns;

        if (
            process.env.ENV === 'editor' &&
            !(process.env.WEWEB_ENV === 'local' && process.env.NODE_ENV === 'production')
        ) {
            const options = { socketId, editorUserId };
            const result = await wewebService.getBackWorkflowsByTrigger(trigger, options);
            const { workflows, subWorkflows } = result;
            _workflows = subWorkflows;
            triggeredWorkflows = workflows;
            tableFormulaColumns = result.tableFormulaColumns;
        }

        await Promise.all(
            triggeredWorkflows.map(async workflow => {
                try {
                    return await workflowCore.execute(workflow, {
                        workflows: _workflows,
                        connections: connectionService.resolveConnections(connections),
                        auth: {
                            user: honoContext?.get('user'),
                            session: honoContext?.get('session'),
                            isAuthenticated: !!honoContext?.get('user'),
                        },
                        event,
                        socketId,
                        honoContext,
                        tableFormulaColumns,
                    });
                } catch (err) {
                    throw formatError(err, workflow);
                }
            })
        );
    },
};
