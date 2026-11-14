
import {
  DynamicModule,
  Global,
  Module,
  type FactoryProvider,
  type ModuleMetadata,
} from '@nestjs/common';

import { STORAGE_OPTIONS, STORAGE_PROVIDER } from './storage.constants';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { StorageService } from './storage.service';

import type { StorageModuleOptions } from './storage.interfaces';

export interface StorageModuleAsyncOptions<
  TDependencies extends unknown[] = [],
> extends Pick<ModuleMetadata, 'imports'> {
  inject?: FactoryProvider<StorageModuleOptions>['inject'];

  useFactory: (
    ...args: TDependencies
  ) => StorageModuleOptions | Promise<StorageModuleOptions>;
}

@Global()
@Module({})
export class StorageModule {
  static forRootAsync<TDependencies extends unknown[]>(
    options: StorageModuleAsyncOptions<TDependencies>,
  ): DynamicModule {
    return {
      module: StorageModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: STORAGE_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        {
          provide: STORAGE_PROVIDER,
          inject: [STORAGE_OPTIONS],
          useFactory: (storageOptions: StorageModuleOptions) => {
            switch (storageOptions.driver) {
              case 'local':
                return new LocalStorageProvider(storageOptions);

              case 's3':
                return new S3StorageProvider(storageOptions);

              default: {
                const unsupportedDriver: never = storageOptions;
                throw new Error(
                  `Unsupported storage driver: ${JSON.stringify(unsupportedDriver)}`,
                );
              }
            }
          },
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}
