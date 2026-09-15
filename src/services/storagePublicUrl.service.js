import { normalizePath, resolveStorageRuntimeConfig } from '../core/storage.core.ts';

function normalizeBaseUrl(baseUrl) {
    const normalizedBaseUrl = String(baseUrl || '').trim().replace(/\/+$/, '');
    if (!normalizedBaseUrl) {
        throw new Error('Storage CDN URL is not configured');
    }
    return normalizedBaseUrl;
}

function isWewebDomain(hostname) {
    return (
        hostname === 'weweb.io' ||
        hostname.endsWith('.weweb.io') ||
        /^(.+\.)?weweb-[a-z0-9-]+\.io$/.test(hostname)
    );
}

function parseAppUrls(appUrl) {
    if (Array.isArray(appUrl)) {
        return appUrl;
    }

    const normalizedAppUrl = String(appUrl || '').trim();
    if (!normalizedAppUrl) {
        return [];
    }

    try {
        const parsedAppUrl = JSON.parse(normalizedAppUrl);
        if (Array.isArray(parsedAppUrl)) {
            return parsedAppUrl;
        }
    } catch {}

    return [normalizedAppUrl];
}

function getPreferredAppUrl(appUrl) {
    const normalizedAppUrls = parseAppUrls(appUrl).map(normalizeBaseUrl);
    if (!normalizedAppUrls.length) {
        throw new Error('Storage CDN URL is not configured');
    }

    for (const candidateUrl of normalizedAppUrls) {
        try {
            const parsedCandidateUrl = new URL(candidateUrl);
            if (!isWewebDomain(parsedCandidateUrl.hostname.toLowerCase())) {
                return candidateUrl;
            }
        } catch {}
    }

    return normalizedAppUrls[0];
}

function getStorageUrl(key, access = 'public', env = 'current') {
    if (access !== 'public') {
        throw new Error('getStorageUrl only supports public storage');
    }

    const normalizedKey = normalizePath(String(key || '').trim());
    if (!normalizedKey) {
        throw new Error('Storage key is required');
    }

    const runtimeConfig = resolveStorageRuntimeConfig(env);
    if (!runtimeConfig.integration) {
        throw new Error('No storage driver configured');
    }

    if (runtimeConfig.integration === 'weweb-storage') {
        const appUrl = getPreferredAppUrl(runtimeConfig.appUrl);
        return `${appUrl}/storage/public/${normalizedKey}`;
    }

    const cdnUrl = normalizeBaseUrl(runtimeConfig.cdnUrl);
    return `${cdnUrl}/${normalizedKey}`;
}

export { getStorageUrl };
