import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVariablesStore = vi.hoisted(() => ({
    getConfiguration: vi.fn(),
    components: {},
    values: {},
    setValue: vi.fn(),
}));

vi.mock('@/_common/use/useActions.js', () => ({
    executeComponentAction: vi.fn(),
}));

vi.mock('@/_common/helpers/code/workflowsCallstack.js', () => ({
    detectInfinityLoop: vi.fn(() => false),
}));

vi.mock('@/_common/helpers/updateVariable.js', () => ({
    applyVariableUpdate: vi.fn(),
}));

vi.mock('@/pinia/variables.js', () => ({
    useVariablesStore: vi.fn(() => mockVariablesStore),
}));

vi.mock('@/_common/helpers/code/backendWorkflows.js', () => ({
    executeBackendWorkflow: vi.fn(),
    parseSSEStreamAsync: vi.fn(),
}));

vi.mock('@/pinia/popup', () => ({
    usePopupStore: vi.fn(() => ({})),
}));

vi.mock('@/pinia/backTableViews.js', () => ({
    useBackTableViewsStore: vi.fn(() => ({
        fetchData: vi.fn(),
        latestFetchParameters: {},
        data: {},
    })),
}));

vi.mock('@better-fetch/fetch', () => ({
    betterFetch: vi.fn(),
}));

vi.mock('@/_front/integrations/index.js', () => ({
    default: {},
}));

vi.mock('@/pinia/integrations.js', () => ({
    useIntegrationsStore: vi.fn(() => ({})),
}));

vi.mock('@/pinia/backAuth', () => ({
    useBackAuthStore: vi.fn(() => ({})),
}));

vi.mock('@/pinia/editor/debugger.js', () => ({
    useDebuggerStore: vi.fn(() => ({
        startWorkflow: vi.fn(() => 'execution-id'),
        stopWorkflow: vi.fn(),
        log: vi.fn(),
    })),
}));

import { executeWorkflow } from './workflows.js';

describe('executeWorkflow versioned formula handling', () => {
    const dispatch = vi.fn();
    const updateValue = vi.fn((_, value) => value);

    beforeEach(() => {
        dispatch.mockReset();
        updateValue.mockClear();
        mockVariablesStore.getConfiguration.mockReset();
        mockVariablesStore.setValue.mockReset();
        mockVariablesStore.components = {};
        mockVariablesStore.values = {};
        globalThis.wwLib = {
            WW_SAFE_MODE_HARD: 'hard',
            $pinia: {},
            $store: {
                getters: {
                    'manager/getSafeMode': null,
                    'data/getWorkflowResults': vi.fn(() => ({})),
                    'data/getFormulas': {},
                    'data/getPluginFormulas': {},
                    'data/getCollections': {},
                    'libraries/getComponents': {},
                },
                dispatch,
            },
            globalVariables: {
                customCodeVariables: {},
            },
            wwVariable: {
                updateValue,
            },
        };
    });

    it('keeps legacy workflows non-fatal when a config formula fails', async () => {
        const execution = await executeWorkflow({
            id: 'workflow-v1',
            firstAction: 'return-action',
            actions: {
                'return-action': {
                    id: 'return-action',
                    type: 'return',
                    value: {
                        __wwtype: 'f',
                        code: 'missing.value',
                    },
                },
            },
        });

        expect(execution.error).toBeUndefined();
        expect(execution.result).toBeUndefined();
        expect(dispatch).not.toHaveBeenCalledWith(
            'data/setWorkflowError',
            expect.anything()
        );
    });

    it('fails v2 workflows when a config formula fails', async () => {
        const execution = await executeWorkflow({
            id: 'workflow-v2',
            version: 2,
            firstAction: 'return-action',
            actions: {
                'return-action': {
                    id: 'return-action',
                    type: 'return',
                    value: {
                        __wwtype: 'f',
                        code: 'missing.value',
                    },
                },
            },
        });

        expect(execution.error).toMatchObject({
            name: 'FormulaError',
            message: expect.stringContaining('Formula evaluation error'),
        });
        expect(dispatch).toHaveBeenCalledWith('data/setWorkflowError', {
            workflowId: 'workflow-v2',
            value: expect.objectContaining({
                name: 'FormulaError',
                message: expect.stringContaining('Formula evaluation error'),
            }),
        });
    });

    it('evaluates update-variable formulas once before writing the result', async () => {
        globalThis.wwLib.globalVariables.customCodeVariables.list = [];
        mockVariablesStore.getConfiguration.mockImplementation(variableId =>
            variableId === 'list' ? { id: 'list', type: 'array' } : null
        );

        await executeWorkflow(
            {
                id: 'workflow-update-variable',
                firstAction: 'update-variable-action',
                actions: {
                    'update-variable-action': {
                        id: 'update-variable-action',
                        type: 'update-variable',
                        varId: 'list',
                        varValue: {
                            __wwtype: 'js',
                            code: `
                                const items = variables.list || [];
                                const value = context.item.data;
                                const index = items.indexOf(value);

                                if (index > -1) items.splice(index, 1);
                                else items.push(value);

                                return items;
                            `,
                        },
                    },
                },
            },
            {
                context: {
                    item: {
                        data: 1,
                    },
                },
            }
        );

        expect(updateValue).toHaveBeenCalledWith(
            'list',
            [1],
            expect.objectContaining({
                path: null,
                index: 0,
                arrayUpdateType: undefined,
            })
        );
    });

    it('stores the execution-resolved config for workflow action results', async () => {
        await executeWorkflow({
            id: 'workflow-config',
            firstAction: 'return-action',
            actions: {
                'return-action': {
                    id: 'return-action',
                    type: 'return',
                    value: {
                        __wwtype: 'js',
                        code: 'return "resolved value";',
                    },
                },
            },
        });

        const actionResultCall = dispatch.mock.calls.find(
            ([type, payload]) => type === 'data/setWorkflowActionResult' && payload.actionId === 'return-action'
        );

        expect(actionResultCall).toBeTruthy();
        expect(actionResultCall[1]).toMatchObject({
            workflowId: 'workflow-config',
            actionId: 'return-action',
            result: 'resolved value',
            config: {
                value: 'resolved value',
            },
        });
    });
});
