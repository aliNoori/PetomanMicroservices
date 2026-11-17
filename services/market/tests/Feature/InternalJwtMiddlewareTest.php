<?php

namespace Tests\Feature;

use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\TenantContextMiddleware;
use App\Http\Middleware\VerifyInternalJwt;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class InternalJwtMiddlewareTest extends TestCase
{
    private const SECRET = 'test-internal-jwt-secret-key-32-bytes-minimum';

    private const ISSUER = 'petoman-gateway';

    private const AUDIENCE = 'petoman-market';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.internal_jwt.secret' => self::SECRET,
            'services.internal_jwt.issuer' => self::ISSUER,
            'services.internal_jwt.audience' => self::AUDIENCE,
        ]);

        Route::middleware([
            VerifyInternalJwt::class,
            TenantContextMiddleware::class,
        ])->get(
                '/_testing/internal/tenant',
                function (Request $request) {
                    return response()->json([
                        'tenant_id' => $request->attributes
                            ->get('tenant')
                            ->tenantId,
                    ]);
                },
            );

        Route::middleware([
            VerifyInternalJwt::class,
            TenantContextMiddleware::class,
            RequirePermission::class . ':product.read',
        ])->get(
                '/_testing/internal/admin',
                fn() => response()->json([
                    'success' => true,
                ]),
            );

        Route::middleware(VerifyInternalJwt::class)->post(
            '/_testing/internal/home-products',
            function (Request $request) {
                $auth = $request->attributes->get('internal_auth');

                if (
                    !$auth instanceof \App\Auth\InternalAuthContext
                    || !$auth->isGlobalService()
                ) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'code' => 'AUTH_GLOBAL_SERVICE_REQUIRED',
                            'message' => 'A global service token is required.',
                        ],
                    ], 403);
                }

                return response()->json([
                    'success' => true,
                ]);
            },
        );
    }

    public function test_tenant_service_token_can_access_tenant_route(): void
    {
        $token = $this->createToken([
            'scope' => 'TENANT',
            'tenantId' => 'tenant-001',
        ]);

        $this->withToken($token)
            ->getJson('/_testing/internal/tenant')
            ->assertOk()
            ->assertJsonPath('tenant_id', 'tenant-001');
    }

    public function test_tenant_service_token_cannot_access_admin_route(): void
    {
        $token = $this->createToken([
            'scope' => 'TENANT',
            'tenantId' => 'tenant-001',
        ]);

        $this->withToken($token)
            ->getJson('/_testing/internal/admin')
            ->assertForbidden()
            ->assertJsonPath('error.code', 'AUTH_FORBIDDEN');
    }

    public function test_global_service_token_cannot_access_tenant_route(): void
    {
        $token = $this->createToken([
            'scope' => 'GLOBAL',
        ]);

        $this->withToken($token)
            ->getJson('/_testing/internal/tenant')
            ->assertForbidden()
            ->assertJsonPath('error.code', 'TENANT_CONTEXT_REQUIRED');
    }



    public function test_global_service_token_can_access_home_products_route(): void
    {
        $token = $this->createToken([
            'scope' => 'GLOBAL',
        ]);

        $this->withToken($token)
            ->postJson('/_testing/internal/home-products')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_tenant_service_token_cannot_access_home_products_route(): void
    {
        $token = $this->createToken([
            'scope' => 'TENANT',
            'tenantId' => 'tenant-001',
        ]);

        $this->withToken($token)
            ->postJson('/_testing/internal/home-products')
            ->assertForbidden()
            ->assertJsonPath(
                'error.code',
                'AUTH_GLOBAL_SERVICE_REQUIRED',
            );
    }

    public function test_user_token_cannot_access_home_products_route(): void
    {
        $token = $this->createToken([
            'scope' => 'NO_TENANT',
            'userId' => 'user-001',
            'sid' => 'session-001',
            'roles' => ['USER'],
            'permissions' => [],
        ]);

        $this->withToken($token)
            ->postJson('/_testing/internal/home-products')
            ->assertForbidden()
            ->assertJsonPath(
                'error.code',
                'AUTH_GLOBAL_SERVICE_REQUIRED',
            );
    }


    private function createToken(array $claims): string
    {
        return JWT::encode(
            array_merge([
                'sub' => 'gateway',
                'type' => 'internal',
                'iss' => self::ISSUER,
                'aud' => self::AUDIENCE,
                'iat' => time(),
                'exp' => time() + 60,
            ], $claims),
            self::SECRET,
            'HS256',
        );
    }
}
