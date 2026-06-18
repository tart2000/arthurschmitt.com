import { defineStore } from 'pinia';
import { ref, shallowReactive } from 'vue';
 import integrationCore from '@/_front/integrations/index.js';
import { resolveConnection } from '@/_common/helpers/code/connnections.js';
 
export const NATIVE_INTEGRATIONS = ['http-request', 'weweb-auth', 'weweb-storage', 'custom-auth'];

export const useIntegrationsStore = defineStore('integrations', () => {
    const installed = ref([...NATIVE_INTEGRATIONS]);
    const connections = ref({});
    /* wwFront:start */
    // eslint-disable-next-line no-undef
    connections.value = {};
    /* wwFront:end */
    const instances = {};
 
    async function initializeConnectionInstance(connectionId) {
        const rawConnection = connections.value[connectionId];
        if (!rawConnection) return;

        const connection = resolveConnection(rawConnection);
        if (!connection) return;

        const integration = integrationCore[connection.integration];
        if (!integration?.connection?.init) return;

        try {
            const instance = await integration.connection.init({ connection });
            instances[connectionId] = instance;
        } catch (error) {
            wwLib.wwLog?.error('Failed to initialize connection instance', error);
        }
    }

    async function initializeIntegrationInstance(integrationKey) {
        const integration = integrationCore[integrationKey];
        if (!integration?.init) return;

        try {
            const instance = await integration.init();
            instances[integrationKey] = instance;
        } catch (error) {
            wwLib.wwLog?.error('Failed to initialize integration instance', error);
        }
    }

    async function initializeInstances() {
        for (const integrationKey of installed.value) {
            await initializeIntegrationInstance(integrationKey);
        }

        for (const connectionId in connections.value) {
            await initializeConnectionInstance(connectionId);
        }
    }

 
    return {
        installed,
        connections,
        getInstance(id) {
            return instances[id] || null;
        },
        getConnection(connectionId) {
            if (!connectionId) return null;
            const connection = connections.value[connectionId];
            if (!connection) return null;
            return resolveConnection(connection);
        },
        initializeInstances,
        initializeConnectionInstance,
         addIntegration(integration) {
            if (!integration) return;
            if (!installed.value.includes(integration)) {
                installed.value.push(integration);
            }
        },
        removeIntegration(integration) {
            const index = installed.value.indexOf(integration);
            if (index !== -1) {
                installed.value.splice(index, 1);
            }

            if (instances[integration]) {
                delete instances[integration];
            }
        },
        addConnection(connection) {
            if (!connection?.id) return;
            connections.value[connection.id] = connection;
        },
     };
});
