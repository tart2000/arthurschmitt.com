import { S3Driver } from 'flydrive/drivers/s3';
import { registerStorageDriver } from '../../services/storageDriverRegistry.service.ts';

registerStorageDriver(
    'aws-s3',
    (visibility, connection, runtimeConfig) =>
        new S3Driver({
            credentials: {
                accessKeyId: connection?.accessKeyId,
                secretAccessKey: connection?.secretAccessKey,
            },
            region: connection?.region,
            bucket: visibility === 'private' ? runtimeConfig?.privateBucket : runtimeConfig?.publicBucket,
            visibility,
            supportsACL: false,
        })
);
