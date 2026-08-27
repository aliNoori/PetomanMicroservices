import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type AuthenticatedRequest,
} from '@petoman/security';

import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';

import { PERMISSION_SLUGS } from '../../common/constants/permissions.constants';
import { UpdateTenantDto } from './dtos/update-tenant.dto';

@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ============================================================
  // Create Tenant
  // ============================================================

  @Post()
  createTenant(
    @Body() dto: CreateTenantDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        message: 'Authenticated user context is missing.',
      });
    }

    return this.tenantService.createTenant(user.sub, dto);
  }

  // ============================================================
  // Get Tenant
  // ============================================================

  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSION_SLUGS.TENANT_READ)
  @Get(':tenantId')
  getTenant(@Param('tenantId') tenantId: string) {
    return this.tenantService.getTenant(tenantId);
  }

  // ============================================================
  // Update Tenant
  // ============================================================

  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSION_SLUGS.TENANT_UPDATE)
  @Patch(':tenantId')
  updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.updateTenant(tenantId, dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(PERMISSION_SLUGS.TENANT_MEMBERSHIP_READ)
  @Get(':tenantId/memberships')
  getTenantMemberships(
    @Param('tenantId') tenantId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.tenantService.getTenantMemberships(request.user, tenantId);
  }
}
