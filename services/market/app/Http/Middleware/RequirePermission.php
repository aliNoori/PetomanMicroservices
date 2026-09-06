<?php

namespace App\Http\Middleware;

use App\Auth\AuthContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission,
    ): Response {
        /** @var AuthContext|null $auth */
        $auth = $request->attributes->get('auth');

        if (!$auth instanceof AuthContext) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_CONTEXT_REQUIRED',
                    'message' => 'Authentication context is required.',
                ],
            ], 401);
        }

        if (!in_array($permission, $auth->permissions, true)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_FORBIDDEN',
                    'message' => 'You do not have permission to perform this action.',
                ],
            ], 403);
        }

        return $next($request);
    }
}