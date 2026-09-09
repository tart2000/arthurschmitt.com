global.registerHook('auth-refresh', 'integration:auth0', async (c, { session } = {}) => {
    if (!session?.id_token) return;

    const payload = JSON.parse(Buffer.from(session.id_token.split('.')[1], 'base64url').toString());
    c.set('user', payload);
});
