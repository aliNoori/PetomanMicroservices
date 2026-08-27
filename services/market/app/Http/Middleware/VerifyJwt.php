<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class VerifyJwt
{
    public function handle(
        Request $request,
        Closure $next,
    ): Response {

        $authorization =
            $request->header('Authorization');

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
            $publicKey = file_get_contents(
                base_path('keys/public.pem'),
            );

            if ($publicKey === false) {
                throw new \RuntimeException(
                    'Public key could not be loaded.',
                );
            }

            $payload = JWT::decode(
                $token,
                new Key($publicKey, 'RS256'),
            );

            if (($payload->iss ?? null) !== 'petoman-auth') {
                throw new \RuntimeException(
                    'Invalid issuer.',
                );
            }

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

            $request->attributes->set(
                'jwt',
                $payload,
            );

            $request->attributes->set(
                'user_id',
                $payload->sub ?? null,
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