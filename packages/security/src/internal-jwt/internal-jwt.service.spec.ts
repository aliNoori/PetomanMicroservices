import { describe, expect, it, beforeEach } from '@jest/globals';
import { InternalAuthScope, InternalJwtService } from "./internal-jwt.service";
import { verify, JwtPayload, sign } from "jsonwebtoken";

describe("InternalJwtService", () => {
  let service: InternalJwtService;

  const options = {
    secret: "test-internal-secret",
    issuer: "petoman-gateway",
    audience: "petoman-market",
    expiresInSeconds: 60,
  };

  beforeEach(() => {
    service = new InternalJwtService();
  });

  it("should sign a valid internal tenant token", () => {
    const token = service.signTenantToken("tenant-001", options);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should contain the correct internal claims", () => {
    const token = service.signTenantToken("tenant-001", options);

    const decoded = verify(token, options.secret, {
      issuer: options.issuer,
      audience: options.audience,
    }) as JwtPayload & {
      tenantId: string;
      type: string;
    };

    expect(decoded.sub).toBe("gateway");
    expect(decoded.tenantId).toBe("tenant-001");
    expect(decoded.type).toBe("internal");
  });

  it("should contain issuer and audience", () => {
    const token = service.signTenantToken("tenant-001", options);

    const decoded = verify(token, options.secret) as JwtPayload;

    expect(decoded.iss).toBe("petoman-gateway");

    expect(decoded.aud).toBe("petoman-market");
  });

  it("should contain an expiration time", () => {
    const before = Math.floor(Date.now() / 1000);

    const token = service.signTenantToken("tenant-001", options);

    const decoded = verify(token, options.secret) as JwtPayload;

    const after = Math.floor(Date.now() / 1000);

    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();

    expect(decoded.exp!).toBeGreaterThanOrEqual(
      before + options.expiresInSeconds,
    );

    expect(decoded.exp!).toBeLessThanOrEqual(after + options.expiresInSeconds);
  });

  it("should reject a token with an invalid secret", () => {
    const token = service.signTenantToken("tenant-001", options);

    expect(() => verify(token, "wrong-secret")).toThrow();
  });

  it("should reject a token with an invalid audience", () => {
    const token = service.signTenantToken("tenant-001", options);

    expect(() =>
      verify(token, options.secret, {
        audience: "another-service",
      }),
    ).toThrow();
  });

  it("should reject a token with an invalid issuer", () => {
    const token = service.signTenantToken("tenant-001", options);

    expect(() =>
      verify(token, options.secret, {
        issuer: "another-service",
      }),
    ).toThrow();
  });

  it("should verify a valid internal tenant token", () => {
    const token = service.signTenantToken("tenant-001", options);

    const payload = service.verify(token, options);

    expect(payload).toMatchObject({
      sub: "gateway",
      tenantId: "tenant-001",
      type: "internal",
    });
  });

  it("should reject a token with an invalid secret", () => {
    const token = service.signTenantToken("tenant-001", options);

    expect(() =>
      service.verify(token, {
        ...options,
        secret: "wrong-secret",
      }),
    ).toThrow();
  });

  it("should reject a token with an invalid issuer", () => {
    const token = service.signTenantToken("tenant-001", options);

    expect(() =>
      service.verify(token, {
        ...options,
        issuer: "another-service",
      }),
    ).toThrow();
  });

  it("should reject a token with an invalid audience", () => {
    const token = service.signTenantToken("tenant-001", options);

    expect(() =>
      service.verify(token, {
        ...options,
        audience: "another-service",
      }),
    ).toThrow();
  });

  it("should reject a token with an invalid internal type", () => {
    const token = service.signTenantToken("tenant-001", options);

    const parts = token.split(".");

    const payload = Buffer.from(
      JSON.stringify({
        sub: "gateway",
        tenantId: "tenant-001",
        type: "user",
      }),
    ).toString("base64url");

    const forgedToken = `${parts[0]}.${payload}.${parts[2]}`;

    expect(() => service.verify(forgedToken, options)).toThrow();
  });

  it("should sign a valid internal service token", () => {
    const token = service.signServiceToken(options);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should contain the correct service token claims", () => {
    const token = service.signServiceToken(options);

    const decoded = verify(token, options.secret, {
      issuer: options.issuer,
      audience: options.audience,
    }) as JwtPayload & {
      type: string;
    };

    expect(decoded.sub).toBe("gateway");
    expect(decoded.type).toBe("internal");
    expect(decoded.tenantId).toBeUndefined();
  });

  it("should contain issuer and audience in service token", () => {
    const token = service.signServiceToken(options);

    const decoded = verify(token, options.secret) as JwtPayload;

    expect(decoded.iss).toBe("petoman-gateway");
    expect(decoded.aud).toBe("petoman-market");
  });

  it("should contain an expiration time in service token", () => {
    const before = Math.floor(Date.now() / 1000);

    const token = service.signServiceToken(options);

    const decoded = verify(token, options.secret) as JwtPayload;

    const after = Math.floor(Date.now() / 1000);

    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();

    expect(decoded.exp!).toBeGreaterThanOrEqual(
      before + options.expiresInSeconds,
    );

    expect(decoded.exp!).toBeLessThanOrEqual(after + options.expiresInSeconds);
  });

  it("should verify a valid internal service token", () => {
    const token = service.signServiceToken(options);

    const payload = service.verify(token, options);

    expect(payload).toMatchObject({
      sub: "gateway",
      type: "internal",
    });

    expect(payload.tenantId).toBeUndefined();
  });

  it("should reject a service token with an invalid secret", () => {
    const token = service.signServiceToken(options);

    expect(() =>
      service.verify(token, {
        ...options,
        secret: "wrong-secret",
      }),
    ).toThrow();
  });

  it("should reject a service token with an invalid audience", () => {
    const token = service.signServiceToken(options);

    expect(() =>
      service.verify(token, {
        ...options,
        audience: "another-service",
      }),
    ).toThrow();
  });

  it("should sign and verify a valid no-tenant user token", () => {
    const token = service.signUserToken(
      "user-001",
      undefined,
      InternalAuthScope.NO_TENANT,
      options,
    );

    const payload = service.verify(token, options);

    expect(payload).toMatchObject({
      sub: "gateway",
      type: "internal",
      scope: InternalAuthScope.NO_TENANT,
      userId: "user-001",
    });

    expect(payload.tenantId).toBeUndefined();
  });

  it("should reject a token with an invalid internal auth scope", () => {
    const token = sign(
      {
        sub: "gateway",
        tenantId: "tenant-001",
        scope: "INVALID_SCOPE",
        type: "internal",
      },
      options.secret,
      {
        issuer: options.issuer,
        audience: options.audience,
        expiresIn: options.expiresInSeconds,
      },
    );

    expect(() => service.verify(token, options)).toThrow(
      "Invalid internal auth scope.",
    );
  });
});
