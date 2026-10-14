import { getEnv } from './env.service.ts';

export function resolveConnections(connections, options = {}) {
    for (const connectionId in connections || {}) {
        connections[connectionId].config = resolveConnectionConfig(connections[connectionId].config, options);
    }
    return connections;
}

export function resolveConnection(connection, options = {}) {
    if (!connection) return null;
    connection.config = resolveConnectionConfig(connection.config, options);
    return connection;
}

export function resolveConnectionConfig(connectionConfig, options = {}) {
    if (!connectionConfig) return null;
    const config = {};
    for (const key in connectionConfig) {
        config[key] = getConfigEnvVariableValue(connectionConfig, key, options);
    }
    return config;
}

function getConfigEnvVariableValue(config, key, options = {}) {
    if (!config[key]?.__envVariableKey) return config[key];
    return getEnv(config[key].__envVariableKey, options.env || 'current');
}

export default {
    resolveConnections,
    resolveConnectionConfig,
    getConfigEnvVariableValue,
};
