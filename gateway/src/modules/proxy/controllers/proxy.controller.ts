import { All, Controller, Req, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequest } from '@petoman/security';

import { JwtAuthGuard } from '@petoman/security';

import { GatewayDispatcherService } from '../services/gateway-dispatcher.service';
import { GatewayAuthGuard } from '../../../common/guards/gateway-auth.guard';

/**
 * Main API Gateway controller.
 *
 * The controller intentionally contains no route-specific business logic.
 *
 * All incoming API requests are delegated to the central Dispatcher,
 * which resolves the route and selects the appropriate execution strategy.
 */
@Controller('api')
//@UseGuards(GatewayAuthGuard)
export class ProxyController {
  constructor(private readonly gatewayDispatcher: GatewayDispatcherService) {}

  /**
   * Central entry point for all API Gateway requests.
   *
   * The controller does not know whether the request is:
   *
   * - a normal proxy request
   * - a parameterized proxy request
   * - an aggregation request
   *
   * Route resolution and execution are handled centrally.
   */
  @All('{*path}')
  async handle(@Req() request: AuthenticatedRequest): Promise<unknown> {

    return this.gatewayDispatcher.dispatch(request);
  }
}
