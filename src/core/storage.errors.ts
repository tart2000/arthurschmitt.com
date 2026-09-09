import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class StorageError extends Error {
    status: ContentfulStatusCode;
    code: string;

    constructor(message: string, code: string, status: ContentfulStatusCode) {
        super(message);
        this.name = new.target.name;
        this.code = code;
        this.status = status;
    }
}

export class StorageNotFoundError extends StorageError {
    constructor(message = 'File not found') {
        super(message, 'STORAGE_NOT_FOUND', 404);
    }
}

export class StorageConflictError extends StorageError {
    constructor(message = 'File already exists') {
        super(message, 'STORAGE_CONFLICT', 409);
    }
}

export class StorageUnsupportedOperationError extends StorageError {
    constructor(message = 'Overwrite move is not supported by the current storage driver') {
        super(message, 'STORAGE_UNSUPPORTED_OPERATION', 400);
    }
}
