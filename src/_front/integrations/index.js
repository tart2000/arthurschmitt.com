const integrationModules = import.meta.glob('./*/*.front.{js,ts}', { eager: true });

const integrations = {};

for (const modulePath in integrationModules) {
    const match = modulePath.match(/^\.\/([^/]+)\/[^/]+\.front\.(js|ts)$/);
    if (!match) continue;

    const integrationId = match[1];
    const integrationModule = integrationModules[modulePath];

    if (!integrationModule?.default) continue;

    integrations[integrationId] = integrationModule.default;
}

export default integrations;
