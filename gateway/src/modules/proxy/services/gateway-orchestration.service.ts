import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthenticatedRequest } from '@petoman/security';

import { ProductOrchestrationService } from './product-orchestration.service';

export interface GatewayOrchestrationContext {
  readonly request: AuthenticatedRequest;
  readonly params: Record<string, string>;
}

@Injectable()
export class GatewayOrchestrationService {
  constructor(
    private readonly productOrchestrationService: ProductOrchestrationService,
  ) {}

  async execute(
    handler: string,
    context: GatewayOrchestrationContext,
  ): Promise<unknown> {
    switch (handler) {
      case 'market.products.create':
        return this.productOrchestrationService.create({
          request: context.request,
          params: context.params,
        });

      case 'market.products.update':
        return this.productOrchestrationService.update({
          request: context.request,
          params: context.params,
        });

      case 'market.products.list':
        return this.productOrchestrationService.findAll({
          request: context.request,
          params: context.params,
        });

      case 'market.products.findById':
        return this.productOrchestrationService.findById({
          request: context.request,
          params: context.params,
        });

      case 'market.products.public.list':
        return this.productOrchestrationService.findPublicByStoreSlug({
          request: context.request,
          params: context.params,
        });

      default:
        throw new NotFoundException(
          `Orchestration handler "${handler}" was not found.`,
        );
    }
  }
}
