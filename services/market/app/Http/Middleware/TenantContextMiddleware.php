<?php

namespace App\Http\Middleware;

use App\Auth\AuthContext;
use App\Auth\InternalAuthContext;
use App\Auth\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantContextMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
    ): Response {
        /** @var AuthContext|null $auth */
        $auth = $request->attributes->get('auth');

        /** @var InternalAuthContext|null $internalAuth */
        $internalAuth = $request->attributes->get('internal_auth');

        $tenantId = null;

        if ($auth instanceof AuthContext) {
            $tenantId = $auth->tenantId;
        } elseif ($internalAuth instanceof InternalAuthContext) {
            $tenantId = $internalAuth->tenantId;
        }

        if ($tenantId === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TENANT_CONTEXT_REQUIRED',
                    'message' => 'Tenant context is required.',
                ],
            ], 403);
        }

        $tenantContext = new TenantContext(
            tenantId: $tenantId,
        );

        $request->attributes->set(
            'tenant',
            $tenantContext,
        );

        return $next($request);
    }
}