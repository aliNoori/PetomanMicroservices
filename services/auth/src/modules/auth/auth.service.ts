import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { EmailVerificationTokenRepository } from './repositories/email-verification-token.repository';
import { EmailVerificationTokenEntity } from './entities/email-verification-token.entity';
import { MailService } from '@petoman/infrastructure';
import { ConfigurationService } from '../../config/configuration.service';
import { UserAvatarService } from './user-avatar.service';

import {
  InternalAuthScope,
  InternalJwtPayload,
  JwtPayload,
  JwtTokenService,
} from '@petoman/security';

import { MEMBERSHIP_STATUS } from '../../common/constants/membership.constants';
import { TENANT_STATUS } from '../../common/constants/tenant.constants';
import { AUTH_ERROR_CODES } from '../../common/constants/auth-error-codes.constants';
import { ROLE_SLUGS } from '../../common/constants/roles.constants';

import { UserEntity } from './entities/user.entity';
import { TenantEntity } from './entities/tenant.entity';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RoleEntity } from './entities/role.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

import { RegisterUserDto } from './dtos/register-user-dto';
import { LoginDto } from './dtos/login.dto';
import { DeviceInfoService } from './device-info.service';
import { RedisService } from '@petoman/infrastructure';
import { ChangePasswordDto } from './dtos/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly deviceInfoService: DeviceInfoService,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly configurationService: ConfigurationService,
    private readonly userAvatarService: UserAvatarService,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,

    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,

    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,

    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,

    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  // ============================================================
  // Register
  // ============================================================

  private readonly logger = new Logger(AuthService.name);

  async register(
    dto: RegisterUserDto,
    file?: { buffer: Buffer; size: number },
  ) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'A user with this email already exists.',
      });
    }

    // Hash the password before starting the database transaction.
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate a cryptographically secure verification token.
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Create the user and verification token atomically.
    const savedUser = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);

      const newUser = userRepository.create({
        email,
        passwordHash,
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        isActive: true,
        isEmailVerified: false,
        emailVerifiedAt: null,
      });

      const user = await userRepository.save(newUser);

      await this.emailVerificationTokenRepository.create(
        {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
        manager,
      );

      return user;
    });

    // Upload the optional avatar after the user transaction commits.
    if (file) {
      let avatarKey: string | null = null;

      try {
        avatarKey = await this.userAvatarService.uploadAvatar(
          savedUser.id,
          file,
        );

        savedUser.avatarKey = avatarKey;
        await this.userRepository.save(savedUser);
      } catch (error: unknown) {
        if (avatarKey) {
          try {
            await this.userAvatarService.deleteAvatar(avatarKey);
          } catch {
            this.logger.error(
              'Failed to clean up avatar after registration failure.',
            );
          }
        }

        throw error;
      }
    }

    // Build the verification link after the transaction commits.
    const verificationUrl = new URL(
      this.configurationService.mail.verificationUrl,
    );

    verificationUrl.searchParams.set('token', rawToken);

    // Send the verification email outside the database transaction.
    try {
      await this.mailService.send({
        from: this.configurationService.mail.from,
        to: savedUser.email,
        subject: 'Verify your email address',
        text: [
          'Hello,',
          '',
          'Please verify your email address using the following link:',
          verificationUrl.toString(),
          '',
          'This link expires in 30 minutes.',
        ].join('\n'),
        html: `
        <div>
          <h2>Verify your email address</h2>
          <p>Hello,</p>
          <p>Please click the following link to verify your email address:</p>
          <p>
            <a href="${verificationUrl.toString()}">
              Verify Email Address
            </a>
          </p>
          <p>This link expires in 30 minutes.</p>
        </div>
      `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${savedUser.email}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new ServiceUnavailableException({
        code: 'EMAIL_DELIVERY_FAILED',
        message:
          'Your account was created, but the verification email could not be sent. Please request a new verification email.',
      });
    }

    return {
      id: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      isActive: savedUser.isActive,
      isEmailVerified: savedUser.isEmailVerified,
      avatarUrl: await this.userAvatarService.getAvatarUrl(savedUser.avatarKey),
      tenantMemberships: [],
    };
  }

  // ============================================================
  // Login
  // ============================================================

  async login(dto: LoginDto, userAgent: string | null) {
    const email = dto.email.trim().toLowerCase();

    // Resolve the user ID before entering the transaction.
    const userReference = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
      },
    });

    if (!userReference) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        message: 'Invalid email or password.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      // Serialize login with password changes and other token issuance.
      await this.acquireUserSecurityLock(manager, userReference.id);

      const userRepository = manager.getRepository(UserEntity);
      const tenantUserRepository = manager.getRepository(TenantUserEntity);
      const userRoleRepository = manager.getRepository(UserRoleEntity);
      const refreshTokenRepository = manager.getRepository(RefreshTokenEntity);

      // Re-read the user after acquiring the security lock.
      const user = await userRepository.findOne({
        where: { id: userReference.id },
      });

      if (!user) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password.',
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.USER_INACTIVE,
          message: 'User account is inactive.',
        });
      }

      // Validate against the latest password hash.
      const passwordMatches = await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );

      if (!passwordMatches) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password.',
        });
      }

      if (!user.isEmailVerified) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED,
          message: 'Please verify your email address before signing in.',
        });
      }

      const memberships = await tenantUserRepository.find({
        where: {
          userId: user.id,
          status: MEMBERSHIP_STATUS.ACTIVE,
        },
        relations: {
          tenant: true,
        },
        order: {
          createdAt: 'ASC',
        },
      });

      const activeMemberships = memberships.filter(
        (membership) => membership.tenant.status === TENANT_STATUS.ACTIVE,
      );

      const systemUserRoles = await userRoleRepository.find({
        where: {
          userId: user.id,
          tenantId: IsNull(),
        },
        relations: {
          role: true,
        },
      });

      const systemRoles = systemUserRoles
        .filter((userRole) => userRole.role.isSystem === true)
        .map((userRole) => userRole.role.slug);

      const systemRoleIds = systemUserRoles
        .filter((userRole) => userRole.role.isSystem === true)
        .map((userRole) => userRole.roleId);

      const systemPermissions = await this.resolvePermissions(systemRoleIds);

      // Generate a cryptographically secure opaque refresh token.
      const refreshToken = randomBytes(64).toString('base64url');

      // Store only the token hash, never the raw refresh token.
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      const familyId = randomUUID();

      const deviceInfo = this.deviceInfoService.parse(userAgent);

      const payload: JwtPayload = {
        sub: user.id,
        sid: familyId,
        tenantId: null,
        email: user.email,
        roles: systemRoles,
        permissions: systemPermissions,
      };

      const accessToken = this.jwtTokenService.sign(payload);

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const refreshTokenRecord = refreshTokenRepository.create({
        userId: user.id,
        familyId,
        tokenHash,
        expiresAt,
        revokedAt: null,
        tenantId: null,
        ...deviceInfo,
      });

      await refreshTokenRepository.save(refreshTokenRecord);

      return {
        accessToken,
        refreshToken,
        tenants: activeMemberships.map((membership) => ({
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          type: membership.tenant.type,
        })),
      };
    });
  }

  async refresh(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const result = await this.dataSource.transaction(async (manager) => {
      const refreshTokenRepository = manager.getRepository(RefreshTokenEntity);

      // Find the token to identify its session family.
      const tokenReference = await refreshTokenRepository.findOne({
        where: {
          tokenHash,
        },
      });

      if (!tokenReference) {
        return {
          status: 'invalid' as const,
        };
      }

      // Serialize token refresh with password changes and login.
      await this.acquireUserSecurityLock(manager, tokenReference.userId);

      // Serialize refresh and revoke operations for this session.
      await this.acquireSessionLock(
        manager,
        tokenReference.userId,
        tokenReference.familyId,
      );

      // Check whether the session has already been revoked.
      // Redis failures must prevent token rotation.
      const isSessionRevoked = await this.redisService.exists(
        `auth:revoked-session:${tokenReference.familyId}`,
      );

      if (isSessionRevoked) {
        return {
          status: 'session_revoked' as const,
        };
      }

      // Re-read and lock the token after acquiring the session lock.
      const currentToken = await refreshTokenRepository.findOne({
        where: {
          tokenHash,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!currentToken) {
        return {
          status: 'invalid' as const,
        };
      }

      const now = new Date();

      // A previously revoked token indicates possible token reuse.
      // Revoke the entire token family and commit before returning an error.
      if (currentToken.revokedAt) {
        await this.revokeSessionFamily(
          manager,
          currentToken.userId,
          currentToken.familyId,
          now,
        );

        return {
          status: 'reuse_detected' as const,
        };
      }

      // Expired tokens cannot be used.
      if (currentToken.expiresAt.getTime() <= now.getTime()) {
        await this.revokeSessionFamily(
          manager,
          currentToken.userId,
          currentToken.familyId,
          now,
        );

        return {
          status: 'expired' as const,
        };
      }

      const userRepository = manager.getRepository(UserEntity);

      const user = await userRepository.findOne({
        where: {
          id: currentToken.userId,
        },
      });

      if (!user || !user.isActive) {
        await this.revokeSessionFamily(
          manager,
          currentToken.userId,
          currentToken.familyId,
          now,
        );

        return {
          status: 'inactive_user' as const,
        };
      }

      const tenantId = currentToken.tenantId;

      // Revalidate the selected tenant and membership.
      if (tenantId) {
        const membershipRepository = manager.getRepository(TenantUserEntity);

        const membership = await membershipRepository.findOne({
          where: {
            userId: user.id,
            tenantId,
            status: MEMBERSHIP_STATUS.ACTIVE,
          },
          relations: {
            tenant: true,
          },
        });

        if (!membership || membership.tenant.status !== TENANT_STATUS.ACTIVE) {
          await this.revokeSessionFamily(
            manager,
            currentToken.userId,
            currentToken.familyId,
            now,
          );

          return {
            status: 'invalid_tenant_context' as const,
          };
        }
      }

      // Rebuild roles for the current security context.
      const userRoleRepository = manager.getRepository(UserRoleEntity);

      const userRoles = await userRoleRepository.find({
        where: {
          userId: user.id,
        },
        relations: {
          role: true,
        },
      });

      const contextUserRoles = userRoles.filter((userRole) => {
        // System roles are globally available.
        if (userRole.tenantId === null) {
          return userRole.role.isSystem === true;
        }

        // Tenant roles are available only in their own tenant.
        return (
          tenantId !== null &&
          userRole.tenantId === tenantId &&
          userRole.role.isSystem === false
        );
      });

      const roles = contextUserRoles.map((userRole) => userRole.role.slug);

      const roleIds = contextUserRoles.map((userRole) => userRole.roleId);

      const permissions = await this.resolvePermissions(roleIds);

      const payload: JwtPayload = {
        sub: user.id,
        sid: currentToken.familyId,
        tenantId,
        email: user.email,
        roles,
        permissions,
      };

      const accessToken = this.jwtTokenService.sign(payload);

      // Generate a new opaque refresh token.
      const newRefreshToken = randomBytes(64).toString('base64url');

      const newTokenHash = createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Revoke the current token before creating its replacement.
      currentToken.revokedAt = now;

      await refreshTokenRepository.save(currentToken);

      // Keep the same family and tenant context during rotation.
      const newTokenRecord = refreshTokenRepository.create({
        userId: user.id,
        familyId: currentToken.familyId,
        tenantId,

        tokenHash: newTokenHash,
        expiresAt,
        revokedAt: null,

        device: currentToken.device,
        operatingSystem: currentToken.operatingSystem,
        browser: currentToken.browser,
        userAgent: currentToken.userAgent,
      });

      await refreshTokenRepository.save(newTokenRecord);

      return {
        status: 'success' as const,
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      };
    });

    // Errors are thrown outside the transaction so that
    // security-related revocations are not rolled back.
    switch (result.status) {
      case 'invalid':
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid refresh token.',
        });

      case 'session_revoked':
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication session has been revoked.',
        });

      case 'reuse_detected':
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Refresh token reuse detected. Session revoked.',
        });

      case 'expired':
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Refresh token has expired.',
        });

      case 'inactive_user':
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.USER_INACTIVE,
          message: 'User account is inactive.',
        });

      case 'invalid_tenant_context':
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Tenant membership is no longer active.',
        });

      case 'success':
        return {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
        };
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException({
        message: 'New password confirmation does not match.',
      });
    }

    if (dto.current_password === dto.new_password) {
      throw new BadRequestException({
        message: 'New password must be different from the current password.',
      });
    }

    if (Buffer.byteLength(dto.new_password, 'utf8') > 72) {
      throw new BadRequestException({
        message: 'New password exceeds the maximum supported length.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      // Serialize password changes and token issuance for this user.
      await this.acquireUserSecurityLock(manager, userId);

      const userRepository = manager.getRepository(UserEntity);
      const refreshTokenRepository = manager.getRepository(RefreshTokenEntity);

      // Lock the user record before validating and updating the password.
      const user = await userRepository.findOne({
        where: { id: userId },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!user) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found.',
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.USER_INACTIVE,
          message: 'User account is inactive.',
        });
      }

      const currentPasswordMatches = await bcrypt.compare(
        dto.current_password,
        user.passwordHash,
      );

      if (!currentPasswordMatches) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Current password is incorrect.',
        });
      }

      // Hash the new password before updating the user.
      user.passwordHash = await bcrypt.hash(dto.new_password, 12);

      await userRepository.save(user);

      // Find every session family that belongs to this user.
      const sessionFamilies = await refreshTokenRepository
        .createQueryBuilder('token')
        .select('token.familyId', 'familyId')
        .distinct(true)
        .where('token.userId = :userId', { userId })
        .getRawMany<{ familyId: string }>();

      const revokedAt = new Date();

      // Revoke all existing sessions, including their access tokens.
      for (const session of sessionFamilies) {
        await this.revokeSessionFamily(
          manager,
          userId,
          session.familyId,
          revokedAt,
        );
      }

      return {
        success: true,
        message: 'Password changed successfully.',
        sessionsRevoked: sessionFamilies.length,
        passwordChangedAt: revokedAt.toISOString(),
      };
    });
  }

  async resendVerificationEmail(
    rawEmail: string,
  ): Promise<{ message: string }> {
    const email = rawEmail.trim().toLowerCase();

    const response = {
      message: 'If the account requires verification, an email will be sent.',
    };

    const userReference = await this.userRepository.findOne({
      where: { email },
      select: { id: true },
    });

    if (!userReference) {
      return response;
    }

    const rateLimitKey = `auth:email-verification:resend:${userReference.id}`;

    const reservationId = randomUUID();

    // Reserve the email delivery slot atomically.
    const reserved = await this.redisService.setIfNotExists(
      rateLimitKey,
      reservationId,
      300,
    );

    if (!reserved) {
      return response;
    }

    let result: {
      email: string;
      rawToken: string;
    } | null;

    try {
      result = await this.dataSource.transaction(async (manager) => {
        await this.acquireUserSecurityLock(manager, userReference.id);

        const userRepository = manager.getRepository(UserEntity);

        const user = await userRepository.findOne({
          where: { id: userReference.id },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!user || !user.isActive || user.isEmailVerified) {
          return null;
        }

        const rawToken = randomBytes(32).toString('hex');

        const tokenHash = createHash('sha256').update(rawToken).digest('hex');

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await this.emailVerificationTokenRepository.invalidateUnusedByUserId(
          user.id,
          manager,
        );

        await this.emailVerificationTokenRepository.create(
          {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
          manager,
        );

        return {
          email: user.email,
          rawToken,
        };
      });
    } catch (error) {
      // Release only the reservation created by this request.
      await this.redisService.deleteIfValue(rateLimitKey, reservationId);

      throw error;
    }

    if (!result) {
      await this.redisService.deleteIfValue(rateLimitKey, reservationId);

      return response;
    }

    const verificationUrl = new URL(
      this.configurationService.mail.verificationUrl,
    );

    verificationUrl.searchParams.set('token', result.rawToken);

    const url = verificationUrl.toString();
    const htmlUrl = url.replace(/&/g, '&amp;');

    try {
      await this.mailService.send({
        from: this.configurationService.mail.from,
        to: result.email,
        subject: 'Verify your email address',
        text: [
          'Hello,',
          '',
          'Please verify your email address using the following link:',
          url,
          '',
          'This link expires in 30 minutes.',
        ].join('\n'),
        html: `
        <div>
          <h2>Verify your email address</h2>
          <p>Please click the following link to verify your email address:</p>
          <p>
            <a href="${htmlUrl}">
              Verify Email Address
            </a>
          </p>
          <p>This link expires in 30 minutes.</p>
        </div>
      `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email to ${result.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      // Convert the reservation into a 60-second cooldown.
      await this.redisService.replaceIfValue(
        rateLimitKey,
        reservationId,
        'cooldown',
        60,
      );
    }

    return response;
  }

  // ============================================================
  // Session Management
  // ============================================================

  async getSessions(userId: string, currentSessionId: string) {
    const now = new Date();

    const rows = await this.refreshTokenRepository
      .createQueryBuilder('token')
      .select('token.familyId', 'id')
      .addSelect('MIN(token.createdAt)', 'created_at')
      .addSelect('MAX(token.createdAt)', 'last_token_issued_at')
      .addSelect('MAX(token.expiresAt)', 'expires_at')

      // Device information is shared across a session family.
      .addSelect('MAX(token.device)', 'device')
      .addSelect('MAX(token.operatingSystem)', 'operating_system')
      .addSelect('MAX(token.browser)', 'browser')

      // A session is active if it has at least one valid token.
      .addSelect(
        `BOOL_OR(
        token.revokedAt IS NULL
        AND token.expiresAt > :now
      )`,
        'active',
      )

      // Only explicitly revoked sessions have a revoked_at value.
      .addSelect(
        `CASE
         WHEN BOOL_OR(
         token.revokedAt IS NULL
         AND token.expiresAt > :now)
         THEN NULL
         ELSE MAX(token.revokedAt)
         END`,
        'revoked_at',
      )

      .where('token.userId = :userId', { userId })
      .setParameter('now', now)
      .groupBy('token.familyId')
      .orderBy('MAX(token.createdAt)', 'DESC')
      .getRawMany<{
        id: string;
        device: string | null;
        operating_system: string | null;
        browser: string | null;
        created_at: Date | string;
        last_token_issued_at: Date | string;
        expires_at: Date | string;
        revoked_at: Date | string | null;
        active: boolean;
      }>();

    return rows.map((row) => {
      const status = row.active
        ? 'active'
        : row.revoked_at
          ? 'revoked'
          : 'expired';

      return {
        id: row.id,
        current: row.id === currentSessionId,
        status,

        device: row.device,
        operating_system: row.operating_system,
        browser: row.browser,

        created_at: new Date(row.created_at).toISOString(),
        last_token_issued_at: new Date(row.last_token_issued_at).toISOString(),
        expires_at: new Date(row.expires_at).toISOString(),

        revoked_at: row.revoked_at
          ? new Date(row.revoked_at).toISOString()
          : null,
      };
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    return this.dataSource.transaction(async (manager) => {
      const refreshTokenRepository = manager.getRepository(RefreshTokenEntity);

      // Serialize all operations belonging to this session.
      await this.acquireSessionLock(manager, userId, sessionId);

      // Verify that the session belongs to the authenticated user.
      const session = await refreshTokenRepository.findOne({
        where: {
          userId,
          familyId: sessionId,
        },
      });

      if (!session) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Session not found.',
        });
      }

      // Revoke access tokens associated with this session.
      // Access tokens have a maximum lifetime of 15 minutes.
      const now = new Date();

      const affected = await this.revokeSessionFamily(
        manager,
        userId,
        sessionId,
        now,
      );

      return {
        id: sessionId,
        revoked: affected > 0,
        revokedAt: now.toISOString(),
      };
    });
  }

  async deleteSessionHistory(userId: string, sessionId: string) {
    return this.dataSource.transaction(async (manager) => {
      const refreshTokenRepository = manager.getRepository(RefreshTokenEntity);

      // Serialize all operations belonging to this session.
      await this.acquireSessionLock(manager, userId, sessionId);

      // Verify that the session belongs to the authenticated user.
      const session = await refreshTokenRepository.findOne({
        where: {
          userId,
          familyId: sessionId,
        },
      });

      if (!session) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Session not found.',
        });
      }

      const now = new Date();

      // Prevent deletion while the session still has a valid refresh token.
      const hasActiveToken = await refreshTokenRepository
        .createQueryBuilder('token')
        .where('token.userId = :userId', { userId })
        .andWhere('token.familyId = :sessionId', { sessionId })
        .andWhere('token.revokedAt IS NULL')
        .andWhere('token.expiresAt > :now', { now })
        .getExists();

      if (hasActiveToken) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.CONFLICT,
          message: 'Active sessions cannot be deleted from history.',
        });
      }

      // Delete all refresh token records belonging to this session family.
      const result = await refreshTokenRepository.delete({
        userId,
        familyId: sessionId,
      });

      return {
        id: sessionId,
        deleted: (result.affected ?? 0) > 0,
      };
    });
  }

  // ============================================================
  // Select Tenant
  // ============================================================

  async selectTenant(userId: string, tenantId: string, refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const tenantUserRepository = manager.getRepository(TenantUserEntity);
      const userRoleRepository = manager.getRepository(UserRoleEntity);
      const refreshTokenRepository = manager.getRepository(RefreshTokenEntity);

      // Serialize tenant selection with password changes and login.
      await this.acquireUserSecurityLock(manager, userId);

      // Find the refresh token to identify its session family.
      const tokenReference = await refreshTokenRepository.findOne({
        where: {
          userId,
          tokenHash,
        },
      });

      if (!tokenReference) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid refresh token.',
        });
      }

      // Serialize operations for this specific session.
      await this.acquireSessionLock(manager, userId, tokenReference.familyId);

      // Reject sessions revoked in Redis.
      const isSessionRevoked = await this.redisService.exists(
        `auth:revoked-session:${tokenReference.familyId}`,
      );

      if (isSessionRevoked) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication session has been revoked.',
        });
      }

      // Re-read and lock the refresh token after acquiring both locks.
      const currentToken = await refreshTokenRepository.findOne({
        where: {
          userId,
          tokenHash,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!currentToken || currentToken.revokedAt) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid refresh token.',
        });
      }

      const now = new Date();

      if (currentToken.expiresAt.getTime() <= now.getTime()) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'Refresh token has expired.',
        });
      }

      const user = await userRepository.findOne({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found.',
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.USER_INACTIVE,
          message: 'User account is inactive.',
        });
      }

      // Validate the user's active membership in the requested tenant.
      const membership = await tenantUserRepository.findOne({
        where: {
          userId,
          tenantId,
          status: MEMBERSHIP_STATUS.ACTIVE,
        },
        relations: {
          tenant: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_REQUIRED,
          message: 'User is not an active member of the requested tenant.',
        });
      }

      if (membership.tenant.status !== TENANT_STATUS.ACTIVE) {
        throw new UnauthorizedException({
          code: AUTH_ERROR_CODES.TENANT_INACTIVE,
          message: 'Tenant is inactive.',
        });
      }

      // Load the roles available in the selected tenant context.
      const userRoles = await userRoleRepository.find({
        where: {
          userId,
        },
        relations: {
          role: true,
        },
      });

      const contextUserRoles = userRoles.filter((userRole) => {
        // System roles are globally available.
        if (userRole.tenantId === null) {
          return userRole.role.isSystem === true;
        }

        // Tenant roles must belong to the selected tenant.
        return (
          userRole.tenantId === tenantId && userRole.role.isSystem === false
        );
      });

      const roles = contextUserRoles.map((userRole) => userRole.role.slug);

      const roleIds = contextUserRoles.map((userRole) => userRole.roleId);

      const permissions = await this.resolvePermissions(roleIds);

      const payload: JwtPayload = {
        sub: user.id,
        tenantId,
        sid: currentToken.familyId,
        email: user.email,
        roles,
        permissions,
      };

      const accessToken = this.jwtTokenService.sign(payload);

      // Update only the refresh-token session used in this request.
      currentToken.tenantId = tenantId;

      await refreshTokenRepository.save(currentToken);

      return {
        accessToken,

        tenant: {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          type: membership.tenant.type,
        },

        roles,
        permissions,
      };
    });
  }

  // ============================================================
  // Profile
  // ============================================================

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive.',
      });
    }

    const avatarUrl = await this.userAvatarService.getAvatarUrl(user.avatarKey);

    const memberships = await this.tenantUserRepository.find({
      where: {
        userId: user.id,
      },
      relations: {
        tenant: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const userRoles = await this.userRoleRepository.find({
      where: {
        userId: user.id,
      },
      relations: {
        role: true,
      },
    });

    const systemRoles = userRoles
      .filter(
        (userRole) =>
          userRole.tenantId === null && userRole.role.isSystem === true,
      )
      .map((userRole) => userRole.role.slug);

    const tenantRoles = userRoles
      .filter(
        (userRole) =>
          userRole.tenantId !== null && userRole.role.isSystem === false,
      )
      .map((userRole) => ({
        tenantId: userRole.tenantId,
        role: userRole.role.slug,
      }));

    return {
      //success: true as const,
      //data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      emailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      systemRoles,

      tenantMemberships: memberships.map((membership) => ({
        membershipId: membership.id,
        tenantId: membership.tenantId,
        status: membership.status,

        tenant: {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          type: membership.tenant.type,
          status: membership.tenant.status,
          ownerId: membership.tenant.ownerId,
        },
      })),

      tenantRoles,
      //},
    };
  }

  // ============================================================
  // Update Profile Avatar
  // ============================================================

  async updateProfileAvatar(
    userId: string,
    file: { buffer: Buffer; size: number },
  ) {
    if (!file) {
      throw new BadRequestException({
        code: 'AVATAR_FILE_REQUIRED',
        message: 'Avatar file is required.',
      });
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive.',
      });
    }

    const previousAvatarKey = user.avatarKey;
    const newAvatarKey = await this.userAvatarService.uploadAvatar(
      user.id,
      file,
    );

    try {
      user.avatarKey = newAvatarKey;
      await this.userRepository.save(user);
    } catch (error: unknown) {
      try {
        await this.userAvatarService.deleteAvatar(newAvatarKey);
      } catch (cleanupError: unknown) {
        this.logger.error(
          'Failed to clean up avatar after profile update failure.',
        );
      }

      throw error;
    }

    if (previousAvatarKey && previousAvatarKey !== newAvatarKey) {
      try {
        await this.userAvatarService.deleteAvatar(previousAvatarKey);
      } catch (error: unknown) {
        this.logger.warn('Failed to delete the previous user avatar.');
      }
    }

    return {
      avatarUrl: await this.userAvatarService.getAvatarUrl(newAvatarKey),
    };
  }

  // ============================================================
  // Get User
  // ============================================================

  async getUser(requester: InternalJwtPayload, targetUserId: string) {
    // Validate the requester before revealing whether the target user exists.
    if (requester.scope === InternalAuthScope.GLOBAL) {
      if (!requester.userId) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'A user identity is required for global access.',
        });
      }

      const requesterUser = await this.userRepository.findOne({
        where: {
          id: requester.userId,
        },
      });

      if (!requesterUser || !requesterUser.isActive) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'An active user account is required for global access.',
        });
      }

      const requesterRoles = await this.userRoleRepository.find({
        where: {
          userId: requester.userId,
          tenantId: IsNull(),
        },
        relations: {
          role: true,
        },
      });

      const isSuperAdmin = requesterRoles.some(
        (userRole) =>
          userRole.role.isSystem === true &&
          userRole.role.slug === ROLE_SLUGS.SUPER_ADMIN,
      );

      if (!isSuperAdmin) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Global access requires the SUPER_ADMIN role.',
        });
      }
    } else if (!requester.tenantId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.TENANT_CONTEXT_REQUIRED,
        message: 'A Tenant context is required.',
      });
    }

    const user = await this.userRepository.findOne({
      where: {
        id: targetUserId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
        message: 'User account is inactive.',
      });
    }

    const isGlobal = requester.scope === InternalAuthScope.GLOBAL;

    const memberships = await this.tenantUserRepository.find({
      where: isGlobal
        ? { userId: targetUserId }
        : {
            userId: targetUserId,
            tenantId: requester.tenantId!,
          },
      relations: {
        tenant: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    if (!isGlobal && memberships.length === 0) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    const userRoles = await this.userRoleRepository.find({
      where: isGlobal
        ? { userId: targetUserId }
        : {
            userId: targetUserId,
            tenantId: requester.tenantId!,
          },
      relations: {
        role: true,
      },
    });

    const systemRoles = isGlobal
      ? userRoles
          .filter(
            (userRole) =>
              userRole.tenantId === null && userRole.role.isSystem === true,
          )
          .map((userRole) => userRole.role.slug)
      : [];

    const tenantRoles = userRoles
      .filter(
        (userRole) =>
          userRole.tenantId !== null &&
          userRole.role.isSystem !== true &&
          (isGlobal || userRole.tenantId === requester.tenantId),
      )
      .map((userRole) => ({
        tenantId: userRole.tenantId,
        role: userRole.role.slug,
      }));

    return {
      success: true as const,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        systemRoles,
        tenantMemberships: memberships.map((membership) => ({
          membershipId: membership.id,
          tenantId: membership.tenantId,
          status: membership.status,
          tenant: {
            id: membership.tenant.id,
            name: membership.tenant.name,
            slug: membership.tenant.slug,
            type: membership.tenant.type,
            status: membership.tenant.status,
            ownerId: membership.tenant.ownerId,
          },
        })),
        tenantRoles,
      },
    };
  }

  async verifyEmail(rawToken: string): Promise<{ verified: boolean }> {
    if (!rawToken || !/^[a-f0-9]{64}$/i.test(rawToken)) {
      throw new BadRequestException({
        message: 'Invalid or expired verification token.',
      });
    }

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // Resolve the user ID before acquiring transactional locks.
    const tokenReference =
      await this.emailVerificationTokenRepository.findByHash(tokenHash);

    if (!tokenReference) {
      throw new BadRequestException({
        message: 'Invalid or expired verification token.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      // Keep the same lock order used by token issuance.
      await this.acquireUserSecurityLock(manager, tokenReference.userId);

      const userRepository = manager.getRepository(UserEntity);

      // Lock the user before accessing the verification token.
      const user = await userRepository.findOne({
        where: {
          id: tokenReference.userId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!user || !user.isActive) {
        throw new BadRequestException({
          message: 'Invalid or expired verification token.',
        });
      }

      // Revalidate and lock the token inside the transaction.
      const token = await this.emailVerificationTokenRepository.findValidToken(
        tokenHash,
        manager,
        true,
      );

      if (!token || token.userId !== user.id) {
        throw new BadRequestException({
          message: 'Invalid or expired verification token.',
        });
      }

      // Atomically consume the token.
      const consumed = await this.emailVerificationTokenRepository.markAsUsed(
        token.id,
        manager,
      );

      if (!consumed) {
        throw new BadRequestException({
          message: 'Invalid or expired verification token.',
        });
      }

      // Update the user's verification status.
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        user.emailVerifiedAt = new Date();

        await userRepository.save(user);
      }

      return {
        verified: true,
      };
    });
  }

  // ============================================================
  // Create Tenant
  // ============================================================

  async createTenant(ownerId: string, name: string, slug: string) {
    const owner = await this.userRepository.findOne({
      where: {
        id: ownerId,
      },
    });

    if (!owner) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    if (!owner.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
      });
    }

    const normalizedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();

    const existingTenant = await this.tenantRepository.findOne({
      where: {
        slug: normalizedSlug,
      },
    });

    if (existingTenant) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.TENANT_SLUG_ALREADY_EXISTS,
        message: 'A tenant with this slug already exists.',
      });
    }

    const tenant = this.tenantRepository.create({
      name: normalizedName,
      slug: normalizedSlug,
      ownerId: owner.id,
      status: TENANT_STATUS.PENDING,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    return {
      id: savedTenant.id,
      name: savedTenant.name,
      slug: savedTenant.slug,
      ownerId: savedTenant.ownerId,
      status: savedTenant.status,
    };
  }

  // ============================================================
  // Approve Tenant
  // ============================================================
  async approveTenant(requester: InternalJwtPayload, tenantId: string) {
    // --------------------------------------------------------
    // Validate requester context
    // --------------------------------------------------------

    if (requester.scope !== InternalAuthScope.GLOBAL || !requester.userId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'Only global administrators can approve tenants.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const tenantRepository = manager.getRepository(TenantEntity);
      const userRepository = manager.getRepository(UserEntity);
      const tenantUserRepository = manager.getRepository(TenantUserEntity);
      const roleRepository = manager.getRepository(RoleEntity);
      const userRoleRepository = manager.getRepository(UserRoleEntity);
      const permissionRepository = manager.getRepository(PermissionEntity);
      const rolePermissionRepository =
        manager.getRepository(RolePermissionEntity);

      // --------------------------------------------------------
      // Verify the requesting user
      // --------------------------------------------------------

      const requesterUser = await userRepository.findOne({
        where: {
          id: requester.userId!,
        },
      });

      if (!requesterUser || !requesterUser.isActive) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'An active global administrator is required.',
        });
      }

      // --------------------------------------------------------
      // Verify the actual system SUPER_ADMIN role
      // --------------------------------------------------------

      const superAdminRole = await roleRepository.findOne({
        where: {
          slug: ROLE_SLUGS.SUPER_ADMIN,
          isSystem: true,
          tenantId: IsNull(),
        },
      });

      if (!superAdminRole) {
        throw new InternalServerErrorException({
          code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
          message: 'The system SUPER_ADMIN role is not configured.',
        });
      }

      const superAdminAssignment = await userRoleRepository.findOne({
        where: {
          userId: requesterUser.id,
          roleId: superAdminRole.id,
          tenantId: IsNull(),
        },
      });

      if (!superAdminAssignment) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Only global administrators can approve tenants.',
        });
      }

      // --------------------------------------------------------
      // Lock tenant
      // --------------------------------------------------------

      const tenant = await tenantRepository.findOne({
        where: {
          id: tenantId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!tenant) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
          message: 'Tenant not found.',
        });
      }

      if (tenant.status === TENANT_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Tenant is already active.',
        });
      }

      if (tenant.status !== TENANT_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Only pending tenants can be approved.',
        });
      }

      // --------------------------------------------------------
      // Verify owner
      // --------------------------------------------------------

      const owner = await userRepository.findOne({
        where: {
          id: tenant.ownerId,
        },
      });

      if (!owner) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'Tenant owner was not found.',
        });
      }

      if (!owner.isActive) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.USER_INACTIVE,
          message: 'Tenant owner is inactive.',
        });
      }

      // --------------------------------------------------------
      // Find or create Tenant Admin role
      // --------------------------------------------------------

      let tenantAdminRole = await roleRepository.findOne({
        where: {
          tenantId: tenant.id,
          slug: ROLE_SLUGS.TENANT_ADMIN,
          isSystem: false,
        },
      });

      if (!tenantAdminRole) {
        tenantAdminRole = roleRepository.create({
          tenantId: tenant.id,
          name: 'Tenant Administrator',
          slug: ROLE_SLUGS.TENANT_ADMIN,
          description: 'Administrator of the tenant.',
          isSystem: false,
        });

        tenantAdminRole = await roleRepository.save(tenantAdminRole);
      }

      // --------------------------------------------------------
      // Find or create Staff role
      // --------------------------------------------------------

      let staffRole = await roleRepository.findOne({
        where: {
          tenantId: tenant.id,
          slug: ROLE_SLUGS.STAFF,
          isSystem: false,
        },
      });

      if (!staffRole) {
        staffRole = roleRepository.create({
          tenantId: tenant.id,
          name: 'Staff',
          slug: ROLE_SLUGS.STAFF,
          description: 'Standard tenant member.',
          isSystem: false,
        });

        staffRole = await roleRepository.save(staffRole);
      }

      // --------------------------------------------------------
      // Verify required permissions before activating the tenant
      // --------------------------------------------------------

      const permissionSlugs = [
        'tenant.membership.approve',
        'tenant.membership.reject',
      ];

      const permissions = await permissionRepository.find({
        where: permissionSlugs.map((slug) => ({
          slug,
        })),
      });

      const permissionMap = new Map(
        permissions.map((permission) => [permission.slug, permission]),
      );

      const rolePermissionRows = permissionSlugs.map((slug) => {
        const permission = permissionMap.get(slug);

        if (!permission) {
          throw new NotFoundException({
            code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
            message: `Permission "${slug}" was not found.`,
          });
        }

        return {
          roleId: tenantAdminRole.id,
          permissionId: permission.id,
        };
      });

      // --------------------------------------------------------
      // Activate tenant
      // --------------------------------------------------------

      // --------------------------------------------------------
      // Activate tenant and record review information
      // --------------------------------------------------------

      tenant.status = TENANT_STATUS.ACTIVE;
      tenant.reviewedAt = new Date();
      tenant.reviewedBy = requesterUser.id;
      tenant.rejectionReason = null;

      await tenantRepository.save(tenant);

      // --------------------------------------------------------
      // Activate or create owner membership
      // --------------------------------------------------------

      let ownerMembership = await tenantUserRepository.findOne({
        where: {
          tenantId: tenant.id,
          userId: tenant.ownerId,
        },
      });

      if (!ownerMembership) {
        ownerMembership = tenantUserRepository.create({
          tenantId: tenant.id,
          userId: tenant.ownerId,
          status: MEMBERSHIP_STATUS.ACTIVE,
        });
      } else {
        ownerMembership.status = MEMBERSHIP_STATUS.ACTIVE;
      }

      ownerMembership = await tenantUserRepository.save(ownerMembership);

      // --------------------------------------------------------
      // Assign Tenant Admin role to owner
      // --------------------------------------------------------

      const existingOwnerRole = await userRoleRepository.findOne({
        where: {
          userId: tenant.ownerId,
          roleId: tenantAdminRole.id,
          tenantId: tenant.id,
        },
      });

      if (!existingOwnerRole) {
        await userRoleRepository.save(
          userRoleRepository.create({
            userId: tenant.ownerId,
            roleId: tenantAdminRole.id,
            tenantId: tenant.id,
          }),
        );
      }

      // --------------------------------------------------------
      // Assign default permissions to Tenant Admin
      // --------------------------------------------------------

      await rolePermissionRepository
        .createQueryBuilder()
        .insert()
        .into(RolePermissionEntity)
        .values(rolePermissionRows)
        .orIgnore()
        .execute();

      // --------------------------------------------------------
      // Return result
      // --------------------------------------------------------

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          type: tenant.type,
          ownerId: tenant.ownerId,
          status: tenant.status,
          reviewedAt: tenant.reviewedAt,
          reviewedBy: tenant.reviewedBy,
          rejectionReason: tenant.rejectionReason,
        },
        ownerMembership: {
          membershipId: ownerMembership.id,
          tenantId: ownerMembership.tenantId,
          userId: ownerMembership.userId,
          status: ownerMembership.status,
        },
        ownerRole: {
          roleId: tenantAdminRole.id,
          role: tenantAdminRole.slug,
        },
        defaultRoles: [
          {
            id: staffRole.id,
            slug: staffRole.slug,
          },
          {
            id: tenantAdminRole.id,
            slug: tenantAdminRole.slug,
          },
        ],
        permissions: permissionSlugs,
      };
    });
  }

  // ============================================================
  // Reject Tenant
  // ============================================================

  async rejectTenant(
    requester: InternalJwtPayload,
    tenantId: string,
    reason: string,
  ) {
    // ----------------------------------------------------------
    // Validate requester context
    // ----------------------------------------------------------

    if (requester.scope !== InternalAuthScope.GLOBAL || !requester.userId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'Only global administrators can reject tenants.',
      });
    }

    const normalizedReason = reason?.trim();

    if (
      !normalizedReason ||
      normalizedReason.length < 5 ||
      normalizedReason.length > 1000
    ) {
      throw new BadRequestException({
        code: AUTH_ERROR_CODES.VALIDATION_ERROR,
        message: 'Rejection reason must be between 5 and 1000 characters.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const roleRepository = manager.getRepository(RoleEntity);
      const userRoleRepository = manager.getRepository(UserRoleEntity);
      const tenantRepository = manager.getRepository(TenantEntity);

      // --------------------------------------------------------
      // Verify requester
      // --------------------------------------------------------

      const requesterUser = await userRepository.findOne({
        where: {
          id: requester.userId,
        },
      });

      if (!requesterUser || !requesterUser.isActive) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'An active global administrator is required.',
        });
      }

      // --------------------------------------------------------
      // Verify SUPER_ADMIN role
      // --------------------------------------------------------

      const superAdminRole = await roleRepository.findOne({
        where: {
          slug: ROLE_SLUGS.SUPER_ADMIN,
          isSystem: true,
          tenantId: IsNull(),
        },
      });

      if (!superAdminRole) {
        throw new InternalServerErrorException({
          code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
          message: 'The system SUPER_ADMIN role is not configured.',
        });
      }

      const superAdminAssignment = await userRoleRepository.findOne({
        where: {
          userId: requesterUser.id,
          roleId: superAdminRole.id,
          tenantId: IsNull(),
        },
      });

      if (!superAdminAssignment) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Only global administrators can reject tenants.',
        });
      }

      // --------------------------------------------------------
      // Lock tenant
      // --------------------------------------------------------

      const tenant = await tenantRepository.findOne({
        where: {
          id: tenantId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!tenant) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
          message: 'Tenant not found.',
        });
      }

      if (tenant.status !== TENANT_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Only pending tenants can be rejected.',
        });
      }

      // --------------------------------------------------------
      // Reject tenant
      // --------------------------------------------------------

      tenant.status = TENANT_STATUS.REJECTED;
      tenant.reviewedAt = new Date();
      tenant.reviewedBy = requesterUser.id;
      tenant.rejectionReason = normalizedReason;

      await tenantRepository.save(tenant);

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        status: tenant.status,
        reviewedAt: tenant.reviewedAt,
        reviewedBy: tenant.reviewedBy,
        rejectionReason: tenant.rejectionReason,
      };
    });
  }

  // ============================================================
  // Get Pending Tenants
  // ============================================================
  async getPendingTenants(requester: InternalJwtPayload) {
    // ----------------------------------------------------------
    // Validate requester context
    // ----------------------------------------------------------

    if (requester.scope !== InternalAuthScope.GLOBAL || !requester.userId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.FORBIDDEN,
        message: 'Only global administrators can view pending tenants.',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const roleRepository = manager.getRepository(RoleEntity);
      const userRoleRepository = manager.getRepository(UserRoleEntity);
      const tenantRepository = manager.getRepository(TenantEntity);

      // --------------------------------------------------------
      // Verify requester
      // --------------------------------------------------------

      const requesterUser = await userRepository.findOne({
        where: {
          id: requester.userId,
        },
      });

      if (!requesterUser || !requesterUser.isActive) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'An active global administrator is required.',
        });
      }

      // --------------------------------------------------------
      // Verify SUPER_ADMIN role
      // --------------------------------------------------------

      const superAdminRole = await roleRepository.findOne({
        where: {
          slug: ROLE_SLUGS.SUPER_ADMIN,
          isSystem: true,
          tenantId: IsNull(),
        },
      });

      if (!superAdminRole) {
        throw new InternalServerErrorException({
          code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
          message: 'The system SUPER_ADMIN role is not configured.',
        });
      }

      const superAdminAssignment = await userRoleRepository.findOne({
        where: {
          userId: requesterUser.id,
          roleId: superAdminRole.id,
          tenantId: IsNull(),
        },
      });

      if (!superAdminAssignment) {
        throw new ForbiddenException({
          code: AUTH_ERROR_CODES.FORBIDDEN,
          message: 'Only global administrators can view pending tenants.',
        });
      }

      // --------------------------------------------------------
      // Get pending tenants
      // --------------------------------------------------------

      const tenants = await tenantRepository.find({
        where: {
          status: TENANT_STATUS.PENDING,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          ownerId: true,
          status: true,
          createdAt: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        items: tenants,
        total: tenants.length,
      };
    });
  }

  // ============================================================
  // Request Tenant Membership
  // ============================================================

  async requestTenantMembership(userId: string, tenantId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.USER_INACTIVE,
      });
    }

    const tenant = await this.tenantRepository.findOne({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.TENANT_NOT_FOUND,
      });
    }

    if (tenant.status !== TENANT_STATUS.ACTIVE) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.TENANT_INACTIVE,
        message: 'Tenant is not available for membership.',
      });
    }

    if (tenant.ownerId === userId) {
      throw new ConflictException({
        code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_ALREADY_ACTIVE,
        message: 'Tenant owner already has an active membership.',
      });
    }

    const existingMembership = await this.tenantUserRepository.findOne({
      where: {
        tenantId,
        userId,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === MEMBERSHIP_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_ALREADY_ACTIVE,
        });
      }

      if (existingMembership.status === MEMBERSHIP_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_ALREADY_PENDING,
        });
      }

      if (existingMembership.status === MEMBERSHIP_STATUS.REJECTED) {
        existingMembership.status = MEMBERSHIP_STATUS.PENDING;

        const updated =
          await this.tenantUserRepository.save(existingMembership);

        return {
          success: true as const,
          data: {
            membershipId: updated.id,
            tenantId: updated.tenantId,
            userId: updated.userId,
            status: updated.status,
          },
        };
      }
    }

    const membership = this.tenantUserRepository.create({
      tenantId,
      userId,
      status: MEMBERSHIP_STATUS.PENDING,
    });

    const savedMembership = await this.tenantUserRepository.save(membership);

    return {
      success: true as const,
      data: {
        membershipId: savedMembership.id,
        tenantId: savedMembership.tenantId,
        userId: savedMembership.userId,
        status: savedMembership.status,
      },
    };
  }

  // ============================================================
  // Tenant Scope
  // ============================================================

  private assertTenantScope(
    requester: InternalJwtPayload,
    targetTenantId: string,
  ): void {
    if (requester.scope === InternalAuthScope.GLOBAL) {
      return;
    }

    if (requester.scope !== InternalAuthScope.TENANT || !requester.tenantId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.TENANT_CONTEXT_REQUIRED,
        message: 'A Tenant context is required for this operation.',
      });
    }

    if (requester.tenantId !== targetTenantId) {
      throw new ForbiddenException({
        code: AUTH_ERROR_CODES.TENANT_SCOPE_FORBIDDEN,
        message: 'You are not authorized to operate on this Tenant.',
      });
    }
  }

  // ============================================================
  // Approve Membership
  // ============================================================

  async approveTenantMembership(
    requester: InternalJwtPayload,
    membershipId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepository = manager.getRepository(TenantUserEntity);

      const roleRepository = manager.getRepository(RoleEntity);

      const userRoleRepository = manager.getRepository(UserRoleEntity);

      const lockedMembership = await membershipRepository.findOne({
        where: {
          id: membershipId,
        },
        relations: {
          tenant: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!lockedMembership) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_NOT_FOUND,
        });
      }

      this.assertTenantScope(requester, lockedMembership.tenantId);

      if (lockedMembership.status !== MEMBERSHIP_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Only pending membership requests can be approved.',
        });
      }

      if (lockedMembership.tenant.status !== TENANT_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_INACTIVE,
        });
      }

      const staffRole = await roleRepository.findOne({
        where: {
          tenantId: lockedMembership.tenantId,
          slug: ROLE_SLUGS.STAFF,
          isSystem: false,
        },
      });

      if (!staffRole) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.ROLE_NOT_FOUND,
          message: 'Default STAFF role for this Tenant was not found.',
        });
      }

      lockedMembership.status = MEMBERSHIP_STATUS.ACTIVE;

      const savedMembership = await membershipRepository.save(lockedMembership);

      const existingUserRole = await userRoleRepository.findOne({
        where: {
          userId: lockedMembership.userId,
          roleId: staffRole.id,
          tenantId: lockedMembership.tenantId,
        },
      });

      if (!existingUserRole) {
        await userRoleRepository.save(
          userRoleRepository.create({
            userId: lockedMembership.userId,
            roleId: staffRole.id,
            tenantId: lockedMembership.tenantId,
          }),
        );
      }

      return {
        success: true as const,
        data: {
          membershipId: savedMembership.id,
          tenantId: savedMembership.tenantId,
          userId: savedMembership.userId,
          status: savedMembership.status,

          role: {
            id: staffRole.id,
            slug: staffRole.slug,
          },
        },
      };
    });
  }

  // ============================================================
  // Reject Membership
  // ============================================================

  async rejectTenantMembership(
    requester: InternalJwtPayload,
    membershipId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const membershipRepository = manager.getRepository(TenantUserEntity);

      const membership = await membershipRepository.findOne({
        where: {
          id: membershipId,
        },
        relations: {
          tenant: true,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!membership) {
        throw new NotFoundException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_NOT_FOUND,
        });
      }

      this.assertTenantScope(requester, membership.tenantId);

      if (membership.status !== MEMBERSHIP_STATUS.PENDING) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_MEMBERSHIP_INVALID_STATUS,
          message: 'Only pending membership requests can be rejected.',
        });
      }

      if (membership.tenant.status !== TENANT_STATUS.ACTIVE) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.TENANT_INACTIVE,
        });
      }

      membership.status = MEMBERSHIP_STATUS.REJECTED;

      const savedMembership = await membershipRepository.save(membership);

      return {
        success: true as const,
        data: {
          membershipId: savedMembership.id,
          tenantId: savedMembership.tenantId,
          userId: savedMembership.userId,
          status: savedMembership.status,
        },
      };
    });
  }

  // ============================================================
  // Resolve Permissions
  // ============================================================

  private async resolvePermissions(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: {
        roleId: In(roleIds),
      },
      relations: {
        permission: true,
      },
    });

    return Array.from(
      new Set(
        rolePermissions
          .map((rolePermission) => rolePermission.permission.slug)
          .filter(Boolean),
      ),
    ).sort();
  }

  private async acquireSessionLock(
    manager: EntityManager,
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const lockKey = `auth-session:${userId}:${sessionId}`;

    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [lockKey],
    );
  }

  private async acquireUserSecurityLock(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    const lockKey = `auth-user-security:${userId}`;

    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [lockKey],
    );
  }

  private async revokeSessionFamily(
    manager: EntityManager,
    userId: string,
    sessionId: string,
    revokedAt: Date = new Date(),
  ): Promise<number> {
    const refreshTokenRepository = manager.getRepository(RefreshTokenEntity);

    // Revoke access tokens associated with this session.
    await this.redisService.set(
      `auth:revoked-session:${sessionId}`,
      '1',
      16 * 60,
    );

    // Revoke all active refresh tokens.
    const result = await refreshTokenRepository.update(
      {
        userId,
        familyId: sessionId,
        revokedAt: IsNull(),
      },
      {
        revokedAt,
      },
    );

    return result.affected ?? 0;
  }
}
