import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useEnvVariablesStore } from '@/pinia/envVariables.js';
import { useHooksStore } from '@/pinia/hooks.js';
 import { useIntegrationsStore } from '@/pinia/integrations.js';

export const useBackAuthStore = defineStore('backAuth', () => {
    const projectAuth = ref(null);
    const hooksStore = useHooksStore();
    const integrationsStore = useIntegrationsStore();
    const user = ref(undefined);
    const session = ref(undefined);
    const isAuthenticated = computed(() => !!user.value);

    const envVariablesStore = useEnvVariablesStore();
    const authIntegration = computed(() => projectAuth.value?.integration || null);
    const connectionId = computed(() => projectAuth.value?.connectionId || null);
    const authEnabled = computed(() => !!authIntegration.value);

    const setProjectAuth = authData => {
        projectAuth.value = authData;
    };

    async function refresh(forcedData) {
        if (forcedData) {
            user.value = forcedData.user;
            session.value = forcedData.session;
            return;
        }
        if (authIntegration.value) {
            try {
                if (!session.value) {
                    session.value = localStorage.getItem('ww-auth-session')
                        ? JSON.parse(localStorage.getItem('ww-auth-session'))
                        : undefined;
                }
                await hooksStore.executeHook('auth-refresh/integration:' + authIntegration.value, {
                    session: session.value,
                    connection: integrationsStore.getConnection(connectionId.value),
                    instance: integrationsStore.getInstance(connectionId.value || authIntegration.value),
                });
            } catch (error) {
                user.value = null;
                session.value = null;
            }
            return;
        } else {
            // Legacy auth plugins
            await wwLib.wwAuth.init();
            return;
        }
    }

    async function setAuthUser(_user) {
        user.value = _user;
    }

    async function setAuthSession(_session, options = {}) {
        session.value = _session;
        localStorage.setItem('ww-auth-session', options.persist ? JSON.stringify(session.value) : '{}');
        let isServerSetup = false;
         /* wwFront:start */
        isServerSetup =
            wwLib.$store.getters['websiteData/getDesignInfo']?.back?.isServerSetup?.[wwLib.getEnvironment()];
        /* wwFront:end */
        if (isServerSetup) {
            await wwServerClient('/ww/auth/session', { method: 'POST', body: { session: _session } });
        }
        if (options.refresh) await refresh();
    }

    async function clearAuthSession() {
        user.value = null;
        session.value = null;
        localStorage.removeItem('ww-auth-session');
        let isServerSetup = false;
         /* wwFront:start */
        isServerSetup =
            wwLib.$store.getters['websiteData/getDesignInfo']?.back?.isServerSetup?.[wwLib.getEnvironment()];
        /* wwFront:end */
        if (isServerSetup) {
            await wwServerClient('/ww/auth/session', { method: 'DELETE' });
        }
    }

    function matchAnyRoles(roles) {
        return this.user?.roles?.some(role => roles.includes(role));
    }

    function matchAllRoles(roles) {
        return roles.every(role => this.user?.roles?.includes(role));
    }

    return {
        user,
        session,
        isAuthenticated,
        refresh,
        matchAnyRoles,
        matchAllRoles,
        setAuthUser,
        setAuthSession,
        clearAuthSession,
        projectAuth,
        authEnabled,
        authIntegration,
        setProjectAuth,
        connectionId,
    };
});
