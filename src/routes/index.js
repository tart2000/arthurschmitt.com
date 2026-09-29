import authRoutes from './auth/auth.routes.js';
import workflowsRoutes from './workflows/workflows.routes.js';
import tablesRoutes from './tables/tables.routes.js';
import tableViewsRoutes from './tableViews/tableViews.routes.js';
import storageRoutes from './storage/storage.routes.js';
import integrationTablesRoutes from './integrationTables/integrationTables.routes.js';
import wewebRoutes from './weweb/weweb.routes.js';
import { editor as editorRoutes, app as appRoutes, publicApp as publicRoutes } from '../integrations/registry.ts';

export function registerRoutes(app) {
    if (process.env.ENV === 'editor') {
        app.route('/ww/tables', tablesRoutes);
        app.route('/ww/integrations', editorRoutes);
        app.route('/ww/integration/tables', integrationTablesRoutes);
        app.route('/ww/storage', storageRoutes);
    }
    app.route('/ww', wewebRoutes);
    app.route('/ww/auth', authRoutes);
    app.route('/ww/table-views', tableViewsRoutes);
    app.route('/', publicRoutes);
    app.route('/', appRoutes);
    app.route('/', workflowsRoutes);
}
