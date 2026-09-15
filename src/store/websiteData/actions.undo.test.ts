import { beforeEach, describe, expect, it, vi } from 'vitest';

const flushPendingHistory = vi.hoisted(() => vi.fn());

vi.mock('@/wwLib/servicesManager/wwEditorHistory.js', () => ({
    default: {
        TYPES: {},
        ACTIONS: {},
        historyAction: (_configuration: unknown, action: unknown) => action,
        flushPendingHistory,
    },
}));
vi.mock('@/pinia/variables.js', () => ({ useVariablesStore: vi.fn() }));
vi.mock('@/_common/helpers/pathResolver', () => ({ getTargetMedia: vi.fn() }));
vi.mock('@/_common/helpers/component/component.js', () => ({
    getComponentConfiguration: vi.fn(),
    getComponentBaseConfiguration: vi.fn(),
}));

import actions from './actions';

describe('websiteData undo', () => {
    beforeEach(() => {
        flushPendingHistory.mockReset();
        wwLib.wwEditorHistory = { flushPendingHistory };
    });

    it('publishes a pending direct-manipulation command before applying Undo', async () => {
        const calls: string[] = [];
        flushPendingHistory.mockImplementation(async () => {
            calls.push('flush');
        });
        const context = {
            commit: vi.fn(() => calls.push('undo')),
        };

        await actions.undo(context);

        expect(context.commit).toHaveBeenCalledWith('undo');
        expect(calls).toEqual(['flush', 'undo']);
    });
});
