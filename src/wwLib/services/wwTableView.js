import { useBackTableViewsStore } from '@/pinia/backTableViews.js';

export default {
    getData(tableViewId) {
        const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
        return backTableViewsStore.data[tableViewId];
    },

    async fetchMore(tableViewId, options) {
        const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
        return await backTableViewsStore.fetchMore(tableViewId, options);
    },

    async refresh(tableViewId) {
        const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
        return await backTableViewsStore.fetchData(tableViewId, { noLog: true });
    },

    async setOffset(tableViewId, offset, options) {
        const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
        return await backTableViewsStore.setOffset(tableViewId, offset, options);
    },

    getPaginationOptions(tableViewId, options) {
        const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
        return backTableViewsStore.getPaginationOptions(tableViewId, options);
    },
};
