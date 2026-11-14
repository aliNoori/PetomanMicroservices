import { GatewayRouteFactory } from '../../registry/gateway-route.factory';

import {
  GatewayAuthMode,
  GatewayTarget,
} from '../../gateway-route.types';

/**
 * Retrieve a private file using a signed URL.
 *
 * Security:
 * - Public from the user's JWT perspective.
 * - Access is authorized by the signed URL.
 * - The Auth service validates the signature and expiration.
 * - The Gateway injects its Internal JWT for service-to-service
 *   authentication.
 */
export const storageDownloadRoute = GatewayRouteFactory.proxy(
  'GET',
  '/api/storage',
  GatewayTarget.AUTH,
  '/api/storage',
  GatewayAuthMode.PUBLIC,
  [],
  'binary',
  false,
);