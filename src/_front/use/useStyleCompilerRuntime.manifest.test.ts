import { nextTick, reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const compilerStops: Array<ReturnType<typeof vi.fn>> = [];
    const registrationStops: Array<ReturnType<typeof vi.fn>> = [];
    const atomicRegistrationStops: Array<ReturnType<typeof vi.fn>> = [];

    return {
        compilerStops,
        atomicRegistrationStops,
        compileStylesheet: vi.fn(() => {
            const stop = vi.fn();
            compilerStops.push(stop);
            return { result: [], stop };
        }),
        createSources: vi.fn(() => ({
            scope: { value: { elementUids: [], sectionUids: [], libraryComponentIds: [] } },
            reader: {},
        })),
        createStyleSheet: vi.fn(() => ({})),
        lifecycleCleanups: [] as Array<() => void>,
        registrationStops,
        registerVariables: vi.fn(() => {
            const stop = vi.fn();
            registrationStops.push(stop);
            return stop;
        }),
        registerAtomicClasses: vi.fn(() => {
            const stop = vi.fn();
            atomicRegistrationStops.push(stop);
            return stop;
        }),
    };
});

vi.mock('vue', async importOriginal => ({
    ...(await importOriginal<typeof import('vue')>()),
    onBeforeUnmount: vi.fn((cleanup: () => void) => mocks.lifecycleCleanups.push(cleanup)),
}));
vi.mock('@/_common/helpers/styleCompiler', async importOriginal => ({
    ...(await importOriginal<typeof import('@/_common/helpers/styleCompiler')>()),
    createStyleCompiler: () => ({ compileStylesheet: mocks.compileStylesheet }),
}));
vi.mock('@/_front/helpers/styleCompilerReader', () => ({
    createEditorStyleCompilerSources: mocks.createSources,
}));
vi.mock('@/_front/services/styleCompilerDomStyleSheet', () => ({
    createDomStyleSheetAdapter: mocks.createStyleSheet,
}));
vi.mock('@/_front/services/styleCompilerRuntimeVariables', () => ({
    registerStyleDynamicVariables: mocks.registerVariables,
}));
vi.mock('@/_front/services/styleCompilerAtomicClasses', () => ({
    registerStyleAtomicClasses: mocks.registerAtomicClasses,
}));

import { usePageStyleCompilerRuntime } from './useStyleCompilerRuntime';

describe('published page style runtime', () => {
    beforeEach(() => {
        mocks.compileStylesheet.mockClear();
        mocks.createSources.mockClear();
        mocks.createStyleSheet.mockClear();
        mocks.registerVariables.mockClear();
        mocks.registerAtomicClasses.mockClear();
        mocks.compilerStops.length = 0;
        mocks.lifecycleCleanups.length = 0;
        mocks.registrationStops.length = 0;
        mocks.atomicRegistrationStops.length = 0;
    });

    it('registers and disposes atomic classes transported by a version two manifest', () => {
        setCurrentPage(
            { id: 'page-atomic', _sm: [2, [], [[0, [0, ['ww-a-display']]]]] },
            { wwObjects: { 'element-a': {} } }
        );

        usePageStyleCompilerRuntime('runtime');

        expect(mocks.registerAtomicClasses).toHaveBeenCalledWith([
            { sourceUid: 'element-a', surfaceKind: 'element', className: 'ww-a-display' },
        ]);
        runLifecycleCleanups();
        expect(mocks.atomicRegistrationStops[0]).toHaveBeenCalledOnce();
    });

    it('retries indexed atomic assignments when page sources arrive after the manifest', async () => {
        const websiteData = reactive({
            page: { id: 'page-atomic', _sm: [2, [], [[0, [0, ['ww-a-display']]]]] },
            sections: {} as Record<string, unknown>,
            wwObjects: {} as Record<string, unknown>,
        });
        setReactiveWebsiteData(websiteData);

        usePageStyleCompilerRuntime('runtime');

        expect(mocks.compileStylesheet).toHaveBeenCalledOnce();
        expect(mocks.registerAtomicClasses).not.toHaveBeenCalled();

        websiteData.wwObjects['element-a'] = {};
        await nextTick();

        expect(mocks.compilerStops[0]).toHaveBeenCalledOnce();
        expect(mocks.registerAtomicClasses).toHaveBeenCalledWith([
            { sourceUid: 'element-a', surfaceKind: 'element', className: 'ww-a-display' },
        ]);
        runLifecycleCleanups();
    });

    it('resolves indexed assignments from the incoming page order after SPA navigation', () => {
        setCurrentPage(
            { id: 'page-after-navigation', _sm: [2, [], [[0, 'ww-a-display', [0]]]] },
            {
                wwObjects: {
                    'retained-from-previous-page': {},
                    'element-a': {},
                },
                styleSourceUids: ['element-a'],
            }
        );

        usePageStyleCompilerRuntime('runtime');

        expect(mocks.registerAtomicClasses).toHaveBeenCalledWith([
            { sourceUid: 'element-a', surfaceKind: 'element', className: 'ww-a-display' },
        ]);
        runLifecycleCleanups();
    });

    it('registers a valid page manifest without constructing runtime compiler sources', () => {
        setCurrentPage({ id: 'page-a', _sm: [1, []] });

        usePageStyleCompilerRuntime('runtime');

        expect(mocks.registerVariables).toHaveBeenCalledWith([]);
        expect(mocks.createSources).not.toHaveBeenCalled();
        expect(mocks.compileStylesheet).not.toHaveBeenCalled();
        runLifecycleCleanups();
    });

    it('keeps the runtime compiler as a fallback for pages published without a manifest', () => {
        setCurrentPage({ id: 'legacy-page' });

        usePageStyleCompilerRuntime('runtime');

        expect(mocks.registerVariables).not.toHaveBeenCalled();
        expect(mocks.createSources).toHaveBeenCalledOnce();
        expect(mocks.compileStylesheet).toHaveBeenCalledOnce();
        runLifecycleCleanups();
    });

    it('switches atomically between legacy compilation and page manifests', async () => {
        const page = reactive<{ id: string; _sm?: unknown }>({ id: 'legacy-page' });
        setCurrentPage(page);
        usePageStyleCompilerRuntime('runtime');

        page.id = 'manifest-page';
        page._sm = [1, []];
        await nextTick();

        expect(mocks.compilerStops[0]).toHaveBeenCalledOnce();
        expect(mocks.registerVariables).toHaveBeenCalledWith([]);

        page.id = 'malformed-page';
        page._sm = [2, []];
        await nextTick();

        expect(mocks.registrationStops[0]).toHaveBeenCalledOnce();
        expect(mocks.compileStylesheet).toHaveBeenCalledTimes(2);
        runLifecycleCleanups();
    });
});

function setCurrentPage(
    page: { id: string; _sm?: unknown },
    {
        sections = {},
        wwObjects = {},
        styleSourceUids,
    }: {
        sections?: Record<string, unknown>;
        wwObjects?: Record<string, unknown>;
        styleSourceUids?: readonly string[];
    } = {}
) {
    wwLib.$store = {
        getters: {
            'websiteData/getPage': page,
            'websiteData/getSections': sections,
            'websiteData/getWwObjects': wwObjects,
            'websiteData/getStyleSourceUids': styleSourceUids,
        },
    } as typeof wwLib.$store;
}

function setReactiveWebsiteData(websiteData: {
    page: { id: string; _sm?: unknown };
    sections: Record<string, unknown>;
    wwObjects: Record<string, unknown>;
}) {
    wwLib.$store = {
        getters: {
            get 'websiteData/getPage'() {
                return websiteData.page;
            },
            get 'websiteData/getSections'() {
                return websiteData.sections;
            },
            get 'websiteData/getWwObjects'() {
                return websiteData.wwObjects;
            },
        },
    } as typeof wwLib.$store;
}

function runLifecycleCleanups() {
    for (const cleanup of mocks.lifecycleCleanups) cleanup();
}
