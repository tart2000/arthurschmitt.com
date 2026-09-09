import { Pool } from 'pg';
import { getCountQuery, getDeleteQuery, getInsertQuery, getSelectQuery, getUpdateQuery } from './queryBuilder.ts';
import { getEnv } from '../env.service.ts';

type DatabaseEnv = 'current' | 'editor' | 'staging' | 'production' | string | null | undefined;
type ResolvedDatabaseEnv = 'current' | 'staging' | 'production';

type ExecuteOptions = {
    query: string;
    params?: unknown[];
    currentUser?: { id: string } | null;
    env?: DatabaseEnv;
};

const pools: Record<ResolvedDatabaseEnv, Pool | null> = {
    current: null,
    staging: null,
    production: null,
};

const poolsInitialized: Record<ResolvedDatabaseEnv, boolean> = {
    current: false,
    staging: false,
    production: false,
};

function normalizeDatabaseEnv(env?: DatabaseEnv): ResolvedDatabaseEnv {
    if (env === 'staging') return 'staging';
    if (env === 'production') return 'production';
    return 'current';
}

function resolveDatabaseConnectionString(env: ResolvedDatabaseEnv): string | undefined {
    if (env === 'staging') {
        return getEnv('DATABASE_URL', 'staging');
    }
    if (env === 'production') {
        return getEnv('DATABASE_URL', 'production');
    }
    return getEnv('DATABASE_URL', 'current');
}

function getPoolInstance(env: ResolvedDatabaseEnv): Pool | null {
    if (!poolsInitialized[env]) {
        const connectionString = resolveDatabaseConnectionString(env);
        pools[env] = connectionString ? new Pool({ connectionString }) : null;
        poolsInitialized[env] = true;
    }
    return pools[env];
}

const databaseService = {
    get pool() {
        return getPoolInstance('current');
    },
    get stagingPool() {
        return getPoolInstance('staging');
    },
    get productionPool() {
        return getPoolInstance('production');
    },
    getPool: (env?: DatabaseEnv) => {
        return getPoolInstance(normalizeDatabaseEnv(env));
    },
    getSelectQuery,
    getCountQuery,
    getInsertQuery,
    getUpdateQuery,
    getDeleteQuery,

    async execute({ query, params = [], currentUser = null, env = null }: ExecuteOptions) {
        const poolInstance = databaseService.getPool(env);
        if (!poolInstance) {
            throw new Error(`No database pool available for environment: ${env}`);
        }
        let result = null;

        if (currentUser) {
            const client = await poolInstance.connect();
            try {
                await client.query(`SELECT set_config('app.user_id', $1, false)`, [currentUser.id]);
                result = await client.query(query, params);
            } catch (error) {
                throw error;
            } finally {
                await client.query(`RESET app.user_id`).catch(() => {});
                client.release();
            }
        } else {
            result = await poolInstance.query(query, params);
        }

        return result?.rows || [];
    },
};

export default databaseService;
