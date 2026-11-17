<?php

namespace Tests\Feature;

use App\Models\Product;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeProductsTest extends TestCase
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
    }

    public function test_home_returns_only_active_products_with_available_stock(): void
    {
        $tenantOne = '167d3ce8-8d0f-4c79-a28c-4cffa76217b5';
        $tenantTwo = '267d3ce8-8d0f-4c79-a28c-4cffa76217b5';
        $tenantThree = '367d3ce8-8d0f-4c79-a28c-4cffa76217b5';

        Product::create([
            'tenant_id' => $tenantOne,
            'name' => 'Available Product One',
            'price' => 100000,
            'stock' => 5,
            'is_active' => true,
        ]);

        Product::create([
            'tenant_id' => $tenantTwo,
            'name' => 'Available Product Two',
            'price' => 200000,
            'stock' => 3,
            'is_active' => true,
        ]);

        Product::create([
            'tenant_id' => $tenantOne,
            'name' => 'Inactive Product',
            'price' => 300000,
            'stock' => 10,
            'is_active' => false,
        ]);

        Product::create([
            'tenant_id' => $tenantTwo,
            'name' => 'Out Of Stock Product',
            'price' => 400000,
            'stock' => 0,
            'is_active' => true,
        ]);

        Product::create([
            'tenant_id' => $tenantThree,
            'name' => 'Product From Unselected Tenant',
            'price' => 500000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $response = $this->withToken($this->createGlobalToken())
            ->postJson('/api/internal/public/home-products', [
                'tenant_ids' => [
                    $tenantOne,
                    $tenantTwo,
                ],
                'per_page' => 20,
            ]);

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data.products')
            ->assertJsonPath(
                'data.products.0.name',
                'Available Product One',
            )
            ->assertJsonPath(
                'data.products.1.name',
                'Available Product Two',
            );

        $this->assertDatabaseCount('products', 5);
    }

    public function test_home_products_support_cursor_pagination(): void
    {
        $tenantId = '167d3ce8-8d0f-4c79-a28c-4cffa76217b5';

        foreach (range(1, 3) as $number) {
            Product::create([
                'tenant_id' => $tenantId,
                'name' => "Product {$number}",
                'price' => $number * 100000,
                'stock' => 5,
                'is_active' => true,
            ]);
        }

        $token = $this->createGlobalToken();

        $firstPage = $this->withToken($token)
            ->postJson('/api/internal/public/home-products', [
                'tenant_ids' => [$tenantId],
                'per_page' => 2,
            ]);

        $firstPage
            ->assertOk()
            ->assertJsonCount(2, 'data.products')
            ->assertJsonPath('meta.pagination.per_page', 2)
            ->assertJsonPath('meta.pagination.has_more', true);

        $nextCursor = $firstPage->json(
            'meta.pagination.next_cursor',
        );

        $this->assertNotEmpty($nextCursor);

        $secondPage = $this->withToken($token)
            ->postJson('/api/internal/public/home-products', [
                'tenant_ids' => [$tenantId],
                'per_page' => 2,
                'cursor' => $nextCursor,
            ]);

        $secondPage
            ->assertOk()
            ->assertJsonCount(1, 'data.products')
            ->assertJsonPath('meta.pagination.has_more', false)
            ->assertJsonPath(
                'data.products.0.name',
                'Product 3',
            );
    }

    private function createGlobalToken(): string
    {
        return JWT::encode([
            'sub' => 'gateway',
            'type' => 'internal',
            'scope' => 'GLOBAL',
            'iss' => self::ISSUER,
            'aud' => self::AUDIENCE,
            'iat' => time(),
            'exp' => time() + 60,
        ], self::SECRET, 'HS256');
    }
}
