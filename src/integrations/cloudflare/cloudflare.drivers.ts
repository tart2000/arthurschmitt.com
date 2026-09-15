import { S3Driver } from 'flydrive/drivers/s3';
import { registerStorageDriver } from '../../services/storageDriverRegistry.service.ts';

registerStorageDriver(
    'cloudflare',
    (visibility: 'public' | 'private', connection: ConnectionConfig, runtimeConfig: StorageRuntimeConfig) =>
        new S3Driver({
            credentials: {
                accountId: connection?.accountId,
                accessKeyId: connection?.accessKeyId,
                secretAccessKey: connection?.secretAccessKey,
            },
            endpoint: 'https://jg21.r2.cloudflarestorage.com',
            bucket: visibility === 'private' ? runtimeConfig?.privateBucket : runtimeConfig?.publicBucket,
            visibility,
            supportsACL: false,
        })
);
