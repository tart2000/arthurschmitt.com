import { createPinia, setActivePinia } from 'pinia';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    initializeConnection: vi.fn(),
}));

vi.mock('@/_front/integrations/index.js', () => ({
    default: {
        supabase: {
            connection: {
                init: mocks.initializeConnection,
            },
        },
    },
}));

vi.mock('@/_common/helpers/code/connnections.js', () => ({
    resolveConnection: vi.fn(connection => connection),
}));

vi.mock('@/_manager/integrations/index.js', () => ({ default: {} }));

vi.mock('@/_manager/backend/integrations.service.js', () => ({
    addIntegrationToProject: vi.fn(),
    deleteIntegrationFromProject: vi.fn(),
    createIntegrationConnection: vi.fn(),
    updateIntegrationConnection: vi.fn(),
    deleteIntegrationConnection: vi.fn(),
}));

describe('useIntegrationsStore', () => {
    beforeEach(() => {
        mocks.initializeConnection.mockReset();
        vi.stubGlobal('__WW_STORE_FRONT_CONNECTIONS__', {});
        vi.stubGlobal('wwLib', {
            wwLog: { error: vi.fn() },
        });
    });

    it('reactively exposes a connection after its instance initializes', async () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        wwLib.$pinia = pinia;
        const { useIntegrationsStore } = await import('./integrations.js');
        const integrationsStore = useIntegrationsStore(pinia);
        const instance = { client: 'supabase' };
        mocks.initializeConnection.mockResolvedValue(instance);

        integrationsStore.addConnection({
            id: 'connection-id',
            name: 'Supabase',
            integration: 'supabase',
            config: {},
        });
        const exposedConnections = computed(() => integrationsStore.getCodeExposedConnections());
        expect(exposedConnections.value).toEqual([]);

        await integrationsStore.initializeConnectionInstance('connection-id');

        expect(exposedConnections.value).toEqual([
            { id: 'connection-id', name: 'Supabase', integration: 'supabase', config: {} },
        ]);
        expect(integrationsStore.getInstance('connection-id')).toBe(instance);
    });
});
