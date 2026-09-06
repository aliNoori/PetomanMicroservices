import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InternalJwtService, type InternalJwtOptions } from '@petoman/security';

export interface ResolvedTenant {
  readonly tenantId: string;
  readonly status: string;
}

interface AuthTenantResponse {
  readonly id: string;
  readonly status: string;
}

@Injectable()
export class TenantResolverService {
  private readonly authServiceUrl: string;
  private readonly internalJwtOptions: InternalJwtOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly internalJwtService: InternalJwtService,
  ) {
    this.authServiceUrl =
      this.configService.getOrThrow<string>('services.auth.url');

    this.internalJwtOptions = {
      secret: this.configService.getOrThrow<string>('internalJwt.secret'),
      issuer: this.configService.getOrThrow<string>('internalJwt.issuer'),
      audience: this.configService.getOrThrow<string>('internalJwt.authAudience'),
      expiresInSeconds: this.configService.getOrThrow<number>(
        'internalJwt.expiresInSeconds',
      ),
    };
  }

  async resolveBySlug(storeSlug: string): Promise<ResolvedTenant> {
    const internalToken = this.internalJwtService.signServiceToken(
      this.internalJwtOptions,
    );

    const url =
      `${this.authServiceUrl}/api/tenants/by-slug/` +
      encodeURIComponent(storeSlug);

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${internalToken}`,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Auth service is unavailable.');
    }

    if (response.status === 404) {
      throw new NotFoundException('Tenant not found.');
    }

    if (!response.ok) {
      const errorBody = await response.text();

      console.error('AUTH TENANT RESOLUTION ERROR:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });

      throw new ServiceUnavailableException('Unable to resolve tenant.');
    }

    const data = (await response.json()) as AuthTenantResponse;

    if (typeof data.id !== 'string' || typeof data.status !== 'string') {
      throw new ServiceUnavailableException(
        'Invalid tenant response from Auth service.',
      );
    }

    return {
      tenantId: data.id,
      status: data.status,
    };
  }
}
