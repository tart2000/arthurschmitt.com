import { createPinia, setActivePinia } from 'pinia';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    initializeConnection: vi.fn(),
}));

vi.mock('@/extensions/integrations/index.js', () => ({
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

    it('provides a stable scope for replacements, separate from other connections and previews', async () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        wwLib.$pinia = pinia;
        const { useIntegrationsStore } = await import('./integrations.js');
        const store = useIntegrationsStore(pinia);
        mocks.initializeConnection.mockResolvedValue({});
        for (const id of ['first', 'second']) {
            store.addConnection({ id, name: id, integration: 'supabase', config: {} });
        }
        await store.initializeConnectionInstance('first');
        const firstScope = mocks.initializeConnection.mock.calls.at(-1)[0].instanceScope;
        expect(firstScope).toBeTypeOf('object');
        // Updating config replaces the connection object; the instance scope must remain stable.
        store.addConnection({ id: 'first', name: 'updated', integration: 'supabase', config: { updated: true } });
        await store.initializeConnectionInstance('first');
        expect(mocks.initializeConnection.mock.calls.at(-1)[0].instanceScope).toBe(firstScope);
        await store.initializeConnectionInstance('second');
        expect(mocks.initializeConnection.mock.calls.at(-1)[0].instanceScope).not.toBe(firstScope);
        await store.buildConnectionInstanceForEnv('first', 'production');
        expect(mocks.initializeConnection.mock.calls.at(-1)[0].instanceScope).toBeUndefined();

        const otherStore = useIntegrationsStore(createPinia());
        otherStore.addConnection({ id: 'first', name: 'another project', integration: 'supabase', config: {} });
        await otherStore.initializeConnectionInstance('first');
        expect(mocks.initializeConnection.mock.calls.at(-1)[0].instanceScope).not.toBe(firstScope);
    });

    it('does not register an older initialization that finishes after its replacement', async () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        wwLib.$pinia = pinia;
        const { useIntegrationsStore } = await import('./integrations.js');
        const store = useIntegrationsStore(pinia);
        store.addConnection({ id: 'connection-id', name: 'test', integration: 'supabase', config: {} });
        let finishPrevious: (instance: object) => void;
        mocks.initializeConnection.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    finishPrevious = resolve;
                })
        );
        const previous = store.initializeConnectionInstance('connection-id');
        const replacement = { client: 'replacement' };
        mocks.initializeConnection.mockResolvedValueOnce(replacement);
        await store.initializeConnectionInstance('connection-id');
        finishPrevious({ client: 'retired' });
        await previous;
        expect(store.getInstance('connection-id')).toBe(replacement);
    });
});
