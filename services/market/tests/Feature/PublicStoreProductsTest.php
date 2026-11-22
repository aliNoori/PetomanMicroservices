<?php

namespace Tests\Feature;

use App\Http\Controllers\ProductController;
use App\Http\Middleware\TenantContextMiddleware;
use App\Http\Middleware\VerifyInternalJwt;
use App\Models\Product;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PublicStoreProductsTest extends TestCase
{
    use RefreshDatabase;
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
            '/_testing/public/stores/{storeSlug}/products',
            [ProductController::class, 'publicIndex'],
        );
    }

    public function test_store_route_returns_only_active_products_of_token_tenant(): void
    {
        Product::factory()
            ->forTenant('tenant-001')
            ->create([
                'name' => 'Active Store Product',
                'is_active' => true,
            ]);

        Product::factory()
            ->forTenant('tenant-001')
            ->create([
                'name' => 'Inactive Store Product',
                'is_active' => false,
            ]);

        Product::factory()
            ->forTenant('tenant-002')
            ->create([
                'name' => 'Other Store Product',
                'is_active' => true,
            ]);

        $token = $this->createTenantToken('tenant-001');

        $this->withToken($token)
            ->getJson('/_testing/public/stores/petoman-store/products')
            ->assertOk()
            ->assertJsonPath('data.tenant_id', 'tenant-001')
            ->assertJsonFragment([
                'name' => 'Active Store Product',
            ])
            ->assertJsonMissing([
                'name' => 'Inactive Store Product',
            ])
            ->assertJsonMissing([
                'name' => 'Other Store Product',
            ]);
    }

    public function test_global_service_token_cannot_access_store_products(): void
    {
        $token = $this->createToken([
            'scope' => 'GLOBAL',
        ]);

        $this->withToken($token)
            ->getJson('/_testing/public/stores/petoman-store/products')
            ->assertForbidden()
            ->assertJsonPath(
                'error.code',
                'TENANT_CONTEXT_REQUIRED',
            );
    }

    private function createTenantToken(string $tenantId): string
    {
        return $this->createToken([
            'scope' => 'TENANT',
            'tenantId' => $tenantId,
        ]);
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
