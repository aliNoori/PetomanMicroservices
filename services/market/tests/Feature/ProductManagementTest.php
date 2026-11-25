<?php

namespace Tests\Feature;

use App\Cache\ProductCache;
use App\Http\Controllers\ProductController;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\TenantContextMiddleware;
use App\Http\Middleware\VerifyInternalJwt;
use App\Models\Product;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Mockery\MockInterface;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-internal-jwt-secret-key-32-bytes-minimum';

    private const ISSUER = 'petoman-gateway';

    private const AUDIENCE = 'petoman-market';

    private const TENANT_A = 'tenant-001';

    private const TENANT_B = 'tenant-002';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.internal_jwt.secret' => self::SECRET,
            'services.internal_jwt.issuer' => self::ISSUER,
            'services.internal_jwt.audience' => self::AUDIENCE,
        ]);

        $this->mock(
            ProductCache::class,
            function (MockInterface $mock): void {
                $mock->shouldReceive('getList')
                    ->zeroOrMoreTimes()
                    ->andReturn(null);

                $mock->shouldReceive('putList')
                    ->zeroOrMoreTimes();

                $mock->shouldReceive('forgetTenant')
                    ->zeroOrMoreTimes();
            },
        );
    }

    public function test_user_can_create_product_for_token_tenant(): void
    {
        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.create'],
        );

        $this->withToken($token)
            ->postJson('/api/products', [
                'name' => 'Tenant A Product',
                'description' => 'Test product',
                'price' => 150000,
                'stock' => 12,
                'is_active' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.tenant_id', self::TENANT_A)
            ->assertJsonPath('data.product.name', 'Tenant A Product')
            ->assertJsonPath('data.product.price', 150000);

        $this->assertDatabaseHas('products', [
            'tenant_id' => self::TENANT_A,
            'name' => 'Tenant A Product',
            'price' => 150000,
        ]);
    }

    public function test_create_ignores_forged_tenant_id_from_request(): void
    {
        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.create'],
        );

        $this->withToken($token)
            ->postJson('/api/products', [
                'tenant_id' => self::TENANT_B,
                'name' => 'Trusted Tenant Product',
                'price' => 200000,
            ])
            ->assertCreated()
            ->assertJsonPath('data.tenant_id', self::TENANT_A)
            ->assertJsonPath('data.product.tenant_id', self::TENANT_A);

        $this->assertDatabaseHas('products', [
            'tenant_id' => self::TENANT_A,
            'name' => 'Trusted Tenant Product',
        ]);

        $this->assertDatabaseMissing('products', [
            'tenant_id' => self::TENANT_B,
            'name' => 'Trusted Tenant Product',
        ]);
    }

    public function test_user_without_create_permission_cannot_create_product(): void
    {
        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.read'],
        );

        $this->withToken($token)
            ->postJson('/api/products', [
                'name' => 'Forbidden Product',
                'price' => 100000,
            ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'AUTH_FORBIDDEN');

        $this->assertDatabaseMissing('products', [
            'name' => 'Forbidden Product',
        ]);
    }

    public function test_user_can_read_product_from_own_tenant(): void
    {
        $product = Product::factory()
            ->forTenant(self::TENANT_A)
            ->create();

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.read'],
        );

        $this->withToken($token)
            ->getJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.tenant_id', self::TENANT_A)
            ->assertJsonPath('data.product.id', $product->id);
    }

    public function test_user_cannot_read_product_from_another_tenant(): void
    {
        $product = Product::factory()
            ->forTenant(self::TENANT_B)
            ->create();

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.read'],
        );

        $this->withToken($token)
            ->getJson("/api/products/{$product->id}")
            ->assertNotFound();
    }

    public function test_user_can_update_product_from_own_tenant(): void
    {
        $product = Product::factory()
            ->forTenant(self::TENANT_A)
            ->create([
                'name' => 'Original Product',
                'price' => 100000,
            ]);

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.update'],
        );

        $this->withToken($token)
            ->putJson("/api/products/{$product->id}", [
                'name' => 'Updated Product',
                'price' => 250000,
            ])
            ->assertOk()
            ->assertJsonPath('data.product.name', 'Updated Product')
            ->assertJsonPath('data.product.price', 250000);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'tenant_id' => self::TENANT_A,
            'name' => 'Updated Product',
            'price' => 250000,
        ]);
    }

    public function test_user_cannot_update_product_from_another_tenant(): void
    {
        $product = Product::factory()
            ->forTenant(self::TENANT_B)
            ->create([
                'name' => 'Tenant B Product',
            ]);

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.update'],
        );

        $this->withToken($token)
            ->putJson("/api/products/{$product->id}", [
                'name' => 'Modified By Tenant A',
            ])
            ->assertNotFound();

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'tenant_id' => self::TENANT_B,
            'name' => 'Tenant B Product',
        ]);
    }

    public function test_user_can_delete_product_from_own_tenant(): void
    {
        $product = Product::factory()
            ->forTenant(self::TENANT_A)
            ->create();

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.delete'],
        );

        $this->withToken($token)
            ->deleteJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('products', [
            'id' => $product->id,
        ]);
    }

    public function test_user_cannot_delete_product_from_another_tenant(): void
    {
        $product = Product::factory()
            ->forTenant(self::TENANT_B)
            ->create();

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.delete'],
        );

        $this->withToken($token)
            ->deleteJson("/api/products/{$product->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'tenant_id' => self::TENANT_B,
        ]);
    }

    public function test_tenant_service_token_cannot_manage_products(): void
    {
        $token = $this->createToken([
            'scope' => 'TENANT',
            'tenantId' => self::TENANT_A,
        ]);

        $this->withToken($token)
            ->postJson('/api/products', [
                'name' => 'Service Product',
                'price' => 100000,
            ])
            ->assertForbidden()
            ->assertJsonPath('error.code', 'AUTH_FORBIDDEN');
    }

    public function test_global_service_token_cannot_access_tenant_products(): void
    {
        $token = $this->createToken([
            'scope' => 'GLOBAL',
        ]);

        $this->withToken($token)
            ->getJson('/api/products')
            ->assertForbidden()
            ->assertJsonPath(
                'error.code',
                'TENANT_CONTEXT_REQUIRED',
            );
    }

    public function test_user_can_create_product_with_image_key(): void
    {
        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.create'],
        );

        $imageKey = 'tenants/' . self::TENANT_A . '/products/new-image.webp';

        $this->withToken($token)
            ->postJson('/api/products', [
                'name' => 'Product With Image',
                'price' => 150000,
                'image_key' => $imageKey,
            ])
            ->assertCreated()
            ->assertJsonPath('data.product.name', 'Product With Image');

        $this->assertDatabaseHas('products', [
            'tenant_id' => self::TENANT_A,
            'name' => 'Product With Image',
            'image_key' => $imageKey,
        ]);
    }

    public function test_update_returns_previous_image_key_when_replacing_image(): void
    {
        $oldImageKey = 'tenants/' . self::TENANT_A . '/products/old-image.webp';
        $newImageKey = 'tenants/' . self::TENANT_A . '/products/new-image.webp';

        $product = Product::factory()
            ->forTenant(self::TENANT_A)
            ->create([
                'image_key' => $oldImageKey,
            ]);

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.update'],
        );

        $this->withToken($token)
            ->putJson("/api/products/{$product->id}", [
                'image_key' => $newImageKey,
            ])
            ->assertOk()
            ->assertJsonPath('data.previous_image_key', $oldImageKey);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'tenant_id' => self::TENANT_A,
            'image_key' => $newImageKey,
        ]);
    }

    public function test_update_without_new_image_preserves_existing_image_key(): void
    {
        $imageKey = 'tenants/' . self::TENANT_A . '/products/existing-image.webp';

        $product = Product::factory()
            ->forTenant(self::TENANT_A)
            ->create([
                'name' => 'Product With Existing Image',
                'image_key' => $imageKey,
            ]);

        $token = $this->createUserToken(
            self::TENANT_A,
            ['product.update'],
        );

        $this->withToken($token)
            ->putJson("/api/products/{$product->id}", [
                'name' => 'Updated Product Name',
            ])
            ->assertOk()
            ->assertJsonPath('data.previous_image_key', $imageKey);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'tenant_id' => self::TENANT_A,
            'name' => 'Updated Product Name',
            'image_key' => $imageKey,
        ]);
    }

    private function createUserToken(
        string $tenantId,
        array $permissions,
    ): string {
        return $this->createToken([
            'scope' => 'TENANT',
            'tenantId' => $tenantId,
            'userId' => 'user-001',
            'sid' => 'session-001',
            'roles' => ['USER'],
            'permissions' => $permissions,
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
