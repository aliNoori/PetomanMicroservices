import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ProxyController } from './controllers/proxy.controller';
import { ProxyService } from './services/proxy.service';
import { RouteResolverService } from './services/route-resolver.service';
import { ProxyHeaderService } from './services/proxy-header.service';
import { JwtConfigModule } from '../../common/security/jwt.config.module';
import { InternalJwtService, JwtSecurityModule } from '@petoman/security';
import { GatewayDispatcherService } from './services/gateway-dispatcher.service';
import { AggregationService } from './services/aggregation.service';
import { GatewayRouteRegistry } from './routing/registry/gateway-route.registry';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';
import { TenantResolverService } from './services/tenant-resolver.service';
import { GatewayDownstreamAuthService } from '../../common/authentication/gateway-downstream-auth.service';
import { GatewayAuthorizationService } from '../../common/authorization/gateway-authorization.service';

@Module({
  imports: [HttpModule, JwtConfigModule, JwtSecurityModule],

  controllers: [ProxyController],

  providers: [
    ProxyService,
    RouteResolverService,
    ProxyHeaderService,
    GatewayDispatcherService,
    AggregationService,
    GatewayRouteRegistry,
    GatewayAuthGuard,
    TenantResolverService,
    InternalJwtService,
    GatewayDownstreamAuthService,
    GatewayAuthorizationService,
  ],
})
export class ProxyModule {}
