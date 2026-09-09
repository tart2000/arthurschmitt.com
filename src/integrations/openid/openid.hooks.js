global.registerHook('auth-refresh', 'integration:openid', async (c, { session, connection } = {}) => {
    if (!session?.accessToken) return;

    const issuerUrl = connection?.config?.issuerUrl;
    if (!issuerUrl) return;

    const discoveryUrl = `${issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`;
    const discoveryResponse = await fetch(discoveryUrl);
    if (!discoveryResponse.ok) throw new Error('Discovery URL request failed');
    const discovery = await response.json();
    if (!discovery.userinfo_endpoint) return;

    const response = await fetch(discovery.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (!response.ok) throw new Error(`UserInfo request failed: ${response.status}`);

    c.set('user', await response.json());
});
