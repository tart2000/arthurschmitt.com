import { escapeIdentifier } from 'pg';

export type QueryFormat = 'pretty' | 'min';

const INDENT_SIZE = 4;

type FormatOption = {
    format?: QueryFormat;
};

export type DatabaseColumnSchema = {
    type?: string;
};

export type DatabaseTableSchema = {
    schema?: string;
    name?: string;
    columns?: Record<string, DatabaseColumnSchema>;
};

export type DatabaseSchema = {
    tables?: Record<string, DatabaseTableSchema>;
};

export type IncludeOn = {
    left: string;
    right: string;
};

export type IncludeConfig = {
    schema?: string;
    table: string;
    many?: boolean;
    joinType?: 'left' | 'inner';
    path?: string[];
    alias?: string;
    sqlAlias?: string;
    fromSqlAlias?: string | null;
    index?: number;
    fromAlias?: string | null;
    on?: IncludeOn;
    filters?: Filter;
    sort?: SortOption[];
};

export type SortOption = {
    key?: string;
    field?: string | string[];
    direction?: string;
    alias?: string;
};

export type FilterCondition = {
    field?: string | string[];
    operator: string;
    value?: unknown;
    isEmptyIgnored?: boolean;
    alias?: string;
};

export type FilterGroup = {
    if?: boolean;
    link: '$and' | '$or';
    conditions: Array<FilterCondition | FilterGroup>;
};

export type Filter = FilterCondition | FilterGroup;

export type ColumnModeArray = {
    $mode: 'array';
    field: string;
};

export type ColumnModeAll = {
    '*'?: true;
};

export type AliasedColumn = {
    $alias: string;
    $value: ColumnNode;
};

export type ColumnNode = true | ColumnModeArray | ColumnMap | '*' | AliasedColumn;

export type ColumnMap = ColumnModeAll & {
    [key: string]: ColumnNode;
};

export type SelectColumns = '*' | ColumnMap;

export type SelectQueryOptions = FormatOption & {
    schema?: string;
    table: string;
    columns?: SelectColumns;
    filters?: Filter;
    sort?: SortOption[];
    limit?: number | string;
    offset?: number | string;
    includes?: IncludeConfig[];
    databaseSchema?: DatabaseSchema | null;
};

export type CountQueryOptions = FormatOption & {
    schema?: string;
    table: string;
    filters?: Filter;
    includes?: IncludeConfig[];
    databaseSchema?: DatabaseSchema | null;
};

export type InsertQueryOptions = FormatOption & {
    schema?: string;
    table: string;
    data: Record<string, unknown> | Array<Record<string, unknown>>;
    upsert?: boolean;
    returnData?: boolean;
    primaryColumn?: string;
    databaseSchema?: DatabaseSchema | null;
};

export type UpdateQueryOptions = FormatOption & {
    schema?: string;
    table: string;
    data: Record<string, unknown>;
    filters?: Filter;
    returnData?: boolean;
    databaseSchema?: DatabaseSchema | null;
};

export type DeleteQueryOptions = FormatOption & {
    schema?: string;
    table: string;
    filters?: Filter;
    returnData?: boolean;
    databaseSchema?: DatabaseSchema | null;
};

export type QueryResult = {
    query: string;
    params: unknown[];
};

type IncludeSelection = { mode: 'filter' } | { mode: 'array'; field: string } | { mode: 'object'; columns?: string[] };

type JoinClauseOptions = {
    skipMany?: boolean;
    requiredAliases?: Set<string>;
    includeMap?: Map<string, IncludeConfig>;
    nested?: boolean;
    startParamIndex?: number;
    databaseSchema?: DatabaseSchema | null;
};

type JoinClauseResult = {
    clause: string | null;
    params: unknown[];
};

type TableReference = {
    schema?: string;
    table?: string;
};

type WhereClauseSchemaContext = {
    databaseSchema?: DatabaseSchema | null;
    defaultTable?: TableReference;
    includeMap?: Map<string, IncludeConfig>;
};

const TYPE_CASTS: Record<string, string> = {
    bigint: 'bigint',
    bigserial: 'bigint',
    boolean: 'boolean',
    bool: 'boolean',
    date: 'date',
    'double precision': 'double precision',
    integer: 'integer',
    int: 'integer',
    int2: 'smallint',
    int4: 'integer',
    int8: 'bigint',
    json: 'json',
    jsonb: 'jsonb',
    numeric: 'numeric',
    real: 'real',
    serial: 'integer',
    smallint: 'smallint',
    text: 'text',
    time: 'time',
    'time without time zone': 'time without time zone',
    'time with time zone': 'time with time zone',
    timestamp: 'timestamp',
    'timestamp without time zone': 'timestamp without time zone',
    'timestamp with time zone': 'timestamp with time zone',
    timestamptz: 'timestamp with time zone',
    uuid: 'uuid',
    varchar: 'text',
    'character varying': 'text',
};

function normalizeFieldPath(field?: string | string[]): string[] {
    if (field === undefined) return [];
    return Array.isArray(field) ? field : [field];
}

function normalizeIncludes(includes: IncludeConfig[]): IncludeConfig[] {
    const aliasToSqlAlias = new Map<string, string>();

    const normalized = includes.map((include, index) => {
        if (!Array.isArray(include.path) || include.path.length === 0) {
            if (!include.alias) {
                throw new Error('Include must have alias or path');
            }
            const sqlAlias = include.sqlAlias || `_i${index}`;
            aliasToSqlAlias.set(include.alias, sqlAlias);
            return { ...include, sqlAlias };
        }
        const alias = include.alias || include.path.join('.');
        const fromAlias = include.fromAlias ?? (include.path.length > 1 ? include.path.slice(0, -1).join('.') : null);
        const sqlAlias = `_i${index}`;
        aliasToSqlAlias.set(alias, sqlAlias);
        return { ...include, alias, fromAlias, sqlAlias };
    });

    return normalized.map(include => {
        const fromSqlAlias = include.fromAlias ? (aliasToSqlAlias.get(include.fromAlias) ?? null) : null;
        return { ...include, fromSqlAlias };
    });
}

function getTableSchema(databaseSchema: DatabaseSchema | null | undefined, schema = 'public', table?: string) {
    if (!databaseSchema?.tables || !table) return null;

    return databaseSchema.tables[`${schema}.${table}`] ?? (schema === 'public' ? databaseSchema.tables[table] : null) ?? null;
}

function getColumnType(
    databaseSchema: DatabaseSchema | null | undefined,
    schema = 'public',
    table: string | undefined,
    column: string
) {
    return getTableSchema(databaseSchema, schema, table)?.columns?.[column]?.type;
}

function normalizeColumnType(columnType?: string) {
    return typeof columnType === 'string' ? columnType.trim().toLowerCase().replace(/\s+/g, ' ') : '';
}

function isJsonColumnType(columnType?: string) {
    const normalized = normalizeColumnType(columnType);
    return normalized === 'json' || normalized === 'jsonb';
}

function getColumnTypeCast(columnType?: string) {
    const normalized = normalizeColumnType(columnType);
    if (!normalized) return null;

    if (normalized.endsWith('[]')) {
        const baseType = normalized.slice(0, -2);
        const baseCast = TYPE_CASTS[baseType];
        return baseCast ? `${baseCast}[]` : null;
    }

    return TYPE_CASTS[normalized] || null;
}

function getArrayItemTypeCast(columnType?: string) {
    const normalized = normalizeColumnType(columnType);
    if (!normalized.endsWith('[]')) return null;

    const baseType = normalized.slice(0, -2);
    return TYPE_CASTS[baseType] || null;
}

function formatParameterPlaceholder(index: number, columnType?: string) {
    const cast = getColumnTypeCast(columnType);
    return cast ? `$${index}::${cast}` : `$${index}`;
}

function formatArrayItemPlaceholder(index: number, columnType?: string) {
    const cast = getArrayItemTypeCast(columnType);
    return cast ? `$${index}::${cast}` : `$${index}`;
}

function prepareColumnValue(value: unknown, columnType?: string) {
    if (value === null || value === undefined) return value;
    if (isJsonColumnType(columnType) && typeof value === 'object') return JSON.stringify(value);
    return value;
}

function pushTypedParam(params: unknown[], value: unknown, columnType?: string) {
    params.push(prepareColumnValue(value, columnType));
    return formatParameterPlaceholder(params.length, columnType);
}

function resolveConditionColumnType(field: string, alias: string | undefined, schemaContext?: WhereClauseSchemaContext) {
    if (!schemaContext?.databaseSchema) return undefined;

    const tableRef = alias ? schemaContext.includeMap?.get(alias) : schemaContext.defaultTable;
    if (!tableRef?.table) return undefined;

    return getColumnType(schemaContext.databaseSchema, tableRef.schema || 'public', tableRef.table, field);
}

export function getSelectQuery({
    schema = 'public',
    table,
    columns = '*',
    filters,
    sort = [],
    limit,
    offset,
    includes = [],
    format = 'min',
    databaseSchema = null,
}: SelectQueryOptions): QueryResult {
    const isPretty = format === 'pretty';
    const params: unknown[] = [];
    const normalizedIncludes = normalizeIncludes(includes);
    const includeMap = buildIncludeMap(normalizedIncludes);
    const allColumns: string[] = [];
    const sourceTable = `${escapeIdentifier(schema)}.${escapeIdentifier(table)}`;

    if (!columns || columns === '*') {
        allColumns.push('srcTable.*');
    } else {
        if (hasAllColumns(columns)) {
            allColumns.push('srcTable.*');
        }
        for (const [key, value] of Object.entries(columns)) {
            if (shouldSkipColumnKey(key)) continue;
            const { alias, actualValue } = extractAliasAndValue(value);
            const outputKey = alias || key;

            if (actualValue === true) {
                if (alias) {
                    allColumns.push(`srcTable.${escapeIdentifier(key)} as ${escapeIdentifier(outputKey)}`);
                } else {
                    allColumns.push(`srcTable.${escapeIdentifier(key)}`);
                }
                continue;
            }
            const expression = buildRelationExpression([key], actualValue, includeMap, isPretty);
            allColumns.push(`${expression} as ${escapeIdentifier(outputKey)}`);
        }
    }

    if (allColumns.length === 0) {
        allColumns.push('srcTable.*');
    }

    const lines: string[] = [];
    lines.push(formatClause('SELECT', allColumns, isPretty));
    lines.push(`FROM ${sourceTable} as srcTable`);

    const requiredAliases = collectRequiredAliases(filters, sort, normalizedIncludes, columns);
    let currentParamIndex = 1;
    for (const include of normalizedIncludes) {
        const { clause: joinClause, params: joinParams } = buildJoinClause(include, columns, isPretty, {
            requiredAliases,
            includeMap,
            startParamIndex: currentParamIndex,
            databaseSchema,
        });
        if (joinClause) {
            lines.push(joinClause);
            params.push(...joinParams);
            currentParamIndex += joinParams.length;
        }
    }

    if (filters) {
        const { whereClause, params: whereParams } = buildWhereClauseWithIncludeMap(
            filters,
            currentParamIndex,
            includeMap,
            'srcTable',
            {
                databaseSchema,
                defaultTable: { schema, table },
                includeMap,
            }
        );
        if (whereClause) {
            lines.push(whereClause);
            params.push(...whereParams);
        }
    }

    if (sort && sort.length > 0) {
        const orderByClauses: string[] = [];
        for (const option of sort) {
            let { key, alias } = option;
            const fieldPath = normalizeFieldPath(option.field);
            if (fieldPath.length > 0) {
                key = fieldPath[fieldPath.length - 1];
                if (fieldPath.length > 1) {
                    alias = fieldPath.slice(0, -1).join('.');
                }
            }
            if (!key) continue;
            const order = option.direction ? option.direction.toUpperCase() : 'ASC';
            if (order !== 'ASC' && order !== 'DESC') throw new Error(`Invalid sort order: ${order}`);
            let tableName = 'srcTable';
            if (alias) {
                const inc = includeMap.get(alias);
                tableName = inc?.sqlAlias ? escapeIdentifier(inc.sqlAlias) : escapeIdentifier(alias);
            }
            orderByClauses.push(`${tableName}.${escapeIdentifier(key)} ${order}`);
        }
        lines.push(formatClause('ORDER BY', orderByClauses, isPretty));
    }

    if (limit !== undefined) {
        const limitNum = typeof limit === 'number' ? limit : Number.parseInt(String(limit), 10);
        if (!Number.isNaN(limitNum) && limitNum > 0) {
            lines.push(`LIMIT $${params.length + 1}`);
            params.push(limitNum);
        }
    }

    if (offset !== undefined) {
        const offsetNum = typeof offset === 'number' ? offset : Number.parseInt(String(offset), 10);
        if (!Number.isNaN(offsetNum) && offsetNum >= 0) {
            lines.push(`OFFSET $${params.length + 1}`);
            params.push(offsetNum);
        }
    }

    return { query: joinLines(lines, isPretty), params };
}

export function getCountQuery({
    schema = 'public',
    table,
    filters,
    includes = [],
    format = 'min',
    databaseSchema = null,
}: CountQueryOptions): QueryResult {
    const isPretty = format === 'pretty';
    const lines: string[] = [];
    const params: unknown[] = [];
    const normalizedIncludes = normalizeIncludes(includes);

    lines.push(formatClause('SELECT', ['COUNT(*)'], isPretty));
    lines.push(`FROM ${escapeIdentifier(schema)}.${escapeIdentifier(table)} as srcTable`);

    const requiredAliases = collectRequiredAliases(filters, undefined, normalizedIncludes, undefined);
    const includeMap = buildIncludeMap(normalizedIncludes);
    let currentParamIndex = 1;
    for (const include of normalizedIncludes) {
        const { clause: joinClause, params: joinParams } = buildJoinClause(include, undefined, isPretty, {
            skipMany: true,
            requiredAliases,
            includeMap,
            startParamIndex: currentParamIndex,
            databaseSchema,
        });
        if (joinClause) {
            lines.push(joinClause);
            params.push(...joinParams);
            currentParamIndex += joinParams.length;
        }
    }

    if (filters) {
        const { whereClause, params: whereParams } = buildWhereClauseWithIncludeMap(
            filters,
            currentParamIndex,
            includeMap,
            'srcTable',
            {
                databaseSchema,
                defaultTable: { schema, table },
                includeMap,
            }
        );
        if (whereClause) {
            lines.push(whereClause);
            params.push(...whereParams);
        }
    }
    return { query: joinLines(lines, isPretty), params };
}

export function getInsertQuery({
    schema = 'public',
    table,
    data,
    upsert = false,
    returnData = false,
    format = 'min',
    primaryColumn = 'id',
    databaseSchema = null,
}: InsertQueryOptions): QueryResult {
    const isPretty = format === 'pretty';
    const lines: string[] = [];
    let params: unknown[] = [];
    let columns: string[] = [];

    if (!Array.isArray(data)) {
        columns = Object.keys(data);

        if (columns.length === 0) {
            lines.push(`INSERT INTO ${escapeIdentifier(schema)}.${escapeIdentifier(table)} DEFAULT VALUES`);
        } else {
            const placeholders: string[] = [];
            for (const col of columns) {
                const columnType = getColumnType(databaseSchema, schema, table, col);
                placeholders.push(pushTypedParam(params, data[col], columnType));
            }
            const columnsList = columns.map(col => escapeIdentifier(col)).join(', ');
            lines.push(`INSERT INTO ${escapeIdentifier(schema)}.${escapeIdentifier(table)} (${columnsList})`);
            lines.push(formatClause('VALUES', [`(${placeholders.join(', ')})`], isPretty));
        }
    } else {
        if (data.length === 0) throw new Error('Data array cannot be empty');

        columns = Object.keys(data[0]);
        const valueGroups: string[] = [];

        for (const row of data) {
            const rowValues: string[] = [];
            for (const col of columns) {
                const columnType = getColumnType(databaseSchema, schema, table, col);
                const value = row[col];
                rowValues.push(pushTypedParam(params, value, columnType));
            }
            valueGroups.push(`(${rowValues.join(', ')})`);
        }

        const columnsList = columns.map(col => escapeIdentifier(col)).join(', ');
        lines.push(`INSERT INTO ${escapeIdentifier(schema)}.${escapeIdentifier(table)} as srcTable (${columnsList})`);
        lines.push(formatClause('VALUES', valueGroups, isPretty));
    }

    if (upsert) {
        const updateColumns = columns.filter(col => col !== primaryColumn);
        if (updateColumns.length > 0) {
            const setClause = updateColumns
                .map(col => `${escapeIdentifier(col)} = EXCLUDED.${escapeIdentifier(col)}`)
                .join(', ');
            lines.push(`ON CONFLICT (${primaryColumn}) DO UPDATE SET ${setClause}`);
        }
    }

    if (returnData) {
        lines.push('RETURNING *');
    }

    return { query: joinLines(lines, isPretty), params };
}

export function getUpdateQuery({
    schema = 'public',
    table,
    data,
    filters,
    returnData = false,
    format = 'min',
    databaseSchema = null,
}: UpdateQueryOptions): QueryResult {
    const isPretty = format === 'pretty';
    const columns = Object.keys(data);
    const params: unknown[] = [];
    const setEntries: string[] = [];

    for (let index = 0; index < columns.length; index += 1) {
        const col = columns[index];
        const columnType = getColumnType(databaseSchema, schema, table, col);
        const placeholder = pushTypedParam(params, data[col], columnType);
        setEntries.push(`${escapeIdentifier(col)} = ${placeholder}`);
    }

    const lines: string[] = [];
    lines.push(`UPDATE ${escapeIdentifier(schema)}.${escapeIdentifier(table)} as srcTable`);
    lines.push(formatClause('SET', setEntries, isPretty));

    if (filters) {
        const { whereClause, params: whereParams } = buildWhereClause(filters, params.length + 1, 'srcTable', {
            databaseSchema,
            defaultTable: { schema, table },
        });
        if (whereClause) {
            lines.push(whereClause);
            params.push(...whereParams);
        }
    }

    if (returnData) {
        lines.push('RETURNING *');
    }

    return { query: joinLines(lines, isPretty), params };
}

export function getDeleteQuery({
    schema = 'public',
    table,
    filters,
    returnData = false,
    format = 'min',
    databaseSchema = null,
}: DeleteQueryOptions): QueryResult {
    const isPretty = format === 'pretty';
    const lines: string[] = [];
    const params: unknown[] = [];

    lines.push(`DELETE FROM ${escapeIdentifier(schema)}.${escapeIdentifier(table)} as srcTable`);

    if (filters) {
        const { whereClause, params: whereParams } = buildWhereClause(filters, 1, 'srcTable', {
            databaseSchema,
            defaultTable: { schema, table },
        });
        if (whereClause) {
            lines.push(whereClause);
            params.push(...whereParams);
        }
    }

    if (returnData) {
        lines.push('RETURNING *');
    }

    return { query: joinLines(lines, isPretty), params };
}

export function buildWhereClause(
    filter: Filter,
    startParamIndex = 1,
    defaultAlias = 'srcTable',
    schemaContext?: WhereClauseSchemaContext
) {
    return buildWhereClauseWithIncludeMap(filter, startParamIndex, undefined, defaultAlias, schemaContext);
}

export function buildWhereClauseWithIncludeMap(
    filter: Filter,
    startParamIndex = 1,
    includeMap?: Map<string, IncludeConfig>,
    defaultAlias = 'srcTable',
    schemaContext?: WhereClauseSchemaContext
) {
    if (!filter) return { whereClause: '', params: [] as unknown[] };

    const params: unknown[] = [];
    let paramIndex = startParamIndex;

    function pushConditionParam(value: unknown, columnType?: string) {
        params.push(prepareColumnValue(value, columnType));
        return formatParameterPlaceholder(paramIndex++, columnType);
    }

    function resolveSqlAlias(alias: string | undefined): string {
        if (!alias) return defaultAlias;
        if (!includeMap) return escapeIdentifier(alias);
        const inc = includeMap.get(alias);
        return inc?.sqlAlias ? escapeIdentifier(inc.sqlAlias) : escapeIdentifier(alias);
    }

    function processCondition(condition: FilterCondition & { sqlAlias?: string }) {
        const { operator, value, isEmptyIgnored, sqlAlias } = condition;
        let { alias } = condition;

        const fieldPath = normalizeFieldPath(condition.field);
        if (fieldPath.length === 0 || !operator) {
            throw new Error('Filter condition must have field and operator');
        }

        let field: string = fieldPath[fieldPath.length - 1];
        if (fieldPath.length > 1) {
            alias = fieldPath.slice(0, -1).join('.');
        }

        if (isEmptyIgnored && !operator.includes(':null')) {
            const isValueEmpty =
                value === null ||
                value === undefined ||
                value === '' ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === 'object' && value !== null && Object.keys(value).length === 0);

            if (isValueEmpty) {
                return null;
            }
        }

        const table = sqlAlias || resolveSqlAlias(alias);
        const columnType = resolveConditionColumnType(field, alias, {
            ...schemaContext,
            includeMap: schemaContext?.includeMap || includeMap,
        });
        field = `${table}.${escapeIdentifier(field)}`;
        if (operator.includes(':null')) {
            const baseOperator = operator.split(':')[0];
            switch (baseOperator) {
                case '$eq':
                    return `(${field} IS NULL OR ${field}::text = '' OR ${field}::text = '{}' OR ${field}::text = '[]')`;
                case '$ne':
                    return `(${field} IS NOT NULL AND ${field}::text != '' AND ${field}::text != '{}' AND ${field}::text != '[]')`;
                default:
                    throw new Error(`Unsupported null operator: ${operator}`);
            }
        }

        switch (operator) {
            case '$eq':
                return `${field} = ${pushConditionParam(value, columnType)}`;
            case '$ne':
                return `${field} != ${pushConditionParam(value, columnType)}`;
            case '$gt':
                return `${field} > ${pushConditionParam(value, columnType)}`;
            case '$gte':
                return `${field} >= ${pushConditionParam(value, columnType)}`;
            case '$lt':
                return `${field} < ${pushConditionParam(value, columnType)}`;
            case '$lte':
                return `${field} <= ${pushConditionParam(value, columnType)}`;
            case '$like':
                params.push(value);
                return `${field} LIKE $${paramIndex++}`;
            case '$iLike':
                params.push(value);
                return `${field} ILIKE $${paramIndex++}`;
            case '$iLike:contains':
                params.push(`%${value}%`);
                return `${field} ILIKE $${paramIndex++}`;
            case '$iLike:startsWith':
                params.push(`${value}%`);
                return `${field} ILIKE $${paramIndex++}`;
            case '$iLike:endsWith':
                params.push(`%${value}`);
                return `${field} ILIKE $${paramIndex++}`;
            case '$notILike:contains':
                params.push(`%${value}%`);
                return `${field} NOT ILIKE $${paramIndex++}`;
            case '$in':
                if (Array.isArray(value)) {
                    const placeholders = value
                        .map(item => {
                            params.push(prepareColumnValue(item, columnType));
                            return formatParameterPlaceholder(paramIndex++, columnType);
                        })
                        .join(', ');
                    return `${field} IN (${placeholders})`;
                }
                return `${field} = ${pushConditionParam(value, columnType)}`;
            case '$notIn':
                if (Array.isArray(value)) {
                    const placeholders = value
                        .map(item => {
                            params.push(prepareColumnValue(item, columnType));
                            return formatParameterPlaceholder(paramIndex++, columnType);
                        })
                        .join(', ');
                    return `${field} NOT IN (${placeholders})`;
                }
                return `${field} != ${pushConditionParam(value, columnType)}`;
            case '$overlap':
                if (Array.isArray(value)) {
                    const placeholders = value
                        .map(item => {
                            params.push(item);
                            return formatArrayItemPlaceholder(paramIndex++, columnType);
                        })
                        .join(', ');
                    return `${field} && ARRAY[${placeholders}]`;
                }
                throw new Error('Overlap operator requires an array value');
            case '$notOverlap':
                if (Array.isArray(value)) {
                    const placeholders = value
                        .map(item => {
                            params.push(item);
                            return formatArrayItemPlaceholder(paramIndex++, columnType);
                        })
                        .join(', ');
                    return `NOT (${field} && ARRAY[${placeholders}])`;
                }
                throw new Error('Not overlap operator requires an array value');
            case '$contains':
                if (isJsonColumnType(columnType)) {
                    return `${field} @> ${pushConditionParam(value, columnType)}`;
                }
                if (Array.isArray(value)) {
                    const placeholders = value
                        .map(item => {
                            params.push(item);
                            return formatArrayItemPlaceholder(paramIndex++, columnType);
                        })
                        .join(', ');
                    return `${field} @> ARRAY[${placeholders}]`;
                }
                throw new Error('Contains operator requires an array value');
            case '$has':
                params.push(value);
                return `${field} ? $${paramIndex++}`;
            case '$hasNot':
                params.push(value);
                return `NOT (${field} ? $${paramIndex++})`;
            case '$match':
                params.push(value);
                return `${field} ~ $${paramIndex++}`;
            case '$notMatch':
                params.push(value);
                return `NOT (${field} ~ $${paramIndex++})`;
            default:
                throw new Error(`Unsupported filter operator: ${operator}`);
        }
    }

    function processNestedFilter(filterValue: Filter): string | null {
        if ((filterValue as FilterGroup).if === false) {
            return null;
        }

        if ('field' in filterValue && 'operator' in filterValue) {
            return processCondition(filterValue as FilterCondition);
        }

        if ('link' in filterValue && Array.isArray((filterValue as FilterGroup).conditions)) {
            const group = filterValue as FilterGroup;
            if (group.conditions.length === 0) {
                return null;
            }

            const processedConditions = group.conditions
                .map(condition => processNestedFilter(condition))
                .filter(condition => condition !== null);

            if (processedConditions.length === 0) {
                return null;
            }

            if (group.link === '$or') {
                return `(${processedConditions.join(' OR ')})`;
            }
            return `(${processedConditions.join(' AND ')})`;
        }

        throw new Error('Invalid filter structure');
    }

    const whereClause = processNestedFilter(filter);
    return { whereClause: whereClause ? `WHERE ${whereClause}` : '', params };
}

function shouldSkipColumnKey(key: string) {
    return key === '*' || key.startsWith('$');
}

function isColumnModeArray(node: ColumnNode): node is ColumnModeArray {
    return typeof node === 'object' && node !== null && (node as ColumnModeArray).$mode === 'array';
}

function hasAllColumns(node: ColumnNode | SelectColumns | undefined): boolean {
    return typeof node === 'object' && node !== null && Object.hasOwn(node, '*') && (node as ColumnModeAll)['*'] === true;
}

function isAliasedColumn(node: ColumnNode): node is AliasedColumn {
    return typeof node === 'object' && node !== null && '$alias' in node && '$value' in node;
}

function extractAliasAndValue(node: ColumnNode): { alias: string | null; actualValue: ColumnNode } {
    if (isAliasedColumn(node)) {
        return { alias: node.$alias, actualValue: node.$value };
    }
    return { alias: null, actualValue: node };
}

function resolveColumnNode(columns: SelectColumns | undefined, path: string[]): ColumnNode | undefined {
    if (!columns || columns === '*') {
        return undefined;
    }

    let current: ColumnNode = columns;

    for (const segment of path) {
        if (isAliasedColumn(current)) {
            current = current.$value;
        }

        if (current === '*' || current === true || isColumnModeArray(current)) {
            return undefined;
        }

        const map = current as ColumnMap;
        if (!(segment in map)) {
            return undefined;
        }
        current = map[segment];
    }

    if (isAliasedColumn(current)) {
        current = current.$value;
    }

    return current;
}

function resolveIncludeSelection(columns: SelectColumns | undefined, alias: string | undefined): IncludeSelection {
    if (!alias) {
        return { mode: 'filter' };
    }

    const path = alias.split('.').filter(Boolean);
    if (path.length === 0) {
        return { mode: 'filter' };
    }

    const node = resolveColumnNode(columns, path);
    if (!node) {
        return { mode: 'filter' };
    }

    if (node === '*') {
        return { mode: 'object' };
    }

    if (node === true) {
        return { mode: 'filter' };
    }

    if (isColumnModeArray(node)) {
        return { mode: 'array', field: node.field };
    }

    if (hasAllColumns(node)) {
        return { mode: 'object' };
    }

    const entries = Object.entries(node).filter(([key]) => !shouldSkipColumnKey(key));

    if (entries.length === 0) {
        return { mode: 'filter' };
    }

    const columnsList = entries
        .filter(([, value]) => {
            const { actualValue } = extractAliasAndValue(value as ColumnNode);
            return actualValue === true;
        })
        .map(([key]) => key);

    return { mode: 'object', columns: columnsList };
}

function buildIncludeMap(includes: IncludeConfig[]) {
    const map = new Map<string, IncludeConfig>();
    for (const include of includes) {
        if (include.alias) {
            map.set(include.alias, include);
        }
    }
    return map;
}

function collectRequiredAliases(
    filters: Filter | undefined,
    sort: SortOption[] | undefined,
    includes: IncludeConfig[],
    columns: SelectColumns | undefined
) {
    const required = new Set<string>();

    function collectFilterAliases(filterValue: Filter | undefined) {
        if (!filterValue) return;
        if ((filterValue as FilterGroup).if === false) return;
        if ('conditions' in filterValue && Array.isArray(filterValue.conditions)) {
            for (const condition of filterValue.conditions) {
                collectFilterAliases(condition);
            }
            return;
        }
        if ('field' in filterValue) {
            const fieldPath = normalizeFieldPath(filterValue.field);
            if (fieldPath.length > 1) {
                required.add(fieldPath.slice(0, -1).join('.'));
            } else if ('alias' in filterValue && filterValue.alias) {
                required.add(filterValue.alias);
            }
        } else if ('alias' in filterValue && filterValue.alias) {
            required.add(filterValue.alias);
        }
    }

    function collectColumnAliases(node: SelectColumns | ColumnNode | undefined, path: string[] = []) {
        if (!node || node === '*') return;
        if (node === true || isColumnModeArray(node)) return;

        if (isAliasedColumn(node)) {
            collectColumnAliases(node.$value, path);
            return;
        }

        const entries = Object.entries(node as ColumnMap);
        for (const [key, value] of entries) {
            if (shouldSkipColumnKey(key)) continue;
            const { actualValue } = extractAliasAndValue(value);
            if (actualValue === true) continue;

            const nextPath = [...path, key];
            required.add(nextPath.join('.'));

            if (
                actualValue &&
                typeof actualValue === 'object' &&
                !Array.isArray(actualValue) &&
                !isColumnModeArray(actualValue)
            ) {
                collectColumnAliases(actualValue, nextPath);
            }
        }
    }

    collectFilterAliases(filters);
    collectColumnAliases(columns);

    if (Array.isArray(sort)) {
        for (const item of sort) {
            const fieldPath = normalizeFieldPath(item.field);
            if (fieldPath.length > 1) {
                required.add(fieldPath.slice(0, -1).join('.'));
            } else if (item.alias) {
                required.add(item.alias);
            }
        }
    }

    let changed = true;
    while (changed) {
        changed = false;
        for (const include of includes) {
            if (include.alias && required.has(include.alias) && include.fromAlias && !required.has(include.fromAlias)) {
                required.add(include.fromAlias);
                changed = true;
            }
        }
    }

    return required;
}

function buildRelationExpression(
    path: string[],
    node: ColumnNode,
    includeMap: Map<string, IncludeConfig>,
    isPretty: boolean
) {
    const aliasPath = path.join('.');
    const include = includeMap.get(aliasPath);

    if (!include?.on) {
        throw new Error(`Missing include metadata for path: ${aliasPath}`);
    }

    const sqlAlias = include.sqlAlias || aliasPath;
    const escapedSqlAlias = escapeIdentifier(sqlAlias);

    if (include.many) {
        const subSqlAlias = `${sqlAlias}_sub`;
        const defaultValue = isColumnModeArray(node) ? "'{}'" : "'[]'::jsonb";
        return `COALESCE(${escapeIdentifier(subSqlAlias)}.${escapedSqlAlias}, ${defaultValue})`;
    }

    if (isColumnModeArray(node)) {
        return `${escapedSqlAlias}.${escapeIdentifier(node.field)}`;
    }

    const rowExpression = buildObjectExpressionWithSqlAlias(node, sqlAlias, path, includeMap, isPretty);
    const keyRef = `${escapedSqlAlias}.${escapeIdentifier(include.on.right)}`;
    return `CASE WHEN ${keyRef} IS NULL THEN NULL ELSE ${rowExpression} END`;
}

function buildObjectExpressionWithSqlAlias(
    node: ColumnNode,
    sqlAlias: string,
    path: string[],
    includeMap: Map<string, IncludeConfig>,
    isPretty: boolean
) {
    const escapedSqlAlias = escapeIdentifier(sqlAlias);

    if (node === '*' || node === true) {
        return `to_jsonb(${escapedSqlAlias}.*)`;
    }

    if (isColumnModeArray(node)) {
        return `${escapedSqlAlias}.${escapeIdentifier(node.field)}`;
    }

    const includeAllColumns = hasAllColumns(node);
    const entries: string[] = [];
    for (const [key, value] of Object.entries(node)) {
        if (shouldSkipColumnKey(key)) continue;
        const { alias, actualValue } = extractAliasAndValue(value as ColumnNode);
        const outputKey = alias || key;

        if (actualValue === true) {
            entries.push(`'${outputKey}', ${escapedSqlAlias}.${escapeIdentifier(key)}`);
            continue;
        }

        const childPath = [...path, key];
        const childAliasPath = childPath.join('.');
        const childInclude = includeMap.get(childAliasPath);
        const childSqlAlias = childInclude?.sqlAlias || childAliasPath;

        if (childInclude?.many) {
            const subSqlAlias = `${childSqlAlias}_sub`;
            const defaultValue = isColumnModeArray(actualValue) ? "'{}'" : "'[]'::jsonb";
            const childExpression = `COALESCE(${escapeIdentifier(subSqlAlias)}.${escapeIdentifier(childSqlAlias)}, ${defaultValue})`;
            entries.push(`'${outputKey}', ${childExpression}`);
        } else if (isColumnModeArray(actualValue)) {
            entries.push(`'${outputKey}', ${escapeIdentifier(childSqlAlias)}.${escapeIdentifier(actualValue.field)}`);
        } else if (childInclude?.on) {
            const childEscapedSqlAlias = escapeIdentifier(childSqlAlias);
            const rowExpression = buildObjectExpressionWithSqlAlias(
                actualValue,
                childSqlAlias,
                childPath,
                includeMap,
                isPretty
            );
            const keyRef = `${childEscapedSqlAlias}.${escapeIdentifier(childInclude.on.right)}`;
            const childExpression = `CASE WHEN ${keyRef} IS NULL THEN NULL ELSE ${rowExpression} END`;
            entries.push(`'${outputKey}', ${childExpression}`);
        }
    }

    if (entries.length === 0) {
        return `to_jsonb(${escapedSqlAlias}.*)`;
    }

    if (includeAllColumns) {
        return `to_jsonb(${escapedSqlAlias}.*) || ${formatJsonbBuildObject(entries, isPretty)}`;
    }

    return formatJsonbBuildObject(entries, isPretty);
}

function resolveJoinSqlAlias(alias: string, includeMap?: Map<string, IncludeConfig>): string {
    if (!includeMap) return 'srcTable';
    const parentInclude = includeMap.get(alias);
    if (!parentInclude) return 'srcTable';
    const sqlAlias = parentInclude.sqlAlias || alias;
    if (parentInclude.many) {
        return escapeIdentifier(`${sqlAlias}_sub`);
    }
    return escapeIdentifier(sqlAlias);
}

function hasManyAncestor(alias: string | null | undefined, includeMap?: Map<string, IncludeConfig>) {
    if (!alias || !includeMap) return false;
    let current = includeMap.get(alias);
    while (current) {
        if (current.many) return true;
        if (!current.fromAlias) return false;
        current = includeMap.get(current.fromAlias);
    }
    return false;
}

function transformFilterForScopeWithSqlAlias(
    filter: Filter | undefined,
    scopeAlias: string,
    scopeSqlAlias: string,
    includeMap?: Map<string, IncludeConfig>
): Filter | undefined {
    if (!filter) return undefined;

    const transformed = JSON.parse(JSON.stringify(filter)) as Filter;

    function resolveNestedSqlAlias(nestedAlias: string): string {
        if (!includeMap) return escapeIdentifier(nestedAlias);
        const inc = includeMap.get(nestedAlias);
        return inc?.sqlAlias ? escapeIdentifier(inc.sqlAlias) : escapeIdentifier(nestedAlias);
    }

    function transformCondition(condition: FilterCondition) {
        const fieldPath = normalizeFieldPath(condition.field);
        if (fieldPath.length > 1) {
            const relationPath = fieldPath.slice(0, -1);
            const field = fieldPath[fieldPath.length - 1];
            const nestedAlias = scopeAlias + '.' + relationPath.join('.');
            (condition as FilterCondition & { sqlAlias?: string }).sqlAlias = resolveNestedSqlAlias(nestedAlias);
            condition.alias = nestedAlias;
            condition.field = [field];
        } else if (!condition.alias) {
            (condition as FilterCondition & { sqlAlias?: string }).sqlAlias = `${scopeSqlAlias}_row`;
        }
    }

    function transformGroup(group: FilterGroup) {
        for (const cond of group.conditions) {
            if ('link' in cond && Array.isArray((cond as FilterGroup).conditions)) {
                transformGroup(cond as FilterGroup);
            } else {
                transformCondition(cond as FilterCondition);
            }
        }
    }

    if ('link' in transformed && Array.isArray((transformed as FilterGroup).conditions)) {
        transformGroup(transformed as FilterGroup);
    } else if ((transformed as FilterCondition).field) {
        transformCondition(transformed as FilterCondition);
    }

    return transformed;
}

function transformSortForScopeWithSqlAlias(
    sort: SortOption[] | undefined,
    scopeAlias: string,
    scopeSqlAlias: string,
    includeMap?: Map<string, IncludeConfig>
): (SortOption & { sqlAlias?: string })[] | undefined {
    if (!sort || sort.length === 0) return sort;

    function resolveNestedSqlAlias(nestedAlias: string): string {
        if (!includeMap) return escapeIdentifier(nestedAlias);
        const inc = includeMap.get(nestedAlias);
        return inc?.sqlAlias ? escapeIdentifier(inc.sqlAlias) : escapeIdentifier(nestedAlias);
    }

    return sort.map(option => {
        const fieldPath = normalizeFieldPath(option.field);
        if (fieldPath.length > 1) {
            const relationPath = fieldPath.slice(0, -1);
            const field = fieldPath[fieldPath.length - 1];
            const nestedAlias = scopeAlias + '.' + relationPath.join('.');
            return {
                ...option,
                alias: nestedAlias,
                sqlAlias: resolveNestedSqlAlias(nestedAlias),
                field: [field],
            };
        }
        return { ...option, sqlAlias: `${scopeSqlAlias}_row` };
    });
}

function buildAggregateOrderByExpression(
    sort: (SortOption & { sqlAlias?: string })[] | undefined,
    defaultSqlAlias: string,
    includeMap?: Map<string, IncludeConfig>
): string | null {
    if (!sort || sort.length === 0) return null;

    function resolveSqlAlias(alias: string | undefined): string {
        if (!alias) return defaultSqlAlias;
        if (!includeMap) return escapeIdentifier(alias);
        const inc = includeMap.get(alias);
        return inc?.sqlAlias ? escapeIdentifier(inc.sqlAlias) : escapeIdentifier(alias);
    }

    const clauses: string[] = [];
    for (const option of sort) {
        let { key, alias, sqlAlias } = option;
        const fieldPath = normalizeFieldPath(option.field);
        if (fieldPath.length > 0) {
            key = fieldPath[fieldPath.length - 1];
            if (fieldPath.length > 1) {
                alias = fieldPath.slice(0, -1).join('.');
            }
        }
        if (!key) continue;
        const order = option.direction ? option.direction.toUpperCase() : 'ASC';
        if (order !== 'ASC' && order !== 'DESC') continue;
        const tableName = sqlAlias || resolveSqlAlias(alias);
        clauses.push(`${tableName}.${escapeIdentifier(key)} ${order}`);
    }

    if (clauses.length === 0) return null;
    return clauses.join(', ');
}

function buildJoinClauseWithBase(
    include: IncludeConfig,
    columns: SelectColumns | undefined,
    isPretty: boolean,
    options: JoinClauseOptions,
    baseSqlAlias: string
): JoinClauseResult {
    const { schema: includeSchema = 'public', table: includeTable, on } = include;
    const alias = include.alias || `t${(include.index ?? 0) + 1}`;
    const sqlAlias = include.sqlAlias || alias;
    const escapedSqlAlias = escapeIdentifier(sqlAlias);
    const selection = resolveIncludeSelection(columns, alias);
    const isFilterOnly = selection.mode === 'filter';
    const resultParams: unknown[] = [];

    if (!on?.left || !on?.right) return { clause: null, params: [] };
    if (options.skipMany && include.many) return { clause: null, params: [] };
    if (options.requiredAliases && include.alias && !options.requiredAliases.has(include.alias))
        return { clause: null, params: [] };

    const joinType = include.joinType === 'inner' ? 'INNER' : 'LEFT';

    if (include.many) {
        const subSqlAlias = `${sqlAlias}_sub`;
        const escapedSubSqlAlias = escapeIdentifier(subSqlAlias);
        const groupByColumn = escapeIdentifier(on.right);
        const rowSqlAlias = `${sqlAlias}_row`;
        const escapedRowSqlAlias = escapeIdentifier(rowSqlAlias);

        let selectExpression = `${escapedRowSqlAlias}.${groupByColumn}`;

        const transformedSort = transformSortForScopeWithSqlAlias(include.sort, alias, sqlAlias, options.includeMap);
        const orderByExpression = buildAggregateOrderByExpression(
            transformedSort,
            escapedRowSqlAlias,
            options.includeMap
        );
        const orderBySuffix = orderByExpression ? ` ORDER BY ${orderByExpression}` : '';

        if (!isFilterOnly) {
            let aggColumn;
            if (selection.mode === 'array') {
                const field = escapeIdentifier(selection.field);
                aggColumn = `array_agg(${escapedRowSqlAlias}.${field}${orderBySuffix})`;
            } else {
                const includePath = alias.split('.').filter(Boolean);
                const node = resolveColumnNode(columns, includePath) ?? '*';
                const rowExpression = buildObjectExpressionWithSqlAlias(
                    node,
                    rowSqlAlias,
                    includePath,
                    options.includeMap || new Map(),
                    isPretty
                );
                aggColumn = `jsonb_agg(${rowExpression}${orderBySuffix})`;
            }
            selectExpression = `${selectExpression}, ${aggColumn} as ${escapedSqlAlias}`;
        }

        const leftTableMany = baseSqlAlias;
        const leftRefMany = `${leftTableMany}.${escapeIdentifier(on.left)}`;
        const baseTable = `${escapeIdentifier(includeSchema)}.${escapeIdentifier(includeTable)}`;
        const groupedColumn = `${escapedRowSqlAlias}.${groupByColumn}`;

        const nestedIncludes = options.includeMap
            ? Array.from(options.includeMap.values()).filter(child => child.fromAlias === alias)
            : [];

        let currentParamIndex = options.startParamIndex ?? 1;

        const nestedResults = nestedIncludes.map(child =>
            buildJoinClauseWithBase(
                child,
                columns,
                isPretty,
                { ...options, nested: true, startParamIndex: currentParamIndex },
                escapedRowSqlAlias
            )
        );
        const nestedJoinClauses = nestedResults.filter(r => r.clause !== null).map(r => r.clause as string);
        for (const r of nestedResults) {
            resultParams.push(...r.params);
            currentParamIndex += r.params.length;
        }

        let whereClause = '';
        let whereParams: unknown[] = [];
        if (include.filters && 'conditions' in include.filters && include.filters.conditions?.length) {
            const transformedFilters = transformFilterForScopeWithSqlAlias(
                include.filters,
                alias,
                sqlAlias,
                options.includeMap
            );
            const whereResult = buildWhereClauseWithIncludeMap(
                transformedFilters!,
                currentParamIndex,
                options.includeMap,
                escapedRowSqlAlias,
                {
                    databaseSchema: options.databaseSchema,
                    defaultTable: { schema: includeSchema, table: includeTable },
                    includeMap: options.includeMap,
                }
            );
            whereClause = whereResult.whereClause;
            whereParams = whereResult.params;
            resultParams.push(...whereParams);
            currentParamIndex += whereParams.length;
        }

        if (!isPretty) {
            const joinSuffix = nestedJoinClauses.length ? ` ${nestedJoinClauses.join(' ')}` : '';
            const whereSuffix = whereClause ? ` ${whereClause}` : '';
            const clause = `${joinType} JOIN (SELECT ${selectExpression} FROM ${baseTable} as ${escapedRowSqlAlias}${joinSuffix}${whereSuffix} GROUP BY ${groupedColumn}) as ${escapedSubSqlAlias} ON ${leftRefMany} = ${escapedSubSqlAlias}.${groupByColumn}`;
            return { clause, params: resultParams };
        }

        const subqueryLines = [
            `SELECT ${selectExpression}`,
            `FROM ${baseTable} as ${escapedRowSqlAlias}`,
            ...nestedJoinClauses,
        ];
        if (whereClause) {
            subqueryLines.push(whereClause);
        }
        subqueryLines.push(`GROUP BY ${groupedColumn}`);

        const subquery = `(
${indentLines(subqueryLines, INDENT_SIZE)}
)`;
        const clause = `${joinType} JOIN ${subquery} as ${escapedSubSqlAlias} ON ${leftRefMany} = ${escapedSubSqlAlias}.${groupByColumn}`;
        return { clause, params: resultParams };
    }

    const leftTable = baseSqlAlias;
    const leftRef = `${leftTable}.${escapeIdentifier(on.left)}`;
    const baseTable = `${escapeIdentifier(includeSchema)}.${escapeIdentifier(includeTable)}`;

    const joinClause = `${joinType} JOIN ${baseTable} as ${escapedSqlAlias} ON ${leftRef} = ${escapedSqlAlias}.${escapeIdentifier(
        on.right
    )}`;

    if (!options.nested || !options.includeMap) {
        return { clause: joinClause, params: [] };
    }

    const nestedIncludes = Array.from(options.includeMap.values()).filter(child => child.fromAlias === alias);
    if (!nestedIncludes.length) {
        return { clause: joinClause, params: [] };
    }

    let currentParamIndex = options.startParamIndex ?? 1;
    const nestedResults = nestedIncludes.map(child => {
        const result = buildJoinClauseWithBase(
            child,
            columns,
            isPretty,
            { ...options, nested: true, startParamIndex: currentParamIndex },
            resolveJoinSqlAlias(alias, options.includeMap)
        );
        currentParamIndex += result.params.length;
        return result;
    });

    const nestedJoinClauses = nestedResults.filter(r => r.clause !== null).map(r => r.clause as string);
    for (const r of nestedResults) {
        resultParams.push(...r.params);
    }

    if (!nestedJoinClauses.length) {
        return { clause: joinClause, params: resultParams };
    }

    const separator = isPretty ? '\n' : ' ';
    return { clause: `${joinClause}${separator}${nestedJoinClauses.join(separator)}`, params: resultParams };
}

function buildJoinClause(
    include: IncludeConfig,
    columns: SelectColumns | undefined,
    isPretty: boolean,
    options: JoinClauseOptions = {}
): JoinClauseResult {
    if (!include.on?.left || !include.on?.right) return { clause: null, params: [] };
    if (options.skipMany && include.many) return { clause: null, params: [] };
    if (options.requiredAliases && include.alias && !options.requiredAliases.has(include.alias))
        return { clause: null, params: [] };

    if (include.fromAlias && options.includeMap && !options.nested) {
        if (hasManyAncestor(include.fromAlias, options.includeMap)) {
            return { clause: null, params: [] };
        }
    }

    const baseSqlAlias = include.fromSqlAlias
        ? resolveJoinSqlAlias(include.fromAlias!, options.includeMap)
        : 'srcTable';

    return buildJoinClauseWithBase(include, columns, isPretty, options, baseSqlAlias);
}
function formatJsonbBuildObject(entries: string[], isPretty: boolean) {
    if (!isPretty) {
        return `jsonb_build_object(${entries.join(', ')})`;
    }
    return `jsonb_build_object(\n${formatList(entries, true)}\n)`;
}

function formatClause(keyword: string, items: string[], isPretty: boolean) {
    if (items.length === 0) return '';
    if (!isPretty || items.length === 1) {
        return `${keyword} ${items.join(', ')}`;
    }
    return `${keyword}\n${formatList(items, true)}`;
}

function formatList(items: string[], isPretty: boolean, indent = '    ') {
    if (!isPretty) return items.join(', ');
    return items.map(item => formatIndentedLines(item, indent)).join(',\n');
}

function formatIndentedLines(value: string, indent: string) {
    return value
        .split('\n')
        .map(line => `${indent}${line}`)
        .join('\n');
}

function joinLines(lines: string[], isPretty: boolean) {
    return lines.join(isPretty ? '\n' : ' ');
}

function indentLines(lines: string[], indentSize = 4) {
    const indent = ' '.repeat(indentSize);
    return lines.map(line => formatIndentedLines(line, indent)).join('\n');
}
