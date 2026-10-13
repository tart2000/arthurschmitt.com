import { useComponentBasesStore } from '@/pinia/componentBases';
import { extractPathParameters } from '@/_common/helpers/urlParametersParsing';

export default {
    getCollections(state) {
        return state.collections;
    },
    getPaginationOptions: state => id => {
        const collection = state.collections[id];
        if (!collection) return null;
        if (!collection.limit) return null;
        return {
            total: collection.total,
            limit: parseInt(wwLib.wwFormula.getValue(collection.limit)),
            offset: collection.offset || 0,
        };
    },
    getPageCollectionIndex(state, getters, rootState, rootGetters) {
 
        /* wwFront:start */
        // eslint-disable-next-line no-unreachable
        const pageId = rootGetters['websiteData/getPageId'];
        const [, pageIndex] = pageId.split('_');
        return pageIndex || 0;
        /* wwFront:end */
    },
    getPageCollectionData(state, getters, rootState, rootGetters) {
         /* wwFront:start */
        // eslint-disable-next-line no-unreachable
        return rootGetters['websiteData/getPage'].data;
        /* wwFront:end */
    },
    getPageParameterVariables(state) {
        return state.pageParameterVariables;
    },
    getPageParameterVariablesFromId: (_state, _getters, _rootState, rootGetters) => id => {
        const page = rootGetters['websiteData/getPageById'](id) || rootGetters['websiteData/getPageByLinkId'](id);
        if (!page || !page.paths) return [];
        return extractPathParameters(page.paths.default).map(({ name, defaultValue }) => ({
            type: 'query',
            id: name,
            name,
            value: defaultValue,
            defaultValue: defaultValue,
            pageId: page.id,
            queryName: 'wwParam-' + name,
        }));
    },
    getFormulas(state) {
        return state.formulas;
    },
    getPluginFormulas(state) {
        return state.pluginFormulas;
    },
    getAllFormulas(_state, getters) {
        return { ...getters.getFormulas, ...getters.getPluginFormulas };
    },
    getPluginActions: (_state, _getters, rootState, rootGetters) => {
        const store = useComponentBasesStore(wwLib.$pinia);
        return Object.values(store.configurations)
            .filter(config => config.actions)
            .map(config => {
                const plugin =
                    rootGetters['websiteData/getPluginByComponentId'](config.name) ||
                    rootGetters['websiteData/getPluginByName'](config.name);
                // ignore the pruduction version of the plugin if the dev version is available
                if (!plugin || (plugin.isDev && !config.wwDev)) return [];
                return config.actions.map(action => ({
                    ...action,
                    pluginId: plugin && plugin.id,
                }));
            })
            .flat()
            .filter(action => action.pluginId)
            .reduce((obj, item) => {
                const id = `${item.pluginId}-${item.code}`;
                return { ...obj, [id]: { ...item, id } };
            }, {});
    },
     getWorkflowResults: state => workflowId => state.workflowsResults[workflowId],
    getAllWorkflows(state) {
        return state.globalWorkflows;
    },
    getGlobalWorkflows(state) {
        return Object.entries(state.globalWorkflows).reduce((acc, [id, workflow]) => {
            if (workflow.type !== 'back') acc[id] = workflow;
            return acc;
        }, {});
    },
    getBackendWorkflows(state) {
        return Object.entries(state.globalWorkflows).reduce((acc, [id, workflow]) => {
            if (workflow.type === 'back') acc[id] = workflow;
            return acc;
        }, {});
    },
    getBackendWorkflowsFolders: (state, getters) => trigger => {
        const backendWorkflows = Object.values(getters.getBackendWorkflows);
        const workflows =
            !trigger || ['ww-api', 'ww-middleware'].includes(trigger)
                ? backendWorkflows.filter(w => w.trigger == trigger)
                : backendWorkflows.filter(w => !!w.trigger && !['ww-api', 'ww-middleware'].includes(w.trigger));
        return workflows.filter(({ folder }) => folder).map(({ folder }) => ({ label: folder, value: folder }));
    },
};
