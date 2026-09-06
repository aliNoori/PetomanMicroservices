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
  InternalJwtGuard,
  type AuthenticatedRequest,
  type InternalAuthenticatedRequest,
} from '@petoman/security';

import { AuthService } from './auth.service';

import { RegisterUserDto } from './dtos/register-user-dto';
import { LoginDto } from './dtos/login.dto';
import { SelectTenantDto } from './dtos/select-tenant.dto';

import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';

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
  @UseGuards(InternalJwtGuard)
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  // ============================================================
  // Login
  // ============================================================
  @UseGuards(InternalJwtGuard)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ============================================================
  // Select Tenant
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Post('tenant/select')
  selectTenant(
    @Body() dto: SelectTenantDto,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const userId = request.internalAuth?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.selectTenant(userId, dto.tenantId);
  }

  // ============================================================
  // Profile
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Get('profile')
  profile(@Req() request: InternalAuthenticatedRequest) {
    const userId = request.internalAuth?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.getProfile(userId);
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
  @UseGuards(InternalJwtGuard)
  @Get('users/:userId')
  getUser(
    @Param('userId') userId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.getUser(requester, userId);
  }

  // ============================================================
  // Request Tenant Membership
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Post('tenants/:tenantId/memberships')
  requestTenantMembership(
    @Param('tenantId') tenantId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const userId = request.internalAuth?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

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
  @UseGuards(InternalJwtGuard)
  @Post('tenants/:tenantId/approve')
  approveTenant(
    @Param('tenantId') tenantId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

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
  @UseGuards(InternalJwtGuard)
  @Post('tenant-memberships/:membershipId/approve')
  approveTenantMembership(
    @Param('membershipId') membershipId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

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
  @UseGuards(InternalJwtGuard)
  @Post('tenant-memberships/:membershipId/reject')
  rejectTenantMembership(
    @Param('membershipId') membershipId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.rejectTenantMembership(requester, membershipId);
  }
}
