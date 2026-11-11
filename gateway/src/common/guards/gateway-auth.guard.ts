import { Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '@petoman/security';

import { GatewayAuthenticationService } from '../../modules/proxy/services/gateway-authentication.service';

@Injectable()
export class GatewayAuthGuard {
  constructor(
    private readonly authenticationService: GatewayAuthenticationService,
  ) {}

  async authenticate(request: AuthenticatedRequest): Promise<void> {
    await this.authenticationService.authenticate(request);
  }
}