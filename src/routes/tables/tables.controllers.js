import { HTTPException } from 'hono/http-exception';
import databaseService from '../../services/database/database.service.ts';
import databaseSchemaService from '../../services/database/schema.service.ts';
import { getValue } from '../../services/tmp/utils/input.js';
import { throwDbError } from '../../utils/dbError.js';
import { convertConfig } from '../../utils/configConverter.ts';
import { applyFormulaColumns, prepareFormulaColumns } from '../../services/database/formulaColumns.ts';
import { getFormulaPreviewColumns, getFormulaPreviewRow } from '../../services/database/formulaPreviewRows.ts';

export const queryTableSelect = async c => {
    try {
        const env = c.req.param('env');
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
            formulaColumns,
            {
                schema: convertedConfig.schema || 'public',
                table: convertedConfig.table,
                includes: convertedConfig.includes,
            }
        );

        const selectQuery = databaseService.getSelectQuery({
            table: convertedConfig.table,
            schema: convertedConfig.schema,
            columns: materializedColumns,
            filters: convertedConfig.filters,
            sort: convertedConfig.sort,
            limit: convertedConfig.limit,
            offset: convertedConfig.offset,
            includes: convertedConfig.includes,
            databaseSchema,
        });
        const previewQuery =
            includeFormulaPreviewRow && !hasFormulaColumns
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
        });

        const [result, countResult, previewResult] = await Promise.all([
            databaseService.execute({
                ...selectQuery,
                env,
            }),
            databaseService.execute({
                ...countQuery,
                env,
            }),
            previewQuery ? databaseService.execute({ ...previewQuery, env }) : null,
        ]);
        const data = hasFormulaColumns ? applyFormulaColumns(result, normalizedColumns, context) : result;

        return c.json({
            data,
            metadata: {
                limit: limit,
                offset: offset || 0,
                total: parseInt(countResult[0].count),
            },
            ...(includeFormulaPreviewRow
                ? {
                      formulaPreviewRow: getFormulaPreviewRow({
                          includeFormulaPreviewRow,
                          hasFormulaColumns,
                          materializedRows: result,
                          previewRows: previewResult,
                          dataRows: data,
                      }),
                  }
                : {}),
        });
    } catch (err) {
        throwDbError(err);
    }
};

export const queryTableInsert = async c => {
    try {
        const env = c.req.param('env');
        const { tableName, data, upsert = false, returnData = false } = await c.req.json();
        if (!tableName || !data) return new HTTPException(400);
        const databaseSchema = databaseSchemaService.hasDataValues(data)
            ? await databaseSchemaService.getDatabaseSchema(env, c)
            : null;

        const insertQuery = databaseService.getInsertQuery({
            table: tableName,
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
        const { tableName, data, filters, returnData = false } = await c.req.json();
        if (!tableName || !data || !filters) return new HTTPException(400);
        const databaseSchema =
            databaseSchemaService.hasDataValues(data) || databaseSchemaService.hasFilterValues(filters)
                ? await databaseSchemaService.getDatabaseSchema(env, c)
                : null;

        const updateQuery = databaseService.getUpdateQuery({
            table: tableName,
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
