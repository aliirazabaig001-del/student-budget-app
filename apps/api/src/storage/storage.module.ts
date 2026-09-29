import { Global, Module } from '@nestjs/common';
import { LocalDiskStorage } from './local-disk.storage';
import { StorageDriver } from './storage.driver';

/**
 * To switch storage backends later, bind `StorageDriver` to another
 * implementation here (e.g. chosen by a STORAGE_DRIVER env variable).
 */
@Global()
@Module({
  providers: [{ provide: StorageDriver, useClass: LocalDiskStorage }],
  exports: [StorageDriver],
})
export class StorageModule {}
