import { Hono } from 'hono';
import { ensureWWAuth } from '../../middlewares/weweb.middlewares.js';
import { sessionMiddleware } from '../../middlewares/auth.middlewares.js';
import { executeWorkflow, executeEditorWorkflow, executeDebugWorkflow } from './workflows.controllers.js';
import workflows from '../../data/workflows.json' with { type: 'json' };

const app = new Hono();

app.use('*', sessionMiddleware);

if (process.env.ENV === 'editor') {
    app.post('/debug/run', ensureWWAuth, executeDebugWorkflow);
    app.all('*', ensureWWAuth, executeEditorWorkflow);
} else {
    for (const workflow of workflows.filter(workflow => workflow.trigger === 'ww-api')) {
        app.on(
            workflow.meta?.method || 'POST',
            workflow.meta?.path || `/ww/workflows/${workflow.id}`,
            (c, next) => {
                c.set('workflow', workflow);
                return next();
            },
            executeWorkflow
        );
    }
}

export default app;
