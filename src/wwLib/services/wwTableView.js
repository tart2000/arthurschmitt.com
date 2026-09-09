import { useBackTableViewsStore } from '@/pinia/backTableViews.js';

export default {
    async setOffset(tableViewId, offset) {
        const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);

        return await backTableViewsStore.fetchData(tableViewId, {
            parameters: { ...backTableViewsStore.latestFetchParameters[tableViewId], offset },
            noLog: true,
        });
    },

    getPaginationOptions(tableViewId) {
        const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
        return backTableViewsStore.data[tableViewId]?.metadata;
    },
};
