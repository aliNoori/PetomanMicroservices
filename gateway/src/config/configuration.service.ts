import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  SERVICE_NAMES,
  ServiceName,
} from '../modules/proxy/constants/service-route.constants';
import { ServiceRoute } from '../modules/proxy/interfaces/service-route.interface';
import { ServiceConfig, ServicesConfig } from './services.config';

export interface InternalJwtConfig {
  readonly secret: string;
  readonly issuer: string;
  readonly authAudience: string;
  readonly marketAudience: string;
  readonly expiresInSeconds: number;
}

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.getOrThrow<number>('app.port');
  }

  get environment(): string {
    return this.configService.getOrThrow<string>('app.environment');
  }

  getServiceRoute(service: ServiceName): ServiceRoute {
    const config = this.getServiceConfig(service);

    return {
      name: service,
      prefix: config.prefix,
      baseUrl: config.url,
      timeoutMs: config.timeoutMs,
    };
  }

  getServiceRoutes(): ServiceRoute[] {
    const services = this.configService.getOrThrow<ServicesConfig>('services');

    return Object.entries(services).map(([name, config]) => ({
      name,
      prefix: config.prefix,
      baseUrl: config.url,
      timeoutMs: config.timeoutMs,
    }));
  }

  private getServiceConfig(service: ServiceName): ServiceConfig {
    const configKey: Record<ServiceName, keyof ServicesConfig> = {
      [SERVICE_NAMES.AUTH]: 'auth',
      [SERVICE_NAMES.FINANCIAL]: 'financial',
      [SERVICE_NAMES.VET]: 'vet',
      [SERVICE_NAMES.MARKET]: 'market',
      [SERVICE_NAMES.PHARMACY]: 'pharmacy',
    };

    return this.configService.getOrThrow<ServiceConfig>(
      `services.${configKey[service]}`,
    );
  }

  get internalJwt(): InternalJwtConfig {
    return {
      secret: this.configService.getOrThrow<string>('internalJwt.secret'),
      issuer: this.configService.getOrThrow<string>('internalJwt.issuer'),
      authAudience: this.configService.getOrThrow<string>(
        'internalJwt.authAudience',
      ),
      marketAudience: this.configService.getOrThrow<string>(
        'internalJwt.marketAudience',
      ),
      expiresInSeconds: this.configService.getOrThrow<number>(
        'internalJwt.expiresInSeconds',
      ),
    };
  }
}