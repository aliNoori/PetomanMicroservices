import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import type { Request } from "express";

import {
  INTERNAL_JWT_OPTIONS,
  InternalJwtOptions,
  InternalJwtPayload,
  InternalJwtService,
} from "./internal-jwt.service";

export interface InternalAuthenticatedRequest extends Request {
  internalAuth?: InternalJwtPayload;
}

@Injectable()
export class InternalJwtGuard implements CanActivate {
  constructor(
    private readonly internalJwtService: InternalJwtService,

    @Inject(INTERNAL_JWT_OPTIONS)
    private readonly options: InternalJwtOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<InternalAuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException("Internal authorization is required.");
    }

    const [scheme, token] = authorization.trim().split(/\s+/);

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException("Invalid internal authorization header.");
    }

    let payload: InternalJwtPayload;

    try {
      payload = this.internalJwtService.verify(token, this.options);
    } catch {
      throw new UnauthorizedException("Invalid internal authorization.");
    }

    request.internalAuth = payload;

    return true;
  }
}
