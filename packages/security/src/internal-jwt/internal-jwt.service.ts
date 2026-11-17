
import { Injectable } from "@nestjs/common";
import { sign, verify } from "jsonwebtoken";

export const INTERNAL_JWT_OPTIONS = Symbol("INTERNAL_JWT_OPTIONS");

export enum InternalAuthScope {
  GLOBAL = "GLOBAL",
  TENANT = "TENANT",
  NO_TENANT = "NO_TENANT",
}

export interface InternalJwtPayload {
  readonly sub: "gateway";
  readonly type: "internal";
  readonly scope: InternalAuthScope;
  readonly userId?: string;
  readonly tenantId?: string;
  readonly sid?: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
}

export interface InternalJwtOptions {
  readonly secret: string;
  readonly issuer: string;
  readonly audience: string;
  readonly expiresInSeconds: number;
}

@Injectable()
export class InternalJwtService {
  signUserToken(
    userId: string,
    tenantId: string | undefined,
    sid: string,
    scope: InternalAuthScope,
    roles: readonly string[],
    permissions: readonly string[],
    options: InternalJwtOptions,
  ): string {
    const payload: InternalJwtPayload = {
      sub: "gateway",
      type: "internal",
      scope,
      userId,
      sid,
      roles,
      permissions,
      ...(tenantId ? { tenantId } : {}),
    };

    return sign(payload, options.secret, {
      algorithm: "HS256",
      issuer: options.issuer,
      audience: options.audience,
      expiresIn: options.expiresInSeconds,
    });
  }

  signTenantToken(tenantId: string, options: InternalJwtOptions): string {
    const payload: InternalJwtPayload = {
      sub: "gateway",
      tenantId,
      scope: InternalAuthScope.TENANT,
      type: "internal",
    };

    return sign(payload, options.secret, {
      algorithm: "HS256",
      issuer: options.issuer,
      audience: options.audience,
      expiresIn: options.expiresInSeconds,
    });
  }

  signServiceToken(options: InternalJwtOptions): string {
    const payload: InternalJwtPayload = {
      sub: "gateway",
      scope: InternalAuthScope.GLOBAL,
      type: "internal",
    };

    return sign(payload, options.secret, {
      algorithm: "HS256",
      issuer: options.issuer,
      audience: options.audience,
      expiresIn: options.expiresInSeconds,
    });
  }

  verify(token: string, options: InternalJwtOptions): InternalJwtPayload {
    const decoded = verify(token, options.secret, {
      algorithms: ["HS256"],
      issuer: options.issuer,
      audience: options.audience,
    });

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      decoded.sub !== "gateway" ||
      decoded.type !== "internal"
    ) {
      throw new Error("Invalid internal JWT.");
    }

    if (
      decoded.scope !== InternalAuthScope.GLOBAL &&
      decoded.scope !== InternalAuthScope.TENANT &&
      decoded.scope !== InternalAuthScope.NO_TENANT
    ) {
      throw new Error("Invalid internal auth scope.");
    }

    if (
      "userId" in decoded &&
      decoded.userId !== undefined &&
      (typeof decoded.userId !== "string" || decoded.userId.trim().length === 0)
    ) {
      throw new Error("Invalid internal user ID.");
    }

    if (
      "sid" in decoded &&
      decoded.sid !== undefined &&
      (typeof decoded.sid !== "string" || decoded.sid.trim().length === 0)
    ) {
      throw new Error("Invalid internal session ID.");
    }

    if (decoded.userId && !decoded.sid) {
      throw new Error("Internal user JWT must contain a session ID.");
    }

    if (
      "tenantId" in decoded &&
      decoded.tenantId !== undefined &&
      (typeof decoded.tenantId !== "string" ||
        decoded.tenantId.trim().length === 0)
    ) {
      throw new Error("Invalid internal tenant ID.");
    }

    if (decoded.userId) {
      if (
        !Array.isArray(decoded.roles) ||
        !decoded.roles.every(
          (role: unknown) =>
            typeof role === "string" && role.trim().length > 0,
        )
      ) {
        throw new Error("Invalid internal user roles.");
      }

      if (
        !Array.isArray(decoded.permissions) ||
        !decoded.permissions.every(
          (permission: unknown) =>
            typeof permission === "string" && permission.trim().length > 0,
        )
      ) {
        throw new Error("Invalid internal user permissions.");
      }
    } else if (
      decoded.roles !== undefined ||
      decoded.permissions !== undefined
    ) {
      throw new Error("Service JWT must not contain user authorization claims.");
    }

    // GLOBAL requests must not carry a tenant context.
    // They may represent either a user or a trusted service.
    if (
      decoded.scope === InternalAuthScope.GLOBAL &&
      decoded.tenantId !== undefined
    ) {
      throw new Error("Invalid GLOBAL internal JWT.");
    }

    if (decoded.scope === InternalAuthScope.TENANT && !decoded.tenantId) {
      throw new Error("Invalid TENANT internal JWT.");
    }

    if (
      decoded.scope === InternalAuthScope.NO_TENANT &&
      (!decoded.userId || decoded.tenantId !== undefined)
    ) {
      throw new Error("Invalid NO_TENANT internal JWT.");
    }

    return decoded as InternalJwtPayload;
  }
}
