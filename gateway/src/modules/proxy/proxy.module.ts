import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ProxyController } from './controllers/proxy.controller';
import { ProxyService } from './services/proxy.service';
import { RouteResolverService } from './services/route-resolver.service';
import { ProxyHeaderService } from './services/proxy-header.service';
import { JwtConfigModule } from '../../common/security/jwt.config.module';
import { JwtSecurityModule } from '@petoman/security';
import { GatewayDispatcherService } from './services/gateway-dispatcher.service';
import { AggregationService } from './services/aggregation.service';
import { GatewayRouteRegistry } from './routing/registry/gateway-route.registry';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';

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
    GatewayAuthGuard
  ],
})
export class ProxyModule {}
