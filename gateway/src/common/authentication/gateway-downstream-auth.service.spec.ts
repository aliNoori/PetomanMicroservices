
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  InternalJwtService,
  InternalAuthScope,
} from '@petoman/security';

import type { AuthenticatedRequest } from '@petoman/security';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../modules/proxy/routing/gateway-route.types';

import { GatewayDownstreamAuthService } from './gateway-downstream-auth.service';

describe('GatewayDownstreamAuthService', () => {
  let service: GatewayDownstreamAuthService;

  const configValues = {
    'internalJwt.secret': 'test-internal-secret',
    'internalJwt.issuer': 'petoman-gateway',
    'internalJwt.authAudience': 'petoman-auth',
    'internalJwt.marketAudience': 'petoman-market',
    'internalJwt.expiresInSeconds': 60,
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const value = configValues[key as keyof typeof configValues];

      if (value === undefined) {
        throw new Error(`Missing config: ${key}`);
      }

      return value;
    }),
  } as unknown as ConfigService;

  const internalJwtService = {
    signUserToken: jest.fn(),
    signServiceToken: jest.fn(),
  } as unknown as InternalJwtService;

  const request = {
    user: {
      sub: 'user-001',
      sid: 'session-001',
      tenantId: 'tenant-001',
      roles: ['OWNER'],
      permissions: ['product.read'],
      email: 'user@example.com',
    },
  } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(internalJwtService.signUserToken).mockReturnValue('user-token');

    jest
      .mocked(internalJwtService.signServiceToken)
      .mockReturnValue('service-token');

    service = new GatewayDownstreamAuthService(
      internalJwtService,
      configService,
    );
  });

  it('should create a user token for Auth JWT requests', () => {
    const result = service.createAuthorizationHeader(
      GatewayTarget.AUTH,
      GatewayAuthMode.JWT,
      request,
    );

    expect(result).toBe('Bearer user-token');

    expect(internalJwtService.signUserToken).toHaveBeenCalledTimes(1);

    expect(internalJwtService.signUserToken).toHaveBeenCalledWith(
      'user-001',
      'tenant-001',
      'session-001',
      InternalAuthScope.TENANT,
      ['OWNER'],
      ['product.read'],
      {
        secret: 'test-internal-secret',
        issuer: 'petoman-gateway',
        audience: 'petoman-auth',
        expiresInSeconds: 60,
      },
    );

    expect(internalJwtService.signServiceToken).not.toHaveBeenCalled();
  });

  it('should create a user token for Market JWT requests', () => {
    const result = service.createAuthorizationHeader(
      GatewayTarget.MARKET,
      GatewayAuthMode.JWT,
      request,
    );

    expect(result).toBe('Bearer user-token');

    expect(internalJwtService.signUserToken).toHaveBeenCalledTimes(1);

    expect(internalJwtService.signUserToken).toHaveBeenCalledWith(
      'user-001',
      'tenant-001',
      'session-001',
      InternalAuthScope.TENANT,
      ['OWNER'],
      ['product.read'],
      {
        secret: 'test-internal-secret',
        issuer: 'petoman-gateway',
        audience: 'petoman-market',
        expiresInSeconds: 60,
      },
    );

    expect(internalJwtService.signServiceToken).not.toHaveBeenCalled();
  });

  it('should create a NO_TENANT internal JWT for authenticated users without tenant context', () => {
    const requestWithoutTenant = {
      ...request,
      user: {
        ...request.user,
        tenantId: null,
        roles: [],
      },
    } as unknown as AuthenticatedRequest;

    const result = service.createAuthorizationHeader(
      GatewayTarget.MARKET,
      GatewayAuthMode.JWT,
      requestWithoutTenant,
    );

    expect(result).toBe('Bearer user-token');

    expect(internalJwtService.signUserToken).toHaveBeenCalledWith(
      'user-001',
      undefined,
      'session-001',
      InternalAuthScope.NO_TENANT,
      [],
      ['product.read'],
      expect.objectContaining({
        audience: 'petoman-market',
      }),
    );
  });

  it('should create a GLOBAL internal JWT for SUPER_ADMIN without tenant context', () => {
    const globalAdminRequest = {
      ...request,
      user: {
        ...request.user,
        tenantId: null,
        roles: ['SUPER_ADMIN'],
        permissions: ['tenant.manage'],
      },
    } as unknown as AuthenticatedRequest;

    service.createAuthorizationHeader(
      GatewayTarget.MARKET,
      GatewayAuthMode.JWT,
      globalAdminRequest,
    );

    expect(internalJwtService.signUserToken).toHaveBeenCalledWith(
      'user-001',
      undefined,
      'session-001',
      InternalAuthScope.GLOBAL,
      ['SUPER_ADMIN'],
      ['tenant.manage'],
      expect.anything(),
    );
  });

  it('should preserve TENANT scope for SUPER_ADMIN with selected tenant', () => {
    const globalAdminWithTenantRequest = {
      ...request,
      user: {
        ...request.user,
        roles: ['SUPER_ADMIN'],
      },
    } as AuthenticatedRequest;

    service.createAuthorizationHeader(
      GatewayTarget.MARKET,
      GatewayAuthMode.JWT,
      globalAdminWithTenantRequest,
    );

    expect(internalJwtService.signUserToken).toHaveBeenCalledWith(
      'user-001',
      'tenant-001',
      'session-001',
      InternalAuthScope.TENANT,
      ['SUPER_ADMIN'],
      ['product.read'],
      expect.anything(),
    );
  });

  it('should reject JWT requests without authenticated user context', () => {
    const requestWithoutUser = {} as AuthenticatedRequest;

    expect(() =>
      service.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        requestWithoutUser,
      ),
    ).toThrow(UnauthorizedException);

    expect(internalJwtService.signUserToken).not.toHaveBeenCalled();

    expect(internalJwtService.signServiceToken).not.toHaveBeenCalled();
  });

  it('should reject JWT requests without session context', () => {
    const requestWithoutSession = {
      user: {
        ...request.user,
        sid: undefined,
      },
    } as unknown as AuthenticatedRequest;

    expect(() =>
      service.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        requestWithoutSession,
      ),
    ).toThrow(UnauthorizedException);

    expect(internalJwtService.signUserToken).not.toHaveBeenCalled();
  });

  it('should reject JWT requests without authorization context', () => {
    const requestWithoutPermissions = {
      user: {
        ...request.user,
        permissions: undefined,
      },
    } as unknown as AuthenticatedRequest;

    expect(() =>
      service.createAuthorizationHeader(
        GatewayTarget.AUTH,
        GatewayAuthMode.JWT,
        requestWithoutPermissions,
      ),
    ).toThrow(UnauthorizedException);

    expect(internalJwtService.signUserToken).not.toHaveBeenCalled();
  });

  it('should create a service token for public Auth requests', () => {
    const requestWithoutUser = {} as AuthenticatedRequest;

    const result = service.createAuthorizationHeader(
      GatewayTarget.AUTH,
      GatewayAuthMode.PUBLIC,
      requestWithoutUser,
    );

    expect(result).toBe('Bearer service-token');

    expect(internalJwtService.signServiceToken).toHaveBeenCalledWith({
      secret: 'test-internal-secret',
      issuer: 'petoman-gateway',
      audience: 'petoman-auth',
      expiresInSeconds: 60,
    });

    expect(internalJwtService.signUserToken).not.toHaveBeenCalled();
  });

  it('should create a service token for public Market requests', () => {
    const requestWithoutUser = {} as AuthenticatedRequest;

    const result = service.createAuthorizationHeader(
      GatewayTarget.MARKET,
      GatewayAuthMode.PUBLIC,
      requestWithoutUser,
    );

    expect(result).toBe('Bearer service-token');

    expect(internalJwtService.signServiceToken).toHaveBeenCalledWith({
      secret: 'test-internal-secret',
      issuer: 'petoman-gateway',
      audience: 'petoman-market',
      expiresInSeconds: 60,
    });

    expect(internalJwtService.signUserToken).not.toHaveBeenCalled();
  });

  it('should reject unsupported downstream targets', () => {
    expect(() =>
      service.createAuthorizationHeader(
        GatewayTarget.FINANCIAL,
        GatewayAuthMode.JWT,
        request,
      ),
    ).toThrow(
      'Internal JWT configuration is not defined for target "FINANCIAL".',
    );

    expect(internalJwtService.signUserToken).not.toHaveBeenCalled();

    expect(internalJwtService.signServiceToken).not.toHaveBeenCalled();
  });

  it('should return a Bearer authorization header', () => {
    const result = service.createAuthorizationHeader(
      GatewayTarget.AUTH,
      GatewayAuthMode.PUBLIC,
      request,
    );

    expect(result).toMatch(/^Bearer .+$/);
  });
});