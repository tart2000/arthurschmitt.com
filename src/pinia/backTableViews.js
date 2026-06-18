import { shallowReactive, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { loadTableView } from '@/_common/helpers/code/tablesViews.js';
import { useBackTablesStore } from '@/pinia/backTables.js';
 
const regexUid = /^[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}$/;

export const useBackTableViewsStore = defineStore('backTableViews', () => {
    let tableViews;
    /* wwFront:start */
    // eslint-disable-next-line no-undef
    tableViews = {};
    /* wwFront:end */
     const currentNavigationId = ref(undefined);
     const backTablesStore = useBackTablesStore();
    const latestFetchParameters = reactive({});
    const states = reactive({});
    const data = reactive(
        new Proxy(
            {},
            {
                get(target, key) {
                    if (typeof key === 'string' && regexUid.test(key) && !(key in target)) {
                        if (
                            currentNavigationId.value === wwLib.globalVariables._navigationId &&
                            !states[key]?.isLoading &&
                            !states[key]?.isLoaded
                        )
                            fetchData(key).catch(() => null);

                        let metadata = {};
                        if (tableViews[key]?.tableId) {
                            const table = backTablesStore.integrationTables[tableViews[key].tableId];
                         }
                        return {
                            data: [],
                            metadata,
                            isLoading: states[key]?.isLoading || false,
                            isLoaded: states[key]?.isLoaded || false,
                            error: states[key]?.error || null,
                        };
                    }
                    if (typeof key === 'string' && regexUid.test(key)) {
                        return {
                            data: target[key]?.data,
                            metadata: target[key]?.metadata,
                            isLoading: states[key]?.isLoading,
                            isLoaded: states[key]?.isLoaded,
                            error: states[key]?.error || null,
                        };
                    } else {
                        return target[key];
                    }
                },
            }
        )
    );

    function resetData(resetPersistant) {
        currentNavigationId.value = wwLib.globalVariables._navigationId;
        const shouldKeep = key =>
            !resetPersistant && tableViews[key]?.isPersistentOnNav && (states[key]?.isLoaded || states[key]?.isLoading);
        for (const key in data) if (!shouldKeep(key)) delete data[key];
        for (const key in states) if (!shouldKeep(key)) delete states[key];
        for (const key in latestFetchParameters) if (!shouldKeep(key)) delete latestFetchParameters[key];
    }

    function setData(tableViewId, newData) {
        data[tableViewId] = newData;
    }

    function startLoading(tableViewId) {
        if (!states[tableViewId]) {
            states[tableViewId] = { isLoading: true, isLoaded: false, error: null };
            return;
        }

        states[tableViewId].isLoading = true;
        states[tableViewId].error = null;
    }

    function finishLoadingSuccess(tableViewId) {
        states[tableViewId].isLoaded = true;
        states[tableViewId].isLoading = false;
    }

    function finishLoadingError(tableViewId, error) {
        states[tableViewId].isLoaded = true;
        states[tableViewId].isLoading = false;
        states[tableViewId].error = error;
    }

    async function fetchData(tableViewId, { parameters = {}, noLog = false, mode = 'offset' } = {}) {
        latestFetchParameters[tableViewId] = parameters;
        startLoading(tableViewId);
         try {
            const newData = await loadTableView(tableViewId, parameters);
            if (!newData) {
                 return;
            }

            if (mode === 'load-more') {
                setData(tableViewId, {
                    data: [...(data[tableViewId]?.data || []), ...(newData.data || [])],
                    metadata: newData.metadata,
                });
            } else {
                setData(tableViewId, newData);
            }
            finishLoadingSuccess(tableViewId);
             return newData;
        } catch (error) {
            finishLoadingError(tableViewId, error);
             throw error;
        }
    }

 
    return {
        tableViews,
        states,
        data,
        resetData,
        setData,
        fetchData,
        latestFetchParameters,
     };
});
