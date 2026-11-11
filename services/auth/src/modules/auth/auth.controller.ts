import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Req,
  ParseUUIDPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import {
  InternalJwtGuard,
  type AuthenticatedRequest,
  type InternalAuthenticatedRequest,
} from '@petoman/security';

import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ResendVerificationEmailDto } from './dtos/resend-verification-email.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

import { RegisterUserDto } from './dtos/register-user-dto';
import { LoginDto } from './dtos/login.dto';
import { SelectTenantDto } from './dtos/select-tenant.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';

import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';
import { RejectTenantDto } from './dtos/reject-tenant.dto';

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
  // Verify Email
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Post('email-verification/verify')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  // ============================================================
  // Resend Email Verification
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Post('email-verification/resend')
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  // ============================================================
  // Login
  // ============================================================
  @UseGuards(InternalJwtGuard)
  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: InternalAuthenticatedRequest) {
    return this.authService.login(dto, request.headers['user-agent'] ?? null);
  }

  // ============================================================
  // Change Password
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Patch('change-password')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const userId = request.internalAuth?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.changePassword(userId, dto);
  }

  // ============================================================
  // Refresh Token
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
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

    return this.authService.selectTenant(
      userId,
      dto.tenantId,
      dto.refresh_token,
    );
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
  // Session Management
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Get('sessions')
  getSessions(@Req() request: InternalAuthenticatedRequest) {
    const userId = request.internalAuth?.userId;
    const sessionId = request.internalAuth?.sid;

    if (!userId || !sessionId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user and session context are required.',
      });
    }

    return this.authService.getSessions(userId, sessionId);
  }

  @UseGuards(InternalJwtGuard)
  @Delete('sessions/:sessionId')
  revokeSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const userId = request.internalAuth?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.revokeSession(userId, sessionId);
  }

  @UseGuards(InternalJwtGuard)
  @Delete('sessions/:sessionId/history')
  deleteSessionHistory(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const userId = request.internalAuth?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.deleteSessionHistory(userId, sessionId);
  }

  // ============================================================
  // Logout
  // ============================================================

  @UseGuards(InternalJwtGuard)
  @Post('logout')
  logout(@Req() request: InternalAuthenticatedRequest) {
    const userId = request.internalAuth?.userId;
    const sessionId = request.internalAuth?.sid;

    if (!userId || !sessionId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user and session context are required.',
      });
    }

    return this.authService.revokeSession(userId, sessionId);
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
  // Reject Tenant
  // ============================================================

  /**
   * SUPER_ADMIN only.
   *
   * Permission:
   *   tenant.approve
   *
   * Tenant:
   *   PENDING -> REJECTED
   *
   * Rejection reason is stored for future reference.
   */
  @UseGuards(InternalJwtGuard)
  @Post('tenants/:tenantId/reject')
  rejectTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: RejectTenantDto,
    @Req() request: InternalAuthenticatedRequest,
  ) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.rejectTenant(requester, tenantId, dto.reason);
  }

  // ============================================================
  // Get Pending Tenants
  // ============================================================

  /**
   * SUPER_ADMIN only.
   *
   * Permission:
   *   tenant.approve
   *
   * Returns tenants waiting for administrative approval.
   */
  @UseGuards(InternalJwtGuard)
  @Get('tenants/pending')
  getPendingTenants(@Req() request: InternalAuthenticatedRequest) {
    const requester = request.internalAuth;

    if (!requester?.userId) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.UNAUTHORIZED,
        message: 'Authenticated user identity is missing.',
      });
    }

    return this.authService.getPendingTenants(requester);
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
