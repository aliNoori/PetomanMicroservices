import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  RequireRoles,
  RolesGuard,
  type AuthenticatedRequest,
} from '@petoman/security';

import { AuthService } from './auth.service';

import { RegisterUserDto } from './dtos/register-user-dto';
import { LoginDto } from './dtos/login.dto';
import { SelectTenantDto } from './dtos/select-tenant.dto';

import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';
import { ROLE_SLUGS } from '../../common/constants/roles.constants';
import { PERMISSION_SLUGS } from '../../common/constants/permissions.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================
  // Authentication Context
  // ============================================================

  private getAuthenticatedUser(request: AuthenticatedRequest) {
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user context is missing.',
      });
    }

    return user;
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    return this.getAuthenticatedUser(request).sub;
  }

  // ============================================================
  // Register
  // ============================================================

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  // ============================================================
  // Login
  // ============================================================

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ============================================================
  // Select Tenant
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Post('tenant/select')
  selectTenant(
    @Body() dto: SelectTenantDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.authService.selectTenant(userId, dto.tenantId);
  }

  // ============================================================
  // Profile
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);

    return {
      success: true as const,

      data: {
        user,
        userId: user.sub,
      },
    };
  }

  // ============================================================
  // Get User
  // ============================================================

  /**
   * Manager-only operation.
   *
   * SUPER_ADMIN:
   *   Global access.
   *
   * TENANT_ADMIN:
   *   Authorization is additionally scoped inside
   *   AuthService according to the current tenant.
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @RequireRoles(ROLE_SLUGS.SUPER_ADMIN, ROLE_SLUGS.TENANT_ADMIN)
  @RequirePermissions(PERMISSION_SLUGS.USER_READ)
  @Get('users/:userId')
  getUser(
    @Param('userId') userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const requester = this.getAuthenticatedUser(request);

    return this.authService.getUser(requester, userId);
  }

  // ============================================================
  // Request Tenant Membership
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @Post('tenants/:tenantId/memberships')
  requestTenantMembership(
    @Param('tenantId') tenantId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = this.getAuthenticatedUserId(request);

    return this.authService.requestTenantMembership(userId, tenantId);
  }

  // ============================================================
  // Approve Tenant
  // ============================================================

  /**
   * SUPER_ADMIN only.
   *
   * Permission:
   *   tenant.approve
   *
   * Tenant:
   *   PENDING -> ACTIVE
   *
   * Owner membership:
   *   none -> ACTIVE
   *
   * Owner role:
   *   none -> TENANT_ADMIN
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @RequireRoles(ROLE_SLUGS.SUPER_ADMIN)
  @RequirePermissions(PERMISSION_SLUGS.TENANT_APPROVE)
  @Post('tenants/:tenantId/approve')
  approveTenant(
    @Param('tenantId') tenantId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const requester = this.getAuthenticatedUser(request);

    return this.authService.approveTenant(requester, tenantId);
  }

  // ============================================================
  // Approve Tenant Membership
  // ============================================================

  /**
   * Allowed roles:
   *
   * SUPER_ADMIN
   * TENANT_ADMIN
   *
   * Required permission:
   *
   * tenant.membership.approve
   *
   * Tenant scope for TENANT_ADMIN is enforced
   * inside AuthService.
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @RequireRoles(ROLE_SLUGS.SUPER_ADMIN, ROLE_SLUGS.TENANT_ADMIN)
  @RequirePermissions(PERMISSION_SLUGS.TENANT_MEMBERSHIP_APPROVE)
  @Post('tenant-memberships/:membershipId/approve')
  approveTenantMembership(
    @Param('membershipId') membershipId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const requester = this.getAuthenticatedUser(request);

    return this.authService.approveTenantMembership(requester, membershipId);
  }

  // ============================================================
  // Reject Tenant Membership
  // ============================================================

  /**
   * Allowed roles:
   *
   * SUPER_ADMIN
   * TENANT_ADMIN
   *
   * Required permission:
   *
   * tenant.membership.reject
   *
   * Tenant scope for TENANT_ADMIN is enforced
   * inside AuthService.
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @RequireRoles(ROLE_SLUGS.SUPER_ADMIN, ROLE_SLUGS.TENANT_ADMIN)
  @RequirePermissions(PERMISSION_SLUGS.TENANT_MEMBERSHIP_REJECT)
  @Post('tenant-memberships/:membershipId/reject')
  rejectTenantMembership(
    @Param('membershipId') membershipId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const requester = this.getAuthenticatedUser(request);

    return this.authService.rejectTenantMembership(requester, membershipId);
  }
}
