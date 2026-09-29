import storageCore from '../../core/storage.core.ts';
import { bytesToDataURI, dataURIToContentType, isDataURI } from '../utils.ts';
import { isPlainObject } from '../../utils/objectGuards.ts';

type StorageAccess = Parameters<(typeof storageCore)['get']>[0];
type StoragePath = Parameters<(typeof storageCore)['get']>[1];
type StorageEnv = Parameters<(typeof storageCore)['get']>[2];
type StoragePutData = Parameters<(typeof storageCore)['put']>[2];
type StoragePutOptions = Parameters<(typeof storageCore)['put']>[3];
type StorageSignedUrlOptions = Parameters<(typeof storageCore)['getSignedUrl']>[2];
type StorageCopyMoveOptions = Parameters<(typeof storageCore)['copy']>[3];
type StorageActionOptions = StoragePutOptions & StorageSignedUrlOptions & StorageCopyMoveOptions;

function getAccess(access: unknown): StorageAccess {
    return access === 'public' ? 'public' : 'private';
}

export function normalizeOptions(args: Record<string, unknown>): StorageActionOptions {
    const options: StorageActionOptions = isPlainObject(args.options) ? { ...(args.options as StorageActionOptions) } : {};
    const file = args.file instanceof Blob ? args.file : null;

    if (args.replaceIfExists !== undefined) {
        options.overwrite = Boolean(args.replaceIfExists);
    }
    if (typeof args.expiresIn === 'number' || typeof args.expiresIn === 'string') {
        options.expiresIn = args.expiresIn;
    }
    if (typeof args.size === 'number' && Number.isFinite(args.size)) {
        options.contentLength = args.size;
    } else if (typeof args.size === 'string') {
        const parsedSize = Number(args.size);
        if (Number.isFinite(parsedSize)) {
            options.contentLength = parsedSize;
        }
    } else if (file) {
        options.contentLength = file.size;
    }
    if (typeof args.contentType === 'string') {
        options.contentType = args.contentType;
    } else if (file?.type) {
        options.contentType = file.type;
    } else if (typeof args.file === 'string' && isDataURI(args.file)) {
        options.contentType = dataURIToContentType(args.file);
    }
    if (isPlainObject(args.tags)) {
        options.tags = args.tags;
    }

    return options;
}

function getPath(value: unknown): StoragePath {
    return typeof value === 'string' ? value : '';
}

function sanitizeStorageFileName(name: string) {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\-_!\.\s]/g, '_');
}

function sanitizeStoragePath(path: string) {
    if (!path) return path;

    const segments = path.split('/');
    const fileName = segments.at(-1);

    if (!fileName) return path;

    segments[segments.length - 1] = sanitizeStorageFileName(fileName);
    return segments.join('/');
}

function isBase64(str: string): boolean {
    try {
        return btoa(atob(str)) === str;
    } catch (e) {
        return false;
    }
}

async function getPutData(value: unknown): Promise<StoragePutData> {
    if (typeof value === 'string') {
        const base64 = value.includes(',') ? value.split(',')[1] : value;
        if (isBase64(base64)) {
            return new Uint8Array(Buffer.from(base64, 'base64'));
        }
        return value;
    }
    if (value instanceof Uint8Array) {
        return value;
    }
    if (value instanceof Blob) {
        return new Uint8Array(await value.arrayBuffer());
    }

    throw new TypeError('Invalid file payload');
}

function getSourcePath(args: Record<string, unknown>) {
    return getPath(args.sourcePath);
}

function getDestinationPath(args: Record<string, unknown>) {
    return getPath(args.destinationPath);
}

function getStoragePutMode(args: Record<string, unknown>) {
    if (args.mode === 'multiple') return 'multiple';
    if (args.mode === 'single') return 'single';
    return Array.isArray(args.files) ? 'multiple' : 'single';
}

function getStoragePutFiles(args: Record<string, unknown>) {
    if (Array.isArray(args.files)) return args.files;
    if (Array.isArray(args.file)) return args.file;
    return [];
}

function getStoragePutFolder(args: Record<string, unknown>) {
    return getPath(args.folder).trim().replace(/^\/+|\/+$/g, '');
}

function getBulkFileValue(value: unknown) {
    if (value instanceof Blob) return value;
    if (!isPlainObject(value)) return value;
    return value.file ?? value.content ?? value.body;
}

function getFileName(value: unknown, index: number) {
    const file = getBulkFileValue(value);
    const fileName = (file as Blob & { name?: string })?.name;

    if (file instanceof Blob && typeof fileName === 'string' && fileName.trim()) {
        return fileName;
    }
    if (isPlainObject(value) && typeof value.name === 'string' && value.name.trim()) return value.name;
    return `file-${index + 1}`;
}

function getBulkFilePath(value: unknown, index: number, folder = '') {
    if (isPlainObject(value) && typeof value.path === 'string' && value.path.trim()) return value.path;
    return [folder, getFileName(value, index)].filter(Boolean).join('/');
}

function getActionStorageEnv(context: ActionContext): StorageEnv {
    if (process.env.ENV !== 'editor') return 'current';
    return context?.honoContext?.req?.header('ww-editor-test') === 'true' ? 'editor' : 'current';
}

async function runStorageGet(args: Record<string, unknown>, context: ActionContext) {
    const env = getActionStorageEnv(context);
    const access = getAccess(args.access);
    const path = getPath(args.path);
    const disk = storageCore.getDisk(access, env);
    const [bytes, metadata] = await Promise.all([storageCore.getBytes(access, path, env), disk.getMetaData(path)]);
    const contentType = metadata.contentType || 'application/octet-stream';
    return bytesToDataURI(bytes, contentType);
}

async function runStoragePut(args: Record<string, unknown>, context: ActionContext) {
    if (getStoragePutMode(args) === 'multiple') return await runStoragePutMultiple(args, context);

    const env = getActionStorageEnv(context);
    return await storageCore.put(
        getAccess(args.access),
        sanitizeStoragePath(getPath(args.path)),
        await getPutData(args.file),
        normalizeOptions(args),
        env
    );
}

async function runStoragePutMultiple(args: Record<string, unknown>, context: ActionContext) {
    const env = getActionStorageEnv(context);
    const access = getAccess(args.access);
    const files = getStoragePutFiles(args);
    const folder = getStoragePutFolder(args);
    const uploaded: unknown[] = [];
    const failed: { index: number; path: string; message: string }[] = [];

    for (const [index, input] of files.entries()) {
        const file = getBulkFileValue(input);
        const path = sanitizeStoragePath(getBulkFilePath(input, index, folder));
        try {
            const options = normalizeOptions({
                ...args,
                ...(isPlainObject(input) ? input : {}),
                file,
            });
            const result = await storageCore.put(access, path, await getPutData(file), options, env);
            uploaded.push(result);
        } catch (error) {
            failed.push({
                index,
                path,
                message: String((error as Error)?.message || error),
            });
        }
    }

    return { uploaded, failed };
}

async function runStorageGetSignedUrl(args: Record<string, unknown>, context: ActionContext) {
    const env = getActionStorageEnv(context);
    return await storageCore.getSignedUrl(getAccess(args.access), getPath(args.path), normalizeOptions(args), env);
}

async function runStorageGetSignedUploadUrl(args: Record<string, unknown>, context: ActionContext) {
    const env = getActionStorageEnv(context);
    return await storageCore.getSignedUploadUrl(
        getAccess(args.access),
        sanitizeStoragePath(getPath(args.path)),
        normalizeOptions(args),
        env
    );
}

async function runStorageCopy(args: Record<string, unknown>, context: ActionContext) {
    const env = getActionStorageEnv(context);
    return await storageCore.copy(
        getAccess(args.access),
        getSourcePath(args),
        getDestinationPath(args),
        normalizeOptions(args),
        env
    );
}

async function runStorageMove(args: Record<string, unknown>, context: ActionContext) {
    const env = getActionStorageEnv(context);
    return await storageCore.move(
        getAccess(args.access),
        getSourcePath(args),
        getDestinationPath(args),
        normalizeOptions(args),
        env
    );
}

async function runStorageDelete(args: Record<string, unknown>, context: ActionContext) {
    const env = getActionStorageEnv(context);
    const access = getAccess(args.access);
    const paths = Array.isArray(args.paths) && args.paths.every(path => typeof path === 'string') ? args.paths : [];

    const deleted: string[] = [];
    const failed: { path: string; message: string }[] = [];
    for (const path of paths) {
        try {
            await storageCore.delete(access, path, env);
            deleted.push(path);
        } catch (error) {
            failed.push({ path, message: String(error?.message || error) });
        }
    }

    return { deleted, failed };
}

global.registerAction(
    'storage-get',
    async ({ args = {} }: ActionParams, context: ActionContext) => await runStorageGet(args, context)
);
global.registerAction(
    'storage-put',
    async ({ args = {} }: ActionParams, context: ActionContext) => await runStoragePut(args, context)
);
global.registerAction(
    'storage-get-signed-url',
    async ({ args = {} }: ActionParams, context: ActionContext) => await runStorageGetSignedUrl(args, context)
);
global.registerAction(
    'storage-get-signed-upload-url',
    async ({ args = {} }: ActionParams, context: ActionContext) => await runStorageGetSignedUploadUrl(args, context)
);
global.registerAction(
    'storage-copy',
    async ({ args = {} }: ActionParams, context: ActionContext) => await runStorageCopy(args, context)
);
global.registerAction(
    'storage-move',
    async ({ args = {} }: ActionParams, context: ActionContext) => await runStorageMove(args, context)
);
global.registerAction(
    'storage-delete',
    async ({ args = {} }: ActionParams, context: ActionContext) => await runStorageDelete(args, context)
);
