import { HTTPException } from 'hono/http-exception';
import { PublicHTTPException } from '../../core/http.errors.ts';
import databaseService from '../../services/database/database.service.ts';
import databaseSchemaService from '../../services/database/schema.service.ts';
import { getValue } from '../../services/tmp/utils/input.js';
import { throwDbError } from '../../utils/dbError.js';
import { convertConfig } from '../../utils/configConverter.ts';
import {
    applyFormulaColumns,
    getLegacyFormulaColumnsConfig,
    prepareFormulaColumns,
} from '../../services/database/formulaColumns.ts';
import { getFormulaPreviewColumns, getFormulaPreviewRow } from '../../services/database/formulaPreviewRows.ts';
import { getFormulaMutationTargets, prepareFormulaV2Query } from '../../services/database/formulaV2.ts';
import {
    FormulaExecutionError,
    FormulaQueryPlanningError,
    FormulaUnavailableError,
    throwFormulaExecutionHttpError,
    throwFormulaQueryPlanningHttpError,
    throwFormulaUnavailableHttpError,
    withFormulaExecutionBoundary,
} from '../../services/database/formulaExecutionErrors.ts';
import TABLE_FORMULA_COLUMNS from '../../data/tableFormulaColumns.json' with { type: 'json' };
import { collectFormulaWarnings } from '../../services/database/formulaWarnings.ts';

export const queryTableSelect = async c => {
    const env = c.req.param('env');
    try {
        const {
            tableName,
            schema,
            columns,
            filters,
            sort,
            limit = 50,
            offset = 0,
            includes = [],
            formulaColumns,
            formulaV2Columns,
            formulaPreviewRow: includeFormulaPreviewRow = false,
            parameters = {},
        } = await c.req.json();
        if (!tableName) return new HTTPException(400);

        const context = { parameters: parameters || {} };
        const resolvedConfig = {
            table: tableName,
            schema,
            columns,
            filters: getValue(filters, context),
            sort: getValue(sort, context),
            includes,
            limit,
            offset,
        };
        const convertedConfig = convertConfig(resolvedConfig);
        const databaseSchema =
            databaseSchemaService.hasFilterValues(convertedConfig.filters) ||
            databaseSchemaService.hasIncludeFilterValues(convertedConfig.includes)
                ? await databaseSchemaService.getDatabaseSchema(env, c)
                : null;
        const { hasFormulaColumns, materializedColumns, normalizedColumns } = prepareFormulaColumns(
            convertedConfig.columns,
            getLegacyFormulaColumnsConfig(formulaColumns),
            {
                schema: convertedConfig.schema || 'public',
                table: convertedConfig.table,
                includes: convertedConfig.includes,
            }
        );
        const formulaV2Query = prepareFormulaV2Query({
            schema: convertedConfig.schema || 'public',
            table: tableName,
            columns: materializedColumns,
            filters: convertedConfig.filters,
            sort: convertedConfig.sort,
            includes: convertedConfig.includes,
            tableFormulaColumns: env === 'editor' && formulaV2Columns ? formulaV2Columns : TABLE_FORMULA_COLUMNS,
            parameters: context.parameters,
            env,
            auth: {
                user: c.get('user'),
                isAuthenticated: !!c.get('user'),
            },
        });
        const hasFormulaV2 = formulaV2Query.calls.length > 0;
        const isolateFormulaErrors = env === 'editor' && includeFormulaPreviewRow && hasFormulaV2;
        const formulaWarnings = collectFormulaWarnings(formulaV2Query.calls);

        const selectQuery = databaseService.getSelectQuery({
            table: convertedConfig.table,
            schema: convertedConfig.schema,
            columns: formulaV2Query.columns,
            filters: convertedConfig.filters,
            sort: convertedConfig.sort,
            limit: convertedConfig.limit,
            offset: convertedConfig.offset,
            includes: convertedConfig.includes,
            databaseSchema,
            formulaCalls: formulaV2Query.calls,
            formulaInputs: formulaV2Query.inputs,
            isolateFormulaErrors,
        });
        const previewQuery =
            includeFormulaPreviewRow && !hasFormulaColumns && !hasFormulaV2
                ? databaseService.getSelectQuery({
                      table: convertedConfig.table,
                      schema: convertedConfig.schema,
                      columns: getFormulaPreviewColumns(convertedConfig.columns),
                      filters: convertedConfig.filters,
                      sort: convertedConfig.sort,
                      limit: 1,
                      offset: convertedConfig.offset,
                      includes: convertedConfig.includes,
                      databaseSchema,
                  })
                : null;
        const countQuery = databaseService.getCountQuery({
            table: convertedConfig.table,
            schema: convertedConfig.schema,
            filters: convertedConfig.filters,
            includes: convertedConfig.includes,
            databaseSchema,
            formulaCalls: formulaV2Query.calls,
            formulaInputs: formulaV2Query.inputs,
        });

        const [result, countResult, previewResult] = await withFormulaExecutionBoundary(formulaV2Query.calls, () =>
            Promise.all([
                databaseService.execute({
                    ...selectQuery,
                    env,
                    ...(isolateFormulaErrors ? { onNotice: formulaWarnings.onNotice } : {}),
                }),
                databaseService.execute({
                    ...countQuery,
                    env,
                }),
                previewQuery ? databaseService.execute({ ...previewQuery, env }) : null,
            ])
        );
        const data = hasFormulaColumns
            ? applyFormulaColumns(result, normalizedColumns, context, formulaV2Query.calls)
            : result;

        return c.json({
            data,
            metadata: {
                limit: limit,
                offset: offset || 0,
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
        });
    } catch (err) {
        if (err instanceof FormulaQueryPlanningError) {
            throwFormulaQueryPlanningHttpError(err, env === 'editor' ? 'editor' : 'published');
        }
        if (err instanceof FormulaUnavailableError) {
            throwFormulaUnavailableHttpError(err, env === 'editor' ? 'editor' : 'published');
        }
        if (err instanceof FormulaExecutionError) {
            throwFormulaExecutionHttpError(err, c, env === 'editor' ? 'editor' : 'published');
        }
        throwDbError(err);
    }
};

export const queryTableInsert = async c => {
    try {
        const env = c.req.param('env');
        const {
            tableName,
            schema = 'public',
            data,
            upsert = false,
            returnData = false,
            tableFormulaColumns,
        } = await c.req.json();
        if (!tableName || !data) return new HTTPException(400);
        const formulaTargets = getFormulaMutationTargets(
            data,
            env === 'editor' && tableFormulaColumns ? tableFormulaColumns : TABLE_FORMULA_COLUMNS,
            { schema, table: tableName }
        );
        if (formulaTargets.length) {
            throw new PublicHTTPException(400, `Formula columns are read-only: ${formulaTargets.join(', ')}`, {
                code: 'FORMULA_COLUMN_READ_ONLY',
                formulaColumns: formulaTargets,
            });
        }
        const databaseSchema = databaseSchemaService.hasDataValues(data)
            ? await databaseSchemaService.getDatabaseSchema(env, c)
            : null;

        const insertQuery = databaseService.getInsertQuery({
            table: tableName,
            schema,
            data,
            upsert,
            returnData,
            databaseSchema,
        });

        const result = await databaseService.execute({
            query: insertQuery.query,
            params: insertQuery.params,
            env,
        });

        return c.json(result);
    } catch (err) {
        throwDbError(err);
    }
};

export const queryTableUpdate = async c => {
    try {
        const env = c.req.param('env');
        const {
            tableName,
            schema = 'public',
            data,
            filters,
            returnData = false,
            tableFormulaColumns,
        } = await c.req.json();
        if (!tableName || !data || !filters) return new HTTPException(400);
        const formulaTargets = getFormulaMutationTargets(
            data,
            env === 'editor' && tableFormulaColumns ? tableFormulaColumns : TABLE_FORMULA_COLUMNS,
            { schema, table: tableName }
        );
        if (formulaTargets.length) {
            throw new PublicHTTPException(400, `Formula columns are read-only: ${formulaTargets.join(', ')}`, {
                code: 'FORMULA_COLUMN_READ_ONLY',
                formulaColumns: formulaTargets,
            });
        }
        const databaseSchema =
            databaseSchemaService.hasDataValues(data) || databaseSchemaService.hasFilterValues(filters)
                ? await databaseSchemaService.getDatabaseSchema(env, c)
                : null;

        const updateQuery = databaseService.getUpdateQuery({
            table: tableName,
            schema,
            data,
            filters,
            returnData,
            databaseSchema,
        });

        const result = await databaseService.execute({
            query: updateQuery.query,
            params: updateQuery.params,
            env,
        });

        return c.json(result);
    } catch (err) {
        throwDbError(err);
    }
};

export const queryTableDelete = async c => {
    try {
        const env = c.req.param('env');
        const { tableName, filters, returnData = false } = await c.req.json();
        if (!tableName || !filters) return new HTTPException(400);
        const databaseSchema = databaseSchemaService.hasFilterValues(filters)
            ? await databaseSchemaService.getDatabaseSchema(env, c)
            : null;

        const deleteQuery = databaseService.getDeleteQuery({
            table: tableName,
            filters,
            returnData,
            databaseSchema,
        });
        const result = await databaseService.execute({
            query: deleteQuery.query,
            params: deleteQuery.params,
            env,
        });

        return c.json(result);
    } catch (err) {
        throwDbError(err);
    }
};

export const getTables = async c => {
    try {
        const env = c.req.param('env');

        const dbPool = databaseService.getPool(env);
        if (!dbPool) return new HTTPException(400);

        // TODO

        return c.json({});
    } catch (err) {
        throwDbError(err);
    }
};

export const alterTables = async c => {
    try {
        const { tableName } = await c.req.json();
        if (!tableName) return new HTTPException(400);

        const dbPool = databaseService.getPool('editor');
        if (!dbPool) return new HTTPException(400);

        // TODO

        return c.json({});
    } catch (err) {
        throwDbError(err);
    }
};
