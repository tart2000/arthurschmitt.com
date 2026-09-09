import { computed, shallowReactive } from 'vue';
import { defineStore } from 'pinia';

type FormulaBinding = {
    __wwtype: string;
    code: string;
    [key: string]: unknown;
};

export type BackTableFormulaColumn = {
    id: string;
    projectId?: string | null;
    schema?: string | null;
    tableName: string;
    name: string;
    formula: FormulaBinding;
    [key: string]: unknown;
};

function normalizeSchema(schema?: string | null) {
    return schema || 'public';
}

export const useBackTableFormulaColumnsStore = defineStore('backTableFormulaColumns', () => {
    const tableFormulaColumns = shallowReactive<Record<string, BackTableFormulaColumn>>({});

    function add(id: string, tableFormulaColumn: BackTableFormulaColumn, { partialUpdate = false } = {}) {
        if (!id || !tableFormulaColumn) return;

        tableFormulaColumns[id] = {
            ...(partialUpdate ? tableFormulaColumns[id] || {} : tableFormulaColumn),
            ...tableFormulaColumn,
            id,
        };
    }

    function remove(id: string) {
        if (!id) return;
        delete tableFormulaColumns[id];
    }

    function getByTable(tableName?: string | null, schema?: string | null) {
        if (!tableName) return [];
        const normalizedSchema = normalizeSchema(schema);
        return Object.values(tableFormulaColumns).filter(
            column => column.tableName === tableName && normalizeSchema(column.schema) === normalizedSchema
        );
    }

    function getConfigForTable(tableName?: string | null, schema?: string | null) {
        return getByTable(tableName, schema).reduce<Record<string, unknown>>((config, column) => {
            config[column.name] = column.formula;
            return config;
        }, {});
    }

    return {
        tableFormulaColumns,
        data: computed(() => tableFormulaColumns),
        add,
        remove,
        getByTable,
        getConfigForTable,
    };
});
