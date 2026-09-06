<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;
use App\Auth\AuthContext;

class VerifyJwt
{
    public function handle(
        Request $request,
        Closure $next,
    ): Response {
        $authorization = $request->header('Authorization');

        // ============================================================
        // Authorization Header
        // ============================================================

        if (!$authorization) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_UNAUTHORIZED',
                    'message' => 'Authentication required.',
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
            // ========================================================
            // Public Key
            // ========================================================

            $publicKey = file_get_contents(
                base_path('keys/public.pem'),
            );

            if ($publicKey === false) {
                throw new \RuntimeException(
                    'Public key could not be loaded.',
                );
            }

            // ========================================================
            // JWT Verification
            // ========================================================

            $payload = JWT::decode(
                $token,
                new Key($publicKey, 'RS256'),
            );

            // ========================================================
            // Issuer
            // ========================================================

            if (($payload->iss ?? null) !== 'petoman-auth') {
                throw new \RuntimeException(
                    'Invalid issuer.',
                );
            }

            // ========================================================
            // Audience
            // ========================================================

            $audience = $payload->aud ?? null;

            if (
                $audience !== 'petoman-api'
                && !(
                    is_array($audience)
                    && in_array(
                        'petoman-api',
                        $audience,
                        true,
                    )
                )
            ) {
                throw new \RuntimeException(
                    'Invalid audience.',
                );
            }

            // ========================================================
            // Required Subject
            // ========================================================

            $userId = $payload->sub ?? null;

            if (!is_string($userId) || $userId === '') {
                throw new \RuntimeException(
                    'Invalid subject.',
                );
            }

            // ========================================================
            // Tenant Context
            //
            // Login token:
            // tenantId = null
            //
            // Selected-tenant token:
            // tenantId = selected tenant UUID
            // ========================================================

            $tenantId = $payload->tenantId ?? null;

            if ($tenantId !== null && !is_string($tenantId)) {
                throw new \RuntimeException(
                    'Invalid tenant context.',
                );
            }

            // ========================================================
            // Roles
            // ========================================================

            $roles = $payload->roles ?? [];

            if (!is_array($roles)) {
                throw new \RuntimeException(
                    'Invalid roles claim.',
                );
            }

            // ========================================================
            // Permissions
            // ========================================================

            $permissions = $payload->permissions ?? [];

            if (!is_array($permissions)) {
                throw new \RuntimeException(
                    'Invalid permissions claim.',
                );
            }

            // ========================================================
            // Email
            // ========================================================

            $email = $payload->email ?? null;

            if ($email !== null && !is_string($email)) {
                throw new \RuntimeException(
                    'Invalid email claim.',
                );
            }

            // ========================================================
// Request Authentication Context
// ========================================================

            $authContext = new AuthContext(
                userId: $userId,
                tenantId: $tenantId,
                email: $email ?? '',
                roles: $roles,
                permissions: $permissions,
            );

            $request->attributes->set(
                'auth',
                $authContext,
            );

            return $next($request);

        } catch (Throwable) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_UNAUTHORIZED',
                    'message' => 'Invalid or expired token.',
                ],
            ], 401);
        }
    }
}
