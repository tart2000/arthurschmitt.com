import { useBackTableViewsStore } from '@/pinia/backTableViews.js';
import { useBackTablesStore } from '@/pinia/backTables.js';
import { useIntegrationsStore } from '@/pinia/integrations.js';
import integrationsCore from '@/_front/integrations/index.js';
 
let latestRequestId = {};

function getTableViewExecutionContext(id) {
    const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
    const backTablesStore = useBackTablesStore(wwLib.$pinia);
    const integrationsStore = useIntegrationsStore(wwLib.$pinia);
    const tableView = backTableViewsStore.tableViews[id];
    const integrationTable = tableView?.tableId ? backTablesStore.integrationTables[tableView.tableId] : null;

    return {
        tableView,
        integrationTable,
        connection: integrationsStore.getConnection(integrationTable?.connectionId),
        instance: integrationsStore.getInstance(integrationTable?.connectionId || integrationTable?.integration),
    };
}

function getTableViewRequestOptions(parameters, options = {}) {
    const requestOptions = {
        method: 'GET',
        query: parameters,
    };

 
    return requestOptions;
}

export async function loadTableView(id, parameters = {}, options = { isTest: false }) {
    let response = null;
    latestRequestId[id] = wwLib.wwUtils.getUid();
    const currentRequestId = latestRequestId[id];
    try {
        const { tableView, integrationTable, connection, instance } = getTableViewExecutionContext(id);
        if (tableView && integrationTable?.type === 'front') {
            response = await integrationsCore[integrationTable.integration].loadView({
                tableConfig: integrationTable.config,
                viewConfig: tableView.config,
                parameters,
                connection,
                instance,
            });
        } else {
            response = await wwServerClient(`/ww/table-views/${id}`, getTableViewRequestOptions(parameters, options));
        }
        if (currentRequestId !== latestRequestId[id]) return null;
        return response;
    } catch (error) {
        if (currentRequestId !== latestRequestId[id]) return null;
        throw error;
    }
}
