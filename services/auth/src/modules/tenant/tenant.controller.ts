import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  InternalAuthScope,
  InternalJwtGuard,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type AuthenticatedRequest,
  type InternalAuthenticatedRequest,
} from '@petoman/security';

import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';

import { PERMISSION_SLUGS } from '../../common/constants/permissions.constants';
import { UpdateTenantDto } from './dtos/update-tenant.dto';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @UseGuards(InternalJwtGuard)
  @Post()
  createTenant(
    @Body() dto: CreateTenantDto,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const userId = request.internalAuth?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.tenantService.createTenant(userId, dto);
  }

  @UseGuards(InternalJwtGuard)
  @Get('active')
  async findActiveTenants(@Req() request: InternalAuthenticatedRequest) {
    const auth = request.internalAuth;

    if (
      auth?.scope !== InternalAuthScope.GLOBAL ||
      auth.userId !== undefined ||
      auth.tenantId !== undefined ||
      auth.sid !== undefined ||
      auth.roles !== undefined ||
      auth.permissions !== undefined
    ) {
      throw new ForbiddenException({
        message: 'A global service token is required.',
      });
    }

    return {
      success: true,
      data: await this.tenantService.findActiveTenants(),
    };
  }

  @UseGuards(InternalJwtGuard)
  @Get(':tenantId')
  getTenant(
    @Param('tenantId') tenantId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.tenantService.getTenant(requester, tenantId);
  }

  @UseGuards(InternalJwtGuard)
  @Patch(':tenantId')
  updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.tenantService.updateTenant(requester, tenantId, dto);
  }

  @UseGuards(InternalJwtGuard)
  @Get(':tenantId/memberships')
  getTenantMemberships(
    @Param('tenantId') tenantId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.tenantService.getTenantMemberships(requester, tenantId);
  }

  @UseGuards(InternalJwtGuard)
  @Get('/by-slug/:storeSlug')
  async findBySlug(@Param('storeSlug') storeSlug: string) {
    const tenant = await this.tenantService.findBySlug(storeSlug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    return {
      id: tenant.id,
      status: tenant.status,
    };
  }
}
