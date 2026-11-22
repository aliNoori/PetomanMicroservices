
import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  InternalJwtService,
  type InternalJwtOptions,
} from '@petoman/security';

interface ValidateTenantContextResponse {
  readonly success: boolean;
  readonly data?: {
    readonly valid: boolean;
  };
}

@Injectable()
export class TenantContextValidatorService {
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

  async validate(userId: string, tenantId: string): Promise<void> {
    const internalToken = this.internalJwtService.signServiceToken(
      this.internalJwtOptions,
    );

    const url = `${this.authServiceUrl}/api/tenants/validate-context`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internalToken}`,
        },
        body: JSON.stringify({ userId, tenantId }),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Auth service is unavailable.',
      );
    }

    if (response.status === 403 || response.status === 404) {
      throw new ForbiddenException(
        'The tenant context is no longer valid.',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Unable to validate tenant context.',
      );
    }

    let result: ValidateTenantContextResponse;

    try {
      result = (await response.json()) as ValidateTenantContextResponse;
    } catch {
      throw new ServiceUnavailableException(
        'Invalid tenant context response from Auth service.',
      );
    }

    if (result.success !== true || result.data?.valid !== true) {
      throw new ServiceUnavailableException(
        'Auth service returned an invalid tenant context response.',
      );
    }
  }
}
