import { resetCollections, fetchNonStaticCollectionsData } from './collections';
import { executeWorkflows, resetWorkflows } from './workflows';
import { useVariablesStore } from '@/pinia/variables.js';
import { useBackTableViewsStore } from '@/pinia/backTableViews.js';
import { useBackAuthStore } from '@/pinia/backAuth.js';
import { useIntegrationsStore } from '@/pinia/integrations.js';

 
let isFirstLoad = true;
const beforeUnload = () => {
    executeWorkflows('page-unload');
};

let isPluginsInitialized = false;
export async function initializePlugins() {
    if (isPluginsInitialized) return;
    isPluginsInitialized = true;
    await wwLib.wwPluginHelper.initPlugins();
}

let isIntegrationInstancesInitialized = false;
export async function initializeIntegrationInstances() {
    if (isIntegrationInstancesInitialized) return;
    isIntegrationInstancesInitialized = true;
    const integrationsStore = useIntegrationsStore(wwLib.$pinia);
    await integrationsStore.initializeInstances();
}

 export async function initializeData(toRoute, forceReset = false) {
 
    const variablesStore = useVariablesStore(wwLib.$pinia);
    const backTableViewsStore = useBackTableViewsStore(wwLib.$pinia);
    const backAuthStore = useBackAuthStore(wwLib.$pinia);
    const resetPersistant = isFirstLoad || forceReset;
    isFirstLoad = false;

    wwLib.$store.dispatch('front/showPageLoadProgress', false);

    /*=================================/
    / RESET & INIT                     /
    /=================================*/
    backTableViewsStore.resetData(resetPersistant);
    resetCollections(resetPersistant);
    resetWorkflows();
     variablesStore.resetVariables(toRoute, resetPersistant);
    if (forceReset) {
        wwLib.$emit('reset-library-variables');
    }
    await backAuthStore.refresh();

    /*=================================/
    / ONLOAD BEFORE FETCH              /
    /=================================*/
    if (resetPersistant) {
        await executeWorkflows('before-collection-fetch-app');
    }
    await executeWorkflows('before-collection-fetch');

    /*=================================/
    / FETCH COLLECTIONS                /
    /=================================*/
    await fetchNonStaticCollectionsData();

    /*=================================/
    / ONLOAD AFTER FETCH               /
    /=================================*/
    if (resetPersistant) {
        await executeWorkflows('onload-app');
    }
    await executeWorkflows('onload');

    /*=================================/
    / SETUP UNLOAD EVENT               /
    /=================================*/
    /* wwFront:start */
    //Remove listener before adding it to be sure it's called only once
    wwLib.getFrontWindow().removeEventListener('beforeunload', beforeUnload);
    wwLib.getFrontWindow().addEventListener('beforeunload', beforeUnload);
    /* wwFront:end */

 }

export async function onPageUnload() {
    await executeWorkflows('page-unload');
}

 