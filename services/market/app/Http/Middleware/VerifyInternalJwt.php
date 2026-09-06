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

        // ============================================================
        // Authorization Header
        // ============================================================

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
            // ========================================================
            // Internal JWT Configuration
            // ========================================================

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

            // ========================================================
            // JWT Verification
            // ========================================================

            $payload = JWT::decode(
                $token,
                new Key($secret, 'HS256'),
            );

            // ========================================================
            // Internal JWT Type
            // ========================================================

            if (($payload->type ?? null) !== 'internal') {
                throw new \RuntimeException(
                    'Invalid internal JWT type.',
                );
            }

            // ========================================================
            // Subject
            // ========================================================

            if (($payload->sub ?? null) !== 'gateway') {
                throw new \RuntimeException(
                    'Invalid internal JWT subject.',
                );
            }

            // ========================================================
            // Issuer
            // ========================================================

            if (($payload->iss ?? null) !== $issuer) {
                throw new \RuntimeException(
                    'Invalid internal JWT issuer.',
                );
            }

            // ========================================================
            // Audience
            // ========================================================

            $tokenAudience = $payload->aud ?? null;

            if (
                $tokenAudience !== $audience
                && !(
                    is_array($tokenAudience)
                    && in_array(
                        $audience,
                        $tokenAudience,
                        true,
                    )
                )
            ) {
                throw new \RuntimeException(
                    'Invalid internal JWT audience.',
                );
            }

            // ========================================================
            // Tenant Context
            // ========================================================

            $tenantId = $payload->tenantId ?? null;

            if (
                $tenantId !== null
                && !is_string($tenantId)
            ) {
                throw new \RuntimeException(
                    'Invalid internal tenant context.',
                );
            }

            // ========================================================
            // Internal Authentication Context
            // ========================================================

            $internalAuthContext = new InternalAuthContext(
                service: 'gateway',
                tenantId: $tenantId,
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