// Stripe treats an empty string as "unset this parameter" and rejects it on most params
// (e.g. `starting_after`, `expand[0]`), silently mismatches on filters (`email: ''` → 0
// results) and misreads it on `limit` ('' → 1 result). The editor emits '' / [] / {} / null
// for cleared or unbound fields, so every param map must be compacted before the SDK call.
// Keys listed in `preserveContents` (user key-value maps like `metadata`) are kept as-is —
// an empty-string metadata value is Stripe's documented "delete this key" idiom on update.
export function compactStripeParams<T extends Record<string, any>>(
    params: T,
    { preserveContents = ['metadata'] }: { preserveContents?: string[] } = {}
): T {
    const compacted: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
        const cleaned = preserveContents.includes(key) && isPlainObject(value) ? emptyToUndefined(value) : compactValue(value);
        if (cleaned !== undefined) compacted[key] = cleaned;
    }
    // Keys are only ever removed, so the result still satisfies the call site's param shape.
    return compacted as T;
}

function compactValue(value: unknown): unknown {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) {
        const items = value.map(compactValue).filter(item => item !== undefined);
        return items.length ? items : undefined;
    }
    if (isPlainObject(value)) {
        const entries = Object.entries(value)
            .map(([key, item]) => [key, compactValue(item)])
            .filter(([, item]) => item !== undefined);
        return entries.length ? Object.fromEntries(entries) : undefined;
    }
    return value;
}

function emptyToUndefined(value: Record<string, any>): Record<string, any> | undefined {
    return Object.keys(value).length ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
