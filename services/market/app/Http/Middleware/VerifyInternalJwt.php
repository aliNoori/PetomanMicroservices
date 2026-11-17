<?php

namespace App\Http\Middleware;

use App\Auth\InternalAuthContext;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class VerifyInternalJwt
{
    public function handle(
        Request $request,
        Closure $next,
    ): Response {
        $authorization = $request->header('Authorization');

        if (!$authorization) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_UNAUTHORIZED',
                    'message' => 'Internal authentication required.',
                ],
            ], 401);
        }

        if (
            !preg_match(
                '/^Bearer\s+(.+)$/i',
                $authorization,
                $matches,
            )
        ) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_UNAUTHORIZED',
                    'message' => 'Invalid authorization header.',
                ],
            ], 401);
        }

        $token = $matches[1];

        try {
            // Internal JWT configuration.

            $secret = config('services.internal_jwt.secret');
            $issuer = config('services.internal_jwt.issuer');
            $audience = config('services.internal_jwt.audience');

            if (
                !is_string($secret)
                || $secret === ''
                || !is_string($issuer)
                || $issuer === ''
                || !is_string($audience)
                || $audience === ''
            ) {
                throw new \RuntimeException(
                    'Internal JWT configuration is invalid.',
                );
            }

            // Verify JWT signature and registered claims.

            $payload = JWT::decode(
                $token,
                new Key($secret, 'HS256'),
            );

            if (
                ($payload->type ?? null) !== 'internal'
                || ($payload->sub ?? null) !== 'gateway'
                || ($payload->iss ?? null) !== $issuer
            ) {
                throw new \RuntimeException(
                    'Invalid internal JWT identity.',
                );
            }

            $tokenAudience = $payload->aud ?? null;

            if (
                $tokenAudience !== $audience
                && !(
                    is_array($tokenAudience)
                    && in_array($audience, $tokenAudience, true)
                )
            ) {
                throw new \RuntimeException(
                    'Invalid internal JWT audience.',
                );
            }

            // Validate authentication scope.

            $scope = $payload->scope ?? null;

            if (
                !is_string($scope)
                || !in_array(
                    $scope,
                    ['GLOBAL', 'TENANT', 'NO_TENANT'],
                    true,
                )
            ) {
                throw new \RuntimeException(
                    'Invalid internal authentication scope.',
                );
            }

            // Validate tenant context.

            $tenantId = $payload->tenantId ?? null;

            if (
                $tenantId !== null
                && (
                    !is_string($tenantId)
                    || trim($tenantId) === ''
                )
            ) {
                throw new \RuntimeException(
                    'Invalid internal tenant context.',
                );
            }

            // Validate user identity.

            $userId = $payload->userId ?? null;
            $sid = $payload->sid ?? null;

            $isUserToken = $userId !== null;

            if ($isUserToken) {
                if (
                    !is_string($userId)
                    || trim($userId) === ''
                    || !is_string($sid)
                    || trim($sid) === ''
                ) {
                    throw new \RuntimeException(
                        'Invalid internal user identity.',
                    );
                }

                // User authorization claims must be valid arrays.

                $roles = $payload->roles ?? null;
                $permissions = $payload->permissions ?? null;

                if (
                    !is_array($roles)
                    || !array_is_list($roles)
                    || !is_array($permissions)
                    || !array_is_list($permissions)
                ) {
                    throw new \RuntimeException(
                        'Invalid internal authorization context.',
                    );
                }

                foreach ([$roles, $permissions] as $claimValues) {
                    foreach ($claimValues as $value) {
                        if (
                            !is_string($value)
                            || trim($value) === ''
                        ) {
                            throw new \RuntimeException(
                                'Invalid internal authorization claim.',
                            );
                        }
                    }
                }
            } else {
                // Service tokens must not carry user authorization claims.

                if (
                    property_exists($payload, 'userId')
                    || property_exists($payload, 'sid')
                    || property_exists($payload, 'roles')
                    || property_exists($payload, 'permissions')
                ) {
                    throw new \RuntimeException(
                        'Invalid internal service token.',
                    );
                }

                $isGlobalServiceToken =
                    $scope === 'GLOBAL'
                    && $tenantId === null;

                $isTenantServiceToken =
                    $scope === 'TENANT'
                    && $tenantId !== null;

                if (!$isGlobalServiceToken && !$isTenantServiceToken) {
                    throw new \RuntimeException(
                        'Invalid internal service token scope.',
                    );
                }

                $roles = [];
                $permissions = [];
            }

            // Validate scope and tenant consistency.

            if (
                ($scope === 'GLOBAL' && $tenantId !== null)
                || ($scope === 'TENANT' && $tenantId === null)
                || ($scope === 'NO_TENANT' && $tenantId !== null)
                || ($scope === 'NO_TENANT' && !$isUserToken)
            ) {
                throw new \RuntimeException(
                    'Internal authentication scope mismatch.',
                );
            }

            // Build trusted internal authentication context.

            $internalAuthContext = new InternalAuthContext(
                service: 'gateway',
                scope: $scope,
                userId: $userId,
                tenantId: $tenantId,
                sid: $sid,
                roles: $roles,
                permissions: $permissions,
            );

            $request->attributes->set(
                'internal_auth',
                $internalAuthContext,
            );

            return $next($request);
        } catch (Throwable) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_UNAUTHORIZED',
                    'message' => 'Invalid or expired internal token.',
                ],
            ], 401);
        }
    }
}
