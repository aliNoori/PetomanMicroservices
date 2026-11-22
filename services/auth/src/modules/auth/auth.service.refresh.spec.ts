import { DataSource } from 'typeorm';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { MEMBERSHIP_STATUS } from '../../common/constants/membership.constants';
import { TENANT_STATUS } from '../../common/constants/tenant.constants';

describe('AuthService.refresh', () => {
  let service: AuthService;
  let dataSource: { transaction: jest.Mock };
  let repositories: Map<unknown, any>;
  let manager: { getRepository: jest.Mock; query: jest.Mock };

  const user = {
    id: 'user-1',
    email: 'user@example.com',
    isActive: true,
  };

  const currentToken = {
    id: 'refresh-1',
    userId: 'user-1',
    familyId: 'family-1',
    tenantId: 'tenant-1',
    tokenHash: '',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    device: 'Desktop',
    operatingSystem: 'Windows',
    browser: 'Chrome',
    userAgent: 'test-agent',
  };

  const systemRole = {
    id: 'system-role-1',
    slug: 'SUPER_ADMIN',
    isSystem: true,
  };

  const tenantRole = {
    id: 'tenant-role-1',
    slug: 'TENANT_ADMIN',
    isSystem: false,
  };

  function createRepositoryMock() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => ({ id: 'new-refresh-id', ...value })),
      save: jest.fn(async (value) => value),
      update: jest.fn(),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();

    const refreshTokenRepository = createRepositoryMock();
    const userRepository = createRepositoryMock();
    const membershipRepository = createRepositoryMock();
    const userRoleRepository = createRepositoryMock();
    const rolePermissionRepository = createRepositoryMock();

    repositories = new Map<unknown, any>([
      [RefreshTokenEntity, refreshTokenRepository],
      [UserEntity, userRepository],
      [TenantUserEntity, membershipRepository],
      [UserRoleEntity, userRoleRepository],
      [RolePermissionEntity, rolePermissionRepository],
    ]);

    manager = {
      getRepository: jest.fn((entity) => repositories.get(entity)),
      query: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn((callback) => callback(manager)),
    };

    refreshTokenRepository.findOne
      .mockResolvedValueOnce({ ...currentToken })
      .mockResolvedValueOnce({ ...currentToken });

    userRepository.findOne.mockResolvedValue(user);

    membershipRepository.findOne.mockResolvedValue(null);

    userRoleRepository.find.mockResolvedValue([
      {
        roleId: systemRole.id,
        tenantId: null,
        role: systemRole,
      },
      {
        roleId: tenantRole.id,
        tenantId: currentToken.tenantId,
        role: tenantRole,
      },
    ]);

    rolePermissionRepository.find.mockResolvedValue([]);

    service = new AuthService(
      { sign: jest.fn((payload) => JSON.stringify(payload)) } as any,
      {} as any,
      dataSource as unknown as DataSource,
      {
        exists: jest.fn().mockResolvedValue(false),
        set: jest.fn(),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      userRepository as any,
      {} as any,
      membershipRepository as any,
      userRoleRepository as any,
      rolePermissionRepository as any,
      refreshTokenRepository as any,
    );
  });

  it('should preserve the session and clear an inactive tenant context', async () => {
    const rawRefreshToken = 'existing-refresh-token';
    const tokenHash = createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const refreshTokenRepository = repositories.get(RefreshTokenEntity);
    refreshTokenRepository.findOne
      .mockReset()
      .mockResolvedValueOnce({ ...currentToken, tokenHash })
      .mockResolvedValueOnce({ ...currentToken, tokenHash });

    const result = await service.refresh(rawRefreshToken);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const signedPayload = (service as any).jwtTokenService.sign.mock
      .calls[0][0];

    expect(signedPayload.tenantId).toBeNull();
    expect(signedPayload.roles).toEqual([systemRole.slug]);

    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        familyId: currentToken.familyId,
        tenantId: null,
      }),
    );

    expect(refreshTokenRepository.update).not.toHaveBeenCalled();
    expect((service as any).redisService.set).not.toHaveBeenCalled();
  });

  it('should preserve an active tenant context and its roles', async () => {
    const rawRefreshToken = 'existing-refresh-token';
    const tokenHash = createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const refreshTokenRepository = repositories.get(RefreshTokenEntity);
    refreshTokenRepository.findOne
      .mockReset()
      .mockResolvedValueOnce({ ...currentToken, tokenHash })
      .mockResolvedValueOnce({ ...currentToken, tokenHash });

    const membershipRepository = repositories.get(TenantUserEntity);
    membershipRepository.findOne.mockResolvedValue({
      userId: user.id,
      tenantId: currentToken.tenantId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      tenant: {
        id: currentToken.tenantId,
        status: TENANT_STATUS.ACTIVE,
      },
    });

    const result = await service.refresh(rawRefreshToken);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const signedPayload = (service as any).jwtTokenService.sign.mock
      .calls[0][0];

    expect(signedPayload.tenantId).toBe(currentToken.tenantId);
    expect(signedPayload.roles).toEqual([systemRole.slug, tenantRole.slug]);

    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        familyId: currentToken.familyId,
        tenantId: currentToken.tenantId,
      }),
    );

    expect(refreshTokenRepository.update).not.toHaveBeenCalled();
    expect((service as any).redisService.set).not.toHaveBeenCalled();
  });
});
