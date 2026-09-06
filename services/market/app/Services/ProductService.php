<?php

namespace App\Services;

use App\Auth\TenantContext;
use App\Cache\ProductCache;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    private const MAX_PER_PAGE = 100;

    public function __construct(
        private readonly ProductCache $productCache,
    ) {
    }

    /**
     * @return array{
     *     items: Collection<int, Product>,
     *     pagination: array{
     *         per_page: int,
     *         has_more: bool,
     *         next_cursor: ?string,
     *         previous_cursor: ?string
     *     }
     * }
     */
    public function list(
        TenantContext $tenant,
        int $perPage = 20,
        ?string $cursor = null,
    ): array {
        $tenantId = $tenant->tenantId;

        $perPage = min(
            max($perPage, 1),
            self::MAX_PER_PAGE,
        );

        /*
         * ========================================================
         * CACHE HIT
         * ========================================================
         */

        $cached = $this->productCache->getList(
            tenantId: $tenantId,
            perPage: $perPage,
            cursor: $cursor,
        );

        if ($cached !== null) {
            return [
                'items' => $this->hydrateProducts(
                    $cached['items'] ?? [],
                ),

                'pagination' => [
                    'per_page' => $perPage,

                    'has_more' => (bool) (
                        $cached['has_more'] ?? false
                    ),

                    'next_cursor' =>
                        $cached['next_cursor'] ?? null,

                    'previous_cursor' =>
                        $cached['previous_cursor'] ?? null,
                ],
            ];
        }

        /*
         * ========================================================
         * DATABASE
         * ========================================================
         */

        $paginator = Product::query()
            ->where(
                'tenant_id',
                $tenantId,
            )
            ->orderBy('id')
            ->cursorPaginate(
                perPage: $perPage,
                columns: [
                    'id',
                    'tenant_id',
                    'name',
                    'description',
                    'price',
                    'stock',
                    'is_active',
                    'created_at',
                    'updated_at',
                ],
                cursorName: 'cursor',
                cursor: $cursor,
            );

        /*
         * ========================================================
         * CACHE PAYLOAD
         * ========================================================
         *
         * Only plain serializable data goes into Redis.
         */

        $payload = [
            'items' => collect(
                $paginator->items(),
            )->map(
                    fn(Product $product): array =>
                    $product->toArray(),
                )->all(),

            'has_more' => $paginator->hasMorePages(),

            'next_cursor' =>
                $paginator->nextCursor()?->encode(),

            'previous_cursor' =>
                $paginator->previousCursor()?->encode(),
        ];

        $this->productCache->putList(
            tenantId: $tenantId,
            perPage: $perPage,
            cursor: $cursor,
            payload: $payload,
        );

        /*
         * ========================================================
         * RESULT
         * ========================================================
         */

        return [
            'items' => new Collection(
                $paginator->items(),
            ),

            'pagination' => [
                'per_page' => $paginator->perPage(),

                'has_more' => $paginator->hasMorePages(),

                'next_cursor' =>
                    $paginator->nextCursor()?->encode(),

                'previous_cursor' =>
                    $paginator->previousCursor()?->encode(),
            ],
        ];
    }

    public function listPublic(
        string $storeSlug,
        int $perPage = 20,
        ?string $cursor = null,
        ?string $search = null,
        mixed $minPrice = null,
        mixed $maxPrice = null,
    ): array {
        $perPage = min(
            max($perPage, 1),
            self::MAX_PER_PAGE,
        );

        $tenant = Tenant::query()
            ->where('slug', $storeSlug)
            ->where('status', TenantStatus::ACTIVE)
            ->first();

        if ($tenant === null) {
            abort(404);
        }

        $query = Product::query()
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true);

        if ($search !== null && $search !== '') {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere(
                        'description',
                        'ILIKE',
                        "%{$search}%",
                    );
            });
        }

        if ($minPrice !== null) {
            $query->where('price', '>=', $minPrice);
        }

        if ($maxPrice !== null) {
            $query->where('price', '<=', $maxPrice);
        }

        $paginator = $query
            ->orderBy('id')
            ->cursorPaginate(
                perPage: $perPage,
                columns: [
                    'id',
                    'tenant_id',
                    'name',
                    'description',
                    'price',
                    'stock',
                    'is_active',
                    'created_at',
                    'updated_at',
                ],
                cursorName: 'cursor',
                cursor: $cursor,
            );

        return [
            'tenant_id' => $tenant->id,

            'items' => new Collection(
                $paginator->items(),
            ),

            'pagination' => [
                'per_page' => $paginator->perPage(),

                'has_more' => $paginator->hasMorePages(),

                'next_cursor' =>
                    $paginator->nextCursor()?->encode(),

                'previous_cursor' =>
                    $paginator->previousCursor()?->encode(),
            ],
        ];
    }

    /**
     * Convert cached arrays back into real Product models.
     *
     * @param array<int, array<string, mixed>> $items
     * @return Collection<int, Product>
     */
    private function hydrateProducts(
        array $items,
    ): Collection {
        return new Collection(
            array_map(
                static function (array $attributes): Product {
                    return (new Product())->newFromBuilder(
                        $attributes,
                    );
                },
                $items,
            ),
        );
    }

    // ============================================================
    // Find Product
    // ============================================================

    public function find(
        TenantContext $tenant,
        int $productId,
    ): Product {
        return Product::query()
            ->where(
                'tenant_id',
                $tenant->tenantId,
            )
            ->whereKey($productId)
            ->firstOrFail();
    }

    // ============================================================
    // Create Product
    // ============================================================

    public function store(
        TenantContext $tenant,
        array $data,
    ): Product {
        $product = Product::create([
            'tenant_id' => $tenant->tenantId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'stock' => $data['stock'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $this->productCache->forgetTenant(
            $tenant->tenantId,
        );

        return $product;
    }

    // ============================================================
    // Update Product
    // ============================================================

    public function update(
        TenantContext $tenant,
        int $productId,
        array $data,
    ): Product {
        $tenantId = $tenant->tenantId;

        $product = Product::query()
            ->where(
                'tenant_id',
                $tenantId,
            )
            ->whereKey($productId)
            ->firstOrFail();

        $product->fill([
            'name' => $data['name'] ?? $product->name,

            'description' => array_key_exists(
                'description',
                $data,
            )
                ? $data['description']
                : $product->description,

            'price' => $data['price'] ?? $product->price,

            'stock' => $data['stock'] ?? $product->stock,

            'is_active' => $data['is_active'] ?? $product->is_active,
        ]);

        $product->save();

        $this->productCache->forgetTenant(
            $tenantId,
        );

        return $product->fresh();
    }

    // ============================================================
    // Delete Product
    // ============================================================

    public function delete(
        TenantContext $tenant,
        int $productId,
    ): void {
        $tenantId = $tenant->tenantId;

        $product = Product::query()
            ->where(
                'tenant_id',
                $tenantId,
            )
            ->whereKey($productId)
            ->firstOrFail();

        $product->delete();

        $this->productCache->forgetTenant(
            $tenantId,
        );
    }
}