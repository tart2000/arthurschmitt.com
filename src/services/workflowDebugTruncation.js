const DEBUG_LOG_LIMITS = {
    maxTotalBytes: 900000,
    // computedConfig filter leaves sit at depth 7+; size stays bounded by the byte/array/key limits
    maxDepth: 12,
    maxArrayLength: 50,
    maxObjectKeys: 50,
    maxStringLength: 250,
};
const TRUNCATED_PLACEHOLDER = '[TRUNCATED]';

function buildPath(path, key) {
    if (!path) return key;
    return `${path}.${key}`;
}

function recordTruncation(state, entry) {
    state.truncations.push(entry);
    state.truncated = true;
}

function addBytes(state, bytes) {
    state.totalBytes += bytes;
    if (state.totalBytes >= state.limits.maxTotalBytes) {
        state.limitReached = true;
    }
}

function getStringByteLength(value) {
    return Buffer.byteLength(value, 'utf8');
}

function isBinaryValue(value) {
    if (!value) return false;
    if (Buffer.isBuffer(value)) return true;
    if (value instanceof ArrayBuffer) return true;
    if (ArrayBuffer.isView(value)) return true;
    return false;
}

function isFileLike(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if (typeof value.name === 'string' && typeof value.size === 'number') return true;
    return false;
}

function buildFileLike(value) {
    const fileLike = {
        name: value.name,
        size: value.size,
    };
    if (value.type) fileLike.type = value.type;
    if (value.mime) fileLike.type = value.mime;
    if (value.lastModified) fileLike.lastModified = value.lastModified;
    if (value.lastModifiedDate) fileLike.lastModifiedDate = value.lastModifiedDate;
    if ('data' in value || 'content' in value || 'buffer' in value || 'bytes' in value) {
        fileLike.data = TRUNCATED_PLACEHOLDER;
    }
    return fileLike;
}

function sanitizeValue(value, path, depth, state) {
    if (state.limitReached) {
        recordTruncation(state, { path: path || '$', type: 'maxTotalBytes' });
        return TRUNCATED_PLACEHOLDER;
    }
    if (depth > state.limits.maxDepth) {
        recordTruncation(state, { path: path || '$', type: 'maxDepth', maxDepth: state.limits.maxDepth });
        return TRUNCATED_PLACEHOLDER;
    }

    if (value === null || value === undefined) {
        addBytes(state, 4);
        return value;
    }

    if (typeof value === 'string') {
        if (value.length > state.limits.maxStringLength) {
            recordTruncation(state, {
                path: path || '$',
                type: 'string',
                originalLength: value.length,
                truncatedLength: state.limits.maxStringLength,
            });
            const truncated = `${value.slice(0, state.limits.maxStringLength)}...${TRUNCATED_PLACEHOLDER}`;
            addBytes(state, getStringByteLength(truncated));
            return truncated;
        }
        addBytes(state, getStringByteLength(value));
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        addBytes(state, 8);
        return value;
    }

    if (typeof value === 'bigint') {
        const asString = value.toString();
        addBytes(state, getStringByteLength(asString));
        return asString;
    }

    if (typeof value === 'function' || typeof value === 'symbol') {
        recordTruncation(state, { path: path || '$', type: 'unsupported' });
        addBytes(state, getStringByteLength(TRUNCATED_PLACEHOLDER));
        return TRUNCATED_PLACEHOLDER;
    }

    if (isBinaryValue(value)) {
        const size = value.byteLength || value.length || null;
        recordTruncation(state, { path: path || '$', type: 'binary', size });
        addBytes(state, getStringByteLength(TRUNCATED_PLACEHOLDER));
        return TRUNCATED_PLACEHOLDER;
    }

    if (value instanceof Date) {
        const iso = value.toISOString();
        addBytes(state, getStringByteLength(iso));
        return iso;
    }

    if (Array.isArray(value)) {
        const result = [];
        const maxLength = state.limits.maxArrayLength;
        const kept = Math.min(value.length, maxLength);
        if (value.length > maxLength) {
            recordTruncation(state, { path: path || '$', type: 'array', kept, dropped: value.length - kept });
        }
        for (let i = 0; i < kept; i += 1) {
            if (state.limitReached) break;
            const itemPath = `${path || '$'}[${i}]`;
            result.push(sanitizeValue(value[i], itemPath, depth + 1, state));
        }
        return result;
    }

    if (typeof value === 'object') {
        if (state.visited.has(value)) {
            recordTruncation(state, { path: path || '$', type: 'circular' });
            return TRUNCATED_PLACEHOLDER;
        }
        state.visited.add(value);

        if (isFileLike(value)) {
            const fileLike = buildFileLike(value);
            recordTruncation(state, {
                path: path || '$',
                type: 'file',
                name: fileLike.name,
                size: fileLike.size,
                mime: fileLike.type,
            });
            addBytes(state, getStringByteLength(JSON.stringify(fileLike)));
            return fileLike;
        }

        const keys = Object.keys(value).filter(key => key !== '__metadata');
        const maxKeys = state.limits.maxObjectKeys;
        const keptKeys = keys.slice(0, maxKeys);
        if (keys.length > maxKeys) {
            recordTruncation(state, {
                path: path || '$',
                type: 'object',
                kept: keptKeys.length,
                dropped: keys.length - keptKeys.length,
            });
        }
        const result = {};
        for (const key of keptKeys) {
            if (state.limitReached) break;
            addBytes(state, getStringByteLength(key));
            result[key] = sanitizeValue(value[key], buildPath(path, key), depth + 1, state);
        }
        return result;
    }

    recordTruncation(state, { path: path || '$', type: 'unknown' });
    return TRUNCATED_PLACEHOLDER;
}

export function sanitizeWorkflowDebugResults(value, limits = DEBUG_LOG_LIMITS) {
    const state = {
        limits,
        truncations: [],
        truncated: false,
        totalBytes: 0,
        limitReached: false,
        visited: new WeakSet(),
    };
    const sanitized = sanitizeValue(value, '', 0, state);
    if (!state.truncated) return sanitized;

    const metadata = {
        truncated: true,
        limits: state.limits,
        truncations: state.truncations,
    };

    if (sanitized && typeof sanitized === 'object') {
        if (Array.isArray(sanitized)) {
            return { result: sanitized, __metadata: metadata };
        }
        return { ...sanitized, __metadata: metadata };
    }
    return { result: sanitized, __metadata: metadata };
}

export { DEBUG_LOG_LIMITS, TRUNCATED_PLACEHOLDER };
