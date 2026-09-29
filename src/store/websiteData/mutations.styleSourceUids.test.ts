import { describe, expect, it, vi } from 'vitest';

vi.mock('@/pinia/variables.js', () => ({ useVariablesStore: vi.fn() }));
vi.mock('@/pinia/backTableViews.js', () => ({ useBackTableViewsStore: vi.fn() }));
vi.mock('@/pinia/backTableFormulaColumns.js', () => ({ useBackTableFormulaColumnsStore: vi.fn() }));
vi.mock('@/_manager/helpers/plugins.js', () => ({ PLUGIN_CATEGORIES: {} }));
vi.mock('@/_common/helpers/pathResolver', () => ({ getPath: vi.fn() }));

import mutations from './mutations';
import createState from './state';

describe('websiteData page style source order', () => {
    it('captures incoming page order instead of retained store insertion order', () => {
        const state = createState();
        state.design.pages = [{ id: 'page-b' }];
        state.wwObjects = {
            'retained-from-page-a': { uid: 'retained-from-page-a' },
        };

        mutations.setPageData.call({ commit: vi.fn() }, state, {
            page: { id: 'page-b' },
            sections: {
                'section-b': { uid: 'section-b' },
            },
            wwObjects: {
                'element-b-2': { uid: 'element-b-2' },
                'element-b-1': { uid: 'element-b-1' },
            },
        });

        expect(state.styleSourceUids).toEqual(['section-b', 'element-b-2', 'element-b-1']);
        expect(state.sections['section-b']._si).toBe(0);
        expect(state.wwObjects['element-b-2']._si).toBe(1);
        expect(state.wwObjects['element-b-1']._si).toBe(2);
    });

    it('keeps loaded ids and repairs duplicated source ids before storing new elements', () => {
        const state = createState();
        const original = { uid: 'original', _si: 12 };
        const duplicate = { uid: 'duplicate', _si: 12 };

        mutations.createMultipleWwObjects(state, [original, duplicate]);

        expect(state.wwObjects.original._si).toBe(12);
        expect(state.wwObjects.duplicate._si).toBe(13);
    });
});
