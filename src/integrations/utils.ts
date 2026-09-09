import { getParametersInContext } from '../services/tmp/codeEval/utils.js';
import { getAppUrls } from '../core/config.core.js';
import pages from '../data/pages.json' with { type: 'json' };

export function isDataURI(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith('data:');
}

export function dataURIToBase64(dataURI: string): string {
    return dataURI.split(',')[1];
}

export function dataURIToBuffer(dataURI: string): Buffer {
    return Buffer.from(dataURIToBase64(dataURI), 'base64');
}

export function dataURIToContentType(dataURI: string): string {
    const match = dataURI.match(/^data:([^;,]+)[;,]/);
    return match?.[1] || '';
}

export function bytesToDataURI(bytes: Uint8Array | Buffer | string, contentType: string): string {
    return `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`;
}

export async function fileToDataURI(file: File | Blob): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    return `data:${file.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
}

export async function fileToBuffer(file: File | Blob): Promise<Buffer> {
    return Buffer.from(await file.arrayBuffer());
}

export async function transformFileAttachments(attachments: unknown, contentKey: string): Promise<unknown> {
    if (!Array.isArray(attachments)) return attachments;
    return Promise.all(
        attachments.map(async attachment => {
            if (attachment?.[contentKey] instanceof File) {
                const file = attachment[contentKey];
                return {
                    ...attachment,
                    [contentKey]: Buffer.from(await file.arrayBuffer()).toString('base64'),
                };
            }
            if (isDataURI(attachment?.[contentKey])) {
                return {
                    ...attachment,
                    [contentKey]: dataURIToBase64(attachment[contentKey]),
                };
            }
            return attachment;
        })
    );
}

export const findTableLinkData = ({ integration, context, matchingFunction }) => {
    const parameters = getParametersInContext(context);
    for (const parameterKey of Object.keys(parameters)) {
        if (!parameterKey.startsWith(`table:${integration}/`)) continue;
        const parameterName = parameterKey.split(':')[1];
        const tableLinkDefinition = context.workflowDefinition?.parameters?.find(param => param.name === parameterName);
        if (tableLinkDefinition && matchingFunction(tableLinkDefinition)) {
            const data = parameters[parameterKey];
            const allowedColumns: string[] = tableLinkDefinition.columns;
            if (!allowedColumns?.length || !data || typeof data !== 'object') {
                return data;
            }
            const filteredData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
                if (allowedColumns.includes(key)) {
                    filteredData[key] = value;
                }
            }
            return filteredData;
        }
    }
    return null;
};

export const getPageUrl = (pageConfig: { type: 'internal' | 'external'; pageId: string; url: string }) => {
    if (!pageConfig) return undefined;
    if (pageConfig.type === 'internal') {
        const appUrl = getAppUrls()[0];
        if (process.env.ENV === 'editor') {
            return `${appUrl}/${pageConfig.pageId}`;
        } else {
            const page = pages[pageConfig.pageId];
            const path = page?.isHomePage ? '' : page?.paths?.default;
            return `${appUrl}/${path}`;
        }
    } else if (pageConfig.type === 'external') {
        return pageConfig.url;
    }
    return undefined;
};

export default {
    isDataURI,
    dataURIToBase64,
    dataURIToBuffer,
    dataURIToContentType,
    bytesToDataURI,
    fileToDataURI,
    fileToBuffer,
    transformFileAttachments,
    findTableLinkData,
    getPageUrl,
};
