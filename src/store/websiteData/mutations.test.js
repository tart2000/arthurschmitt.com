import { describe, expect, it } from 'vitest';

import mutations from './mutations';

describe('websiteData state mutations', () => {
    it('removes exact class and subclass mappings when deleting a state', () => {
        const state = {
            wwObjects: {
                element: {
                    _state: {
                        states: [{ id: '_wwHover', label: 'Hover' }],
                        style: { _wwHover_default: { opacity: 0.5 } },
                        classes: {
                            default: ['baseClass'],
                            _wwHover: ['hoverClass'],
                            _wwHover_legacy: ['legacyHoverClass'],
                        },
                        subClasses: {
                            default: { baseClass: ['baseSubClass'] },
                            _wwHover: { hoverClass: ['hoverSubClass'] },
                        },
                    },
                    content: { _wwHover_default: { text: 'Hover' } },
                },
            },
            sections: {},
        };

        mutations.deleteComponentState(state, {
            type: 'element',
            uid: 'element',
            stateId: '_wwHover',
        });
        mutations.addComponentState(state, {
            type: 'element',
            uid: 'element',
            state: { id: '_wwHover', label: 'Hover' },
        });

        expect(state.wwObjects.element._state.classes).toEqual({ default: ['baseClass'] });
        expect(state.wwObjects.element._state.subClasses).toEqual({
            default: { baseClass: ['baseSubClass'] },
        });
        expect(state.wwObjects.element._state.style).toEqual({});
        expect(state.wwObjects.element.content).toEqual({});
    });
});
