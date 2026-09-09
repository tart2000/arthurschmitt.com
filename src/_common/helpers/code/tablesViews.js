import { useBackTableViewsStore } from '@/pinia/backTableViews.js';
import { useBackTablesStore } from '@/pinia/backTables.js';
import { useIntegrationsStore } from '@/pinia/integrations';
import integrationsCore from '@/_front/integrations/index.js';
 
let latestRequestId = {};

function getTableViewExecutionContext(id, env = null) {
    const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
    const backTablesStore = useBackTablesStore(wwLib.$pinia);
    const integrationsStore = useIntegrationsStore(wwLib.$pinia);
    const tableView = backTableViewsStore.tableViews[id];
    const integrationTable = tableView?.tableId ? backTablesStore.integrationTables[tableView.tableId] : null;

    return {
        tableView,
        integrationTable,
        integrationsStore,
        connection: integrationsStore.getConnection(integrationTable?.connectionId, env),
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

function getTableViewParameterKey(parameter) {
    return parameter?.key || parameter?.name || null;
}

function getTableViewParameterDefaultValue(parameter) {
    if (parameter?.type === 'object') {
        return parameter?.value && typeof parameter.value === 'object' && !Array.isArray(parameter.value)
            ? { ...parameter.value }
            : {};
    }

    return parameter?.value;
}

function buildTableViewParameterValues(definitions = [], currentValues = {}) {
    const safeCurrentValues = currentValues && typeof currentValues === 'object' ? currentValues : {};
    const values = { ...safeCurrentValues };

    for (const definition of definitions) {
        const key = getTableViewParameterKey(definition);
        if (!key) continue;

        if (Object.hasOwn(safeCurrentValues, key)) {
            continue;
        }

        if (definition?.type === 'object') {
            values[key] = getTableViewParameterDefaultValue(definition);
            continue;
        }

        if (definition?.value !== undefined && definition?.value !== '') {
            values[key] = definition.value;
        }
    }

    return values;
}

export async function loadTableView(id, parameters = {}, options = { isTest: false }) {
    let response = null;
    latestRequestId[id] = wwLib.wwUtils.getUid();
    const currentRequestId = latestRequestId[id];
    try {
        const { tableView, integrationTable, integrationsStore, connection, instance } = getTableViewExecutionContext(
            id,
            options.env
        );
        if (tableView && integrationTable?.type === 'front') {
            let viewInstance = instance;
             const frontParameters = buildTableViewParameterValues(tableView.parameters || [], parameters);
            response = await integrationsCore[integrationTable.integration].loadView({
                tableConfig: integrationTable.config,
                viewConfig: tableView.config,
                parameters: frontParameters,
                connection,
                instance: viewInstance,
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
