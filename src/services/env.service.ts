import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

export type RuntimeEnv = 'current' | 'editor' | 'staging' | 'production';
type ParsedRuntimeEnv = Exclude<RuntimeEnv, 'current'>;
type RuntimeEnvValues = Record<string, string | undefined>;
type ParsedRuntimeEnvMap = Record<ParsedRuntimeEnv, RuntimeEnvValues>;

const PARSED_RUNTIME_ENVS: ParsedRuntimeEnv[] = ['editor', 'staging', 'production'];

function parseEnvFile(filePath: string): RuntimeEnvValues {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseEnv(content);
        const values: RuntimeEnvValues = {};
        for (const key in parsed) {
            values[key] = parsed[key];
        }
        return values;
    } catch (_error) {
        return {};
    }
}

export function parseStoredEnvs(): ParsedRuntimeEnvMap {
    const parsedEnvMap: ParsedRuntimeEnvMap = {
        editor: {},
        staging: {},
        production: {},
    };

    for (const env of PARSED_RUNTIME_ENVS) {
        const envFilePath = path.resolve(process.cwd(), `.env.${env}`);
        parsedEnvMap[env] = parseEnvFile(envFilePath);
    }

    return parsedEnvMap;
}

function getEnvValues(env: RuntimeEnv = 'current'): RuntimeEnvValues {
    if (env === 'current') return process.env;
    return parseStoredEnvs()[env];
}

function findEnvValue(values: RuntimeEnvValues, key: string): { found: boolean; value?: string } {
    if (Object.hasOwn(values, key)) return { found: true, value: values[key] };

    const canonicalKey = key.toUpperCase();
    let matchingKey: string | undefined;
    for (const existingKey in values) {
        if (existingKey.toUpperCase() !== canonicalKey) continue;
        if (matchingKey !== undefined) return { found: true };
        matchingKey = existingKey;
    }

    return matchingKey === undefined ? { found: false } : { found: true, value: values[matchingKey] };
}

export function getEnv(key: string, env: RuntimeEnv = 'current'): string | undefined {
    const envValue = findEnvValue(getEnvValues(env), key);
    if (envValue.found || env === 'current') return envValue.value;
    return findEnvValue(process.env, key).value;
}

export default {
    parseStoredEnvs,
    getEnv,
};
