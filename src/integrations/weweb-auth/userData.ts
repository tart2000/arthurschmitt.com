import authUsersColumns from '../../data/authUsersColumns.json' with { type: 'json' };

type AuthUserColumn = {
    name?: string;
    isSystem?: boolean;
};

const BASE_USER_WRITABLE_KEYS = new Set(['email', 'name', 'image', 'roles', 'emailVerified']);
const PROTECTED_USER_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'password', 'providers', 'userId', 'fields']);
const AUTH_USER_COLUMNS = authUsersColumns.columns as AuthUserColumn[];

export function getWritableUserColumns(columns: AuthUserColumn[] = AUTH_USER_COLUMNS): Set<string> {
    const writableColumns = new Set(BASE_USER_WRITABLE_KEYS);

    for (const column of columns) {
        if (!column.name) continue;
        if (column.isSystem) continue;
        if (PROTECTED_USER_KEYS.has(column.name)) continue;
        writableColumns.add(column.name);
    }

    return writableColumns;
}

export function pickWritableUserData(
    input: Record<string, unknown> | null | undefined,
    columns: AuthUserColumn[] = AUTH_USER_COLUMNS
) {
    const writableColumns = getWritableUserColumns(columns);
    const data: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input || {})) {
        if (!writableColumns.has(key)) continue;
        if (value === undefined) continue;
        data[key] = value;
    }

    return data;
}
