import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { LocalDiskStorage } from './local-disk.storage';
import { StorageDriver } from './storage.driver';

/**
 * Binds `StorageDriver` to the backend chosen by STORAGE_DRIVER. An
 * S3-compatible driver (AWS S3, MinIO, Backblaze, Wasabi…) can be added as
 * another case here without touching any feature module.
 */
@Global()
@Module({
  providers: [
    {
      provide: StorageDriver,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): StorageDriver => {
        switch (config.get('STORAGE_DRIVER')) {
          case 'local':
            return new LocalDiskStorage(config);
        }
      },
    },
  ],
  exports: [StorageDriver],
})
export class StorageModule {}
