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
                    'image_key',
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
        TenantContext $tenant,
        int $perPage = 20,
        ?string $cursor = null,
        ?string $search = null,
        mixed $minPrice = null,
        mixed $maxPrice = null,
    ): array {
        $tenantId = $tenant->tenantId;

        $perPage = min(
            max($perPage, 1),
            self::MAX_PER_PAGE,
        );

        $query = Product::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true);

        if ($search !== null && $search !== '') {
            $searchPattern = '%' . mb_strtolower($search) . '%';

            $query->where(function ($query) use ($searchPattern) {
                $query
                    ->whereRaw('LOWER(name) LIKE ?', [$searchPattern])
                    ->orWhereRaw('LOWER(description) LIKE ?', [$searchPattern]);
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
                    'image_key',
                    'created_at',
                    'updated_at',
                ],
                cursorName: 'cursor',
                cursor: $cursor,
            );

        return [
            'tenant_id' => $tenantId,

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
     * Retrieve available public products across multiple active tenants.
     *
     * @param list<string> $tenantIds
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
    public function listHomeProducts(
        array $tenantIds,
        int $perPage = 20,
        ?string $cursor = null,
    ): array {
        $perPage = min(
            max($perPage, 1),
            self::MAX_PER_PAGE,
        );

        $paginator = Product::query()
            ->whereIn('tenant_id', $tenantIds)
            ->where('is_active', true)
            ->where('stock', '>', 0)
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
                    'image_key',
                    'created_at',
                    'updated_at',
                ],
                cursorName: 'cursor',
                cursor: $cursor,
            );

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
            'image_key' => $data['image_key'] ?? null,
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

    /**
     * Update a product and retain its previous image key
     * for the gateway's post-update cleanup workflow.
     *
     * @return array{
     *     product: Product,
     *     previous_image_key: ?string
     * }
     */
    public function updateWithImage(
        TenantContext $tenant,
        int $productId,
        array $data,
    ): array {
        $tenantId = $tenant->tenantId;

        $result = \Illuminate\Support\Facades\DB::transaction(
            function () use ($tenantId, $productId, $data): array {
                $product = Product::query()
                    ->where('tenant_id', $tenantId)
                    ->whereKey($productId)
                    ->lockForUpdate()
                    ->firstOrFail();

                $previousImageKey = $product->image_key;

                $product->fill([
                    'name' => $data['name'] ?? $product->name,

                    'description' => array_key_exists('description', $data)
                        ? $data['description']
                        : $product->description,

                    'price' => $data['price'] ?? $product->price,

                    'stock' => $data['stock'] ?? $product->stock,

                    'is_active' => $data['is_active'] ?? $product->is_active,

                    'image_key' => array_key_exists('image_key', $data)
                        ? $data['image_key']
                        : $product->image_key,
                ]);

                $product->save();

                return [
                    'product' => $product->fresh(),
                    'previous_image_key' => $previousImageKey,
                ];
            },
        );

        $this->productCache->forgetTenant($tenantId);

        return $result;
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