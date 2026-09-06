import { describe, expect, it, beforeEach } from '@jest/globals';

import {
  InternalJwtGuard,
  InternalAuthenticatedRequest,
} from "./internal-jwt.guard";

import {
  InternalJwtService,
  InternalJwtOptions,
  InternalAuthScope,
} from "./internal-jwt.service";

describe("InternalJwtGuard", () => {
  let guard: InternalJwtGuard;
  let service: InternalJwtService;

  const options: InternalJwtOptions = {
    secret: "test-internal-secret",
    issuer: "petoman-gateway",
    audience: "petoman-market",
    expiresInSeconds: 60,
  };

  beforeEach(() => {
    service = new InternalJwtService();

    guard = new InternalJwtGuard(service, options);
  });

  const createContext = (authorization?: string) => {
    const request = {
      headers: {
        authorization,
      },
    } as InternalAuthenticatedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    } as any;
  };

  it("should allow a valid internal JWT", () => {
    const token = service.signTenantToken("tenant-001", options);

    const context = createContext(`Bearer ${token}`);

    expect(guard.canActivate(context)).toBe(true);

    expect(context.request.internalAuth).toMatchObject({
      sub: "gateway",
      tenantId: "tenant-001",
      scope: InternalAuthScope.TENANT,
      type: "internal",
      iss: "petoman-gateway",
      aud: "petoman-market",
    });
  });

  it("should reject a missing authorization header", () => {
    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow();
  });

  it("should reject a non-Bearer authorization header", () => {
    const context = createContext("Basic some-token");

    expect(() => guard.canActivate(context)).toThrow();
  });

  it("should reject an invalid token", () => {
    const context = createContext("Bearer invalid-token");

    expect(() => guard.canActivate(context)).toThrow();
  });

  it("should reject a token signed with another secret", () => {
    const token = service.signTenantToken("tenant-001", {
      ...options,
      secret: "another-secret",
    });

    const context = createContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context)).toThrow();
  });

  it("should reject a token with another audience", () => {
    const token = service.signTenantToken("tenant-001", {
      ...options,
      audience: "another-service",
    });

    const context = createContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context)).toThrow();
  });

  it("should reject a token with another issuer", () => {
    const token = service.signTenantToken("tenant-001", {
      ...options,
      issuer: "another-service",
    });

    const context = createContext(`Bearer ${token}`);

    expect(() => guard.canActivate(context)).toThrow();
  });
});
