type LayerQueue = { key: string | number; value: any; targetLayer: any }[];
type StringLike = string | number | bigint;
type ValueAndSize = [any, number];
interface TruncateOptions {
    maxTotalSize?: number;
    maxItemSize?: number;
    nearLimitRatio?: number;
    minInputSize?: number;
}

function getStringSize(item: any) {
    return Buffer.byteLength(String(item), 'utf8');
}

function truncateString(string: StringLike, maxItemSize = 100): ValueAndSize {
    const stringSize = getStringSize(string);
    if (stringSize <= maxItemSize - 5) return [string, stringSize + 2];

    const truncatedString =
        Buffer.from(String(string), 'utf8')
            .subarray(0, maxItemSize - 5)
            .toString('utf8') + '...';

    return [truncatedString, 100];
}

function truncateArray(array: any[], maxEntries = 100): [any[], number] {
    if (array.length <= maxEntries) return [array, array.length - 1];
    return [array.slice(0, maxEntries), maxEntries - 1];
}

function truncateObject(obj: object, maxEntries = 100): [object, number] {
    if (Object.keys(obj).length <= maxEntries) return [obj, Object.keys(obj).length - 1];
    return [Object.fromEntries(Object.entries(obj).slice(0, maxEntries)), maxEntries - 1];
}

function hardTruncate(item: any): ValueAndSize {
    if (item === null) return [item, 6];
    if (['boolean', 'undefined'].includes(typeof item)) return [item, getStringSize(item) + 2];
    if (['string', 'number', 'bigint'].includes(typeof item)) return ['...', 5];

    const hardTruncateValue = `[${typeof item} TRUNCATED]`;
    const truncatedSize = getStringSize(hardTruncateValue) + 2;

    return [hardTruncateValue, truncatedSize];
}

export function truncateItem(item: any, maxItemSize = 100): ValueAndSize {
    if (item === null) return [item, 6];
    if (['boolean', 'undefined'].includes(typeof item)) return [item, getStringSize(item) + 2];
    if (['string', 'number', 'bigint'].includes(typeof item)) return truncateString(item, maxItemSize);
    if (Array.isArray(item)) return truncateArray(item);

    return truncateObject(item);
}

function safeStringify(item: any): string {
    const seen = new WeakSet();

    return JSON.stringify(
        item,
        (_key, val) => {
            if (typeof val === 'bigint') return val.toString();

            if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
            }

            return val;
        },
        0
    );
}

export function truncateDataRecursive(input: any, maxItemSize: number, seen = new WeakSet()): any {
    if (input === null || input === undefined) return input;
    if (typeof input !== 'object') return truncateItem(input, maxItemSize)[0];
    if (seen.has(input)) return '[Circular]';
    seen.add(input);

    if (Array.isArray(input)) {
        const [array] = truncateArray(input, maxItemSize);
        return array.map(item => truncateDataRecursive(item, maxItemSize, seen));
    }

    const [object] = truncateObject(input, maxItemSize);
    return Object.fromEntries(
        Object.entries(object).map(([key, value]) => [key, truncateDataRecursive(value, maxItemSize, seen)])
    );
}

export function truncateData(input: any, options: TruncateOptions = {}) {
    const { maxTotalSize = 100 * 1024, maxItemSize = 100, nearLimitRatio = 0.9, minInputSize = 10 * 1024 } = options;
    if (getStringSize(safeStringify(input)) <= minInputSize) return input;
    if (typeof input !== 'object' || input === null) return truncateItem(input)[0];

    const queue: LayerQueue = [];
    const addToQueue = (item: Record<string, any> | [], targetLayer: any, hardTruncate = false) => {
        let maxEntries = maxItemSize;
        if (hardTruncate) maxEntries = 3;
        if (Array.isArray(item)) {
            item.slice(0, maxEntries).forEach((value, key) => queue.push({ key, value, targetLayer }));
        } else {
            Object.keys(item)
                .slice(0, maxEntries)
                .forEach(key => queue.push({ key, value: item[key], targetLayer }));
        }
    };
    let currentSize = 2;
    let truncatedOutput: any[] | object;
    if (Array.isArray(input)) {
        truncatedOutput = [];
        currentSize += input.length - 1;
    } else {
        truncatedOutput = {};
        currentSize += Object.keys(input).length - 1;
    }
    addToQueue(input, truncatedOutput);
    let itemCount = 0;
    while (queue.length > 0) {
        itemCount += 1;
        const { key, value, targetLayer } = queue.shift();
        currentSize += getStringSize(key) + 3;

        if (currentSize >= maxTotalSize * nearLimitRatio || itemCount > 1000) {
            const [truncatedValue, truncatedSize] = hardTruncate(value);
            targetLayer[key] = truncatedValue;
            currentSize += truncatedSize;
            continue;
        }

        if (typeof value === 'object' && value !== null) {
            targetLayer[key] = Array.isArray(value) ? [] : {};
            addToQueue(value, targetLayer[key], currentSize >= maxTotalSize * nearLimitRatio);
            continue;
        }

        const [truncatedValue, truncatedSize] = truncateItem(value, maxItemSize);
        targetLayer[key] = truncatedValue;
        currentSize += truncatedSize;
    }

    return truncatedOutput;
}

export function removeSensitiveData(data) {
    try {
        delete data.data?.request?.headers?.host;
    } catch (e) {
        console.log(e);
    }
}
