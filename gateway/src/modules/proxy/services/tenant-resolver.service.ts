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

export interface ResolvedActiveTenant {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

interface AuthActiveTenantsResponse {
  readonly success: boolean;
  readonly data: ResolvedActiveTenant[];
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
      audience: this.configService.getOrThrow<string>(
        'internalJwt.authAudience',
      ),
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

    let data: AuthTenantResponse;

    try {
      data = (await response.json()) as AuthTenantResponse;
    } catch {
      throw new ServiceUnavailableException(
        'Invalid tenant response from Auth service.',
      );
    }

    if (
      typeof data.id !== 'string' ||
      data.id.trim().length === 0 ||
      data.status !== 'ACTIVE'
    ) {
      throw new ServiceUnavailableException(
        'Invalid tenant response from Auth service.',
      );
    }

    return {
      tenantId: data.id,
      status: data.status,
    };
  }
  async resolveActiveTenants(): Promise<ResolvedActiveTenant[]> {
    const internalToken = this.internalJwtService.signServiceToken(
      this.internalJwtOptions,
    );

    const url = `${this.authServiceUrl}/api/tenants/active`;

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

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Unable to resolve active tenants.',
      );
    }

    let result: AuthActiveTenantsResponse;

    try {
      result = (await response.json()) as AuthActiveTenantsResponse;
    } catch {
      throw new ServiceUnavailableException(
        'Invalid active tenants response from Auth service.',
      );
    }

    if (
      result.success !== true ||
      !Array.isArray(result.data) ||
      !result.data.every(
        (tenant) =>
          typeof tenant.id === 'string' &&
          tenant.id.length > 0 &&
          typeof tenant.name === 'string' &&
          typeof tenant.slug === 'string',
      )
    ) {
      throw new ServiceUnavailableException(
        'Invalid active tenants response from Auth service.',
      );
    }

    return result.data;
  }
}
