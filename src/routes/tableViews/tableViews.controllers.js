import { HTTPException } from 'hono/http-exception';
import databaseService from '../../services/database/database.service.ts';
import { getValue } from '../../services/tmp/utils/input.js';
import { throwDbError } from '../../utils/dbError.js';
import { resolveConnectionConfig } from '../../services/connection.service.js';
import wewebService from '../../services/weweb.service.js';
import { applyDebugAuth } from '../../middlewares/auth.middlewares.js';
import { SecurityCheckError } from '../../core/errors.core.js';
import { convertConfig } from '../../utils/configConverter.ts';
import { applyFormulaColumns, prepareFormulaColumns } from '../../services/database/formulaColumns.ts';
import { getFormulaPreviewColumns, getFormulaPreviewRow } from '../../services/database/formulaPreviewRows.ts';
import databaseSchemaService from '../../services/database/schema.service.ts';
import { getTableViewFormulaColumnsConfig } from '../../services/database/tableFormulaColumns.ts';
import { prepareFormulaV2Query } from '../../services/database/formulaV2.ts';
import {
    FormulaExecutionError,
    FormulaQueryPlanningError,
    FormulaUnavailableError,
    throwFormulaExecutionHttpError,
    throwFormulaQueryPlanningHttpError,
    throwFormulaUnavailableHttpError,
    withFormulaExecutionBoundary,
} from '../../services/database/formulaExecutionErrors.ts';
import {
    parseTableViewQuery,
    assertAccessRules,
    executeAccessMiddlewares,
    getAccessMiddlewareResult,
} from '../shared/accessControl.ts';
import TABLE_VIEWS from '../../data/tableViews.json' with { type: 'json' };
import TABLE_FORMULA_COLUMNS from '../../data/tableFormulaColumns.json' with { type: 'json' };
import { collectFormulaWarnings } from '../../services/database/formulaWarnings.ts';
import CONNECTIONS from '../../data/connections.json' with { type: 'json' };
import INTEGRATION_TABLES from '../../data/integrationTables.json' with { type: 'json' };
import WORKFLOWS from '../../data/workflows.json' with { type: 'json' };

export const fetchWWTableView = async c => {
    try {
        const tableViewId = c.req.param('tableViewId');
        if (!tableViewId) throw new HTTPException(400);

        const isTest = c.req.header('ww-editor-test') === 'true';
        const editorEnv = c.req.header('ww-editor-env') || undefined;
        const includeFormulaPreviewRow = c.req.query('formulaPreviewRow') === 'true';
        const options = {
            socketId: c.req.header('ww-socket-id'),
            editorUserId: c.req.header('ww-editor-user-id'),
            wwEditionMode: c.req.query('wwEditionMode') || undefined,
        };
        const result = await wewebService.getTableViewById(tableViewId, options);
        if (!result) throw new HTTPException(404);

        const { tableView, integrationTable, workflows, tableFormulaColumns } = result;
        const query = c.req.query();
        c.set('tableView', tableView); // For logging purposes

        const queryParams = parseTableViewQuery(tableView.parameters || [], query);

        // Editor debug fetches come server-to-server, without the app session cookie: a caller-supplied
        // auth context (same contract as the workflow debug run) makes gated views and session-bound
        // view configs provable. Editor-test only — that path already bypasses assertAccessRules below.
        const debugAuthHeader = isTest ? c.req.header('ww-debug-auth') : undefined;
        if (debugAuthHeader) {
            const debugAuth = JSON.parse(debugAuthHeader);
            if (debugAuth && Object.keys(debugAuth).length) await applyDebugAuth(c, debugAuth);
        }

        const context = {
            env: editorEnv,
            parameters: queryParams,
            auth: {
                user: c.get('user'),
                session: c.get('session'),
                isAuthenticated: !!c.get('user'),
            },
            honoContext: c,
        };

        if (!isTest) {
            const security = tableView.security;
            assertAccessRules(security, context.auth, { detailedErrors: true });
            const middlewareTermination = await executeAccessMiddlewares(security, workflows, context);
            if (middlewareTermination) {
                return getAccessMiddlewareResult(middlewareTermination);
            }
        }

        const { data, metadata, formulaPreviewRow } = await _fetchTableView({
            context,
            config: tableView.config,
            tableFormulaColumns,
            integrationTable,
            connection: integrationTable ? CONNECTIONS[integrationTable.connectionId] : null,
            env: editorEnv,
            includeFormulaPreviewRow,
            isolateFormulaErrors: isTest && editorEnv === 'editor' && includeFormulaPreviewRow,
        });
        return c.json({
            data,
            metadata,
            ...(includeFormulaPreviewRow ? { formulaPreviewRow } : {}),
        });
    } catch (err) {
        if (err instanceof FormulaQueryPlanningError) {
            throwFormulaQueryPlanningHttpError(err, 'editor');
        }
        if (err instanceof FormulaUnavailableError) {
            throwFormulaUnavailableHttpError(err, 'editor');
        }
        if (err instanceof FormulaExecutionError) {
            throwFormulaExecutionHttpError(err, c, 'editor');
        }
        if (err instanceof HTTPException || err instanceof SecurityCheckError) {
            throw err;
        }
        throwDbError(err);
    }
};

export const fetchTableView = async c => {
    try {
        const tableViewId = c.req.param('tableViewId');
        if (!tableViewId) throw new HTTPException(400);

        const tableView = TABLE_VIEWS[tableViewId];
        if (!tableView) throw new HTTPException(404);
        c.set('tableView', tableView); // For logging purposes

        const queryParams = parseTableViewQuery(tableView.parameters || [], c.req.query());

        const context = {
            parameters: queryParams,
            auth: {
                user: c.get('user'),
                session: c.get('session'),
                isAuthenticated: !!c.get('user'),
            },
            honoContext: c,
        };

        assertAccessRules(tableView.security, context.auth);
        const middlewareTermination = await executeAccessMiddlewares(tableView.security, WORKFLOWS, context);
        if (middlewareTermination) {
            return getAccessMiddlewareResult(middlewareTermination);
        }

        const integrationTable = INTEGRATION_TABLES[tableView.tableId];
        if (tableView.tableId && !integrationTable) throw new HTTPException(404);
        const connectionId = integrationTable?.connectionId;
        const connection = CONNECTIONS[connectionId];
        if (connectionId && !connection) throw new HTTPException(404);

        const { data, metadata } = await _fetchTableView({
            context,
            config: tableView.config,
            tableFormulaColumns: TABLE_FORMULA_COLUMNS,
            integrationTable,
            connection,
        });
        return c.json({ data, metadata });
    } catch (err) {
        if (err instanceof FormulaQueryPlanningError) {
            throwFormulaQueryPlanningHttpError(err, 'published');
        }
        if (err instanceof FormulaUnavailableError) {
            throwFormulaUnavailableHttpError(err, 'published');
        }
        if (err instanceof FormulaExecutionError) {
            throwFormulaExecutionHttpError(err, c, 'published');
        }
        if (err instanceof HTTPException) {
            throw err;
        }
        throwDbError(err);
    }
};

async function _fetchTableView({
    context,
    config,
    tableFormulaColumns,
    integrationTable,
    connection,
    env,
    includeFormulaPreviewRow = false,
    isolateFormulaErrors = false,
}) {
    const localConfig = { ...config }; // Avoid mutating original config
    localConfig.limit = context.parameters.limit ?? localConfig.limit;
    localConfig.offset = context.parameters.offset ?? localConfig.offset;
    if (integrationTable) {
        const resolvedConnection = resolveConnectionConfig(connection?.config, { env });
        const result = await global.tableViews[integrationTable.integration](
            resolvedConnection,
            getValue(integrationTable.config, context),
            getValue(localConfig, context)
        );
        return result;
    } else {
        if (!localConfig.table) throw new HTTPException(400, { message: 'Table name is required' });
        localConfig.offset ||= 0;

        const resolvedConfig = {
            ...localConfig,
            filters: getValue(localConfig.filters, context),
            sort: getValue(localConfig.sort, context),
            includes:
                localConfig.includes?.map(inc => ({
                    ...inc,
                    filters: getValue(inc.filters, context),
                    sort: getValue(inc.sort, context),
                })) || [],
        };
        const convertedConfig = convertConfig(resolvedConfig);
        const schema = convertedConfig.schema || 'public';
        const formulaColumnsConfig = getTableViewFormulaColumnsConfig(tableFormulaColumns, {
            schema,
            table: convertedConfig.table,
            includes: convertedConfig.includes,
            columns: convertedConfig.columns,
        });
        const { hasFormulaColumns, materializedColumns, normalizedColumns } = prepareFormulaColumns(
            convertedConfig.columns,
            formulaColumnsConfig,
            {
                schema,
                table: convertedConfig.table,
                includes: convertedConfig.includes,
            }
        );
        const databaseSchema =
            databaseSchemaService.hasFilterValues(convertedConfig.filters) ||
            databaseSchemaService.hasIncludeFilterValues(convertedConfig.includes)
                ? await databaseSchemaService.getDatabaseSchema(env, context)
                : null;
        const formulaV2Query = prepareFormulaV2Query({
            schema,
            table: convertedConfig.table,
            columns: materializedColumns,
            filters: convertedConfig.filters,
            sort: convertedConfig.sort,
            includes: convertedConfig.includes,
            tableFormulaColumns,
            parameters: context.parameters,
            env,
            auth: context.auth,
        });
        const hasFormulaV2 = formulaV2Query.calls.length > 0;
        const formulaWarnings = collectFormulaWarnings(formulaV2Query.calls);

        const selectQuery = databaseService.getSelectQuery({
            schema,
            table: convertedConfig.table,
            columns: formulaV2Query.columns,
            filters: convertedConfig.filters,
            sort: convertedConfig.sort,
            limit: localConfig.limit,
            offset: localConfig.offset,
            includes: convertedConfig.includes,
            format: 'pretty',
            databaseSchema,
            formulaCalls: formulaV2Query.calls,
            formulaInputs: formulaV2Query.inputs,
            isolateFormulaErrors,
        });
        const previewQuery =
            includeFormulaPreviewRow && !hasFormulaColumns && !hasFormulaV2
                ? databaseService.getSelectQuery({
                      schema,
                      table: convertedConfig.table,
                      columns: getFormulaPreviewColumns(convertedConfig.columns),
                      filters: convertedConfig.filters,
                      sort: convertedConfig.sort,
                      limit: 1,
                      offset: localConfig.offset,
                      includes: convertedConfig.includes,
                      format: 'pretty',
                      databaseSchema,
                  })
                : null;
        const countQuery = databaseService.getCountQuery({
            schema,
            table: convertedConfig.table,
            filters: convertedConfig.filters,
            includes: convertedConfig.includes,
            databaseSchema,
            formulaCalls: formulaV2Query.calls,
            formulaInputs: formulaV2Query.inputs,
        });

        const [result, countResult, previewResult] = await withFormulaExecutionBoundary(formulaV2Query.calls, () =>
            Promise.all([
                databaseService.execute({ ...selectQuery, env, ...(isolateFormulaErrors ? { onNotice: formulaWarnings.onNotice } : {}) }),
                databaseService.execute({ ...countQuery, env }),
                previewQuery ? databaseService.execute({ ...previewQuery, env }) : null,
            ])
        );
        const data = hasFormulaColumns
            ? applyFormulaColumns(result, normalizedColumns, context, formulaV2Query.calls)
            : result;
        const nextOffset = localConfig.offset + result.length;

        return {
            data,
            metadata: {
                limit: localConfig.limit,
                offset: localConfig.offset,
                nextOffset: nextOffset >= countResult[0].count ? null : nextOffset,
                total: parseInt(countResult[0].count),
                ...(formulaWarnings.errors.length ? { formulaErrors: formulaWarnings.errors, formulaErrorsTruncated: formulaWarnings.truncated } : {}),
            },
            ...(includeFormulaPreviewRow
                ? {
                      formulaPreviewRow: getFormulaPreviewRow({
                          includeFormulaPreviewRow,
                          hasFormulaColumns: hasFormulaColumns || hasFormulaV2,
                          materializedRows: result,
                          previewRows: previewResult,
                          dataRows: data,
                      }),
                  }
                : {}),
        };
    }
}
