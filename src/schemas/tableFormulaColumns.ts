import { z } from 'zod';
import { formulaBindingSchema } from './formulas.ts';

const schemaNameSchema = z.string().min(1).catch('public');
const tableFormulaColumnsConfigSchema = z.object({}).catchall(z.unknown());

export const tableFormulaColumnSchema = z
    .object({
        schema: schemaNameSchema,
        tableName: z.string().min(1),
        name: z.string().min(1),
        formula: formulaBindingSchema,
    })
    .catchall(z.unknown());

const tableFormulaColumnsInputSchema = z
    .union([z.array(z.unknown()), tableFormulaColumnsConfigSchema.transform(value => Object.values(value))])
    .catch([]);

export type TableFormulaColumn = z.infer<typeof tableFormulaColumnSchema>;

export const tableFormulaColumnsSchema = tableFormulaColumnsInputSchema.transform((columns): TableFormulaColumn[] => {
    const parsedColumns: TableFormulaColumn[] = [];

    for (const column of columns) {
        const parsedColumn = tableFormulaColumnSchema.safeParse(column);
        if (parsedColumn.success) parsedColumns.push(parsedColumn.data);
    }

    return parsedColumns;
});

export function parseSchema(schema: unknown) {
    return schemaNameSchema.parse(schema);
}

export function parseTableFormulaColumns(tableFormulaColumns: unknown): TableFormulaColumn[] {
    return tableFormulaColumnsSchema.parse(tableFormulaColumns);
}
