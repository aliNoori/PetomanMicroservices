import { randomUUID } from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

export interface RequestWithId extends Request {
  requestId: string;
}

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const requestId = request.header('x-request-id') ?? randomUUID();

  request.headers['x-request-id'] = requestId;
  response.setHeader('x-request-id', requestId);

  (request as RequestWithId).requestId = requestId;

  next();
}