<?php

namespace App\Http\Controllers;

use App\Auth\TenantContext;
use App\Resources\ProductResource;
use App\Requests\CreateProduct;
use App\Requests\ListProductsRequest;
use App\Requests\UpdateProduct;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
    ) {
    }

    // ============================================================
    // GET /api/products
    // ============================================================

    public function index(
        ListProductsRequest $request,
    ): JsonResponse {
        /** @var TenantContext $tenant */
        $tenant = $request->attributes->get('tenant');

        $validated = $request->validated();

        $result = $this->productService->list(
            tenant: $tenant,
            perPage: $validated['per_page'] ?? 20,
            cursor: $validated['cursor'] ?? null,
        );

        return response()->json([
            'success' => true,

            'data' => [
                'tenant_id' => $tenant->tenantId,

                'products' => ProductResource::collection(
                    $result['items'],
                ),
            ],

            'meta' => [
                'pagination' => $result['pagination'],
            ],
        ]);
    }

    // ============================================================
    // GET /api/public/stores/{storeSlug}/products
    // ============================================================

    public function publicIndex(
        ListProductsRequest $request,
        string $storeSlug,
    ): JsonResponse {
        $validated = $request->validated();

        $result = $this->productService->listPublic(
            storeSlug: $storeSlug,
            perPage: $validated['per_page'] ?? 20,
            cursor: $validated['cursor'] ?? null,
            search: $validated['search'] ?? null,
            minPrice: $validated['min_price'] ?? null,
            maxPrice: $validated['max_price'] ?? null,
        );

        return response()->json([
            'success' => true,

            'data' => [
                'tenant_id' => $result['tenant_id'],

                'products' => ProductResource::collection(
                    $result['items'],
                ),
            ],

            'meta' => [
                'pagination' => $result['pagination'],
            ],
        ]);
    }

    // ============================================================
    // GET /api/products/{productId}
    // ============================================================

    public function show(
        Request $request,
        int $productId,
    ): JsonResponse {
        /** @var TenantContext $tenant */
        $tenant = $request->attributes->get('tenant');

        $product = $this->productService->find(
            tenant: $tenant,
            productId: $productId,
        );

        return response()->json([
            'success' => true,

            'data' => [
                'tenant_id' => $tenant->tenantId,

                'product' => new ProductResource($product),
            ],
        ]);
    }

    // ============================================================
    // POST /api/products
    // ============================================================

    public function store(
        CreateProduct $request,
    ): JsonResponse {
        /** @var TenantContext $tenant */
        $tenant = $request->attributes->get('tenant');

        $product = $this->productService->store(
            tenant: $tenant,
            data: $request->validated(),
        );

        return response()->json([
            'success' => true,

            'data' => [
                'tenant_id' => $tenant->tenantId,

                'product' => new ProductResource($product),
            ],
        ], 201);
    }

    // ============================================================
    // PUT /api/products/{productId}
    // ============================================================

    public function update(
        UpdateProduct $request,
        int $productId,
    ): JsonResponse {
        /** @var TenantContext $tenant */
        $tenant = $request->attributes->get('tenant');

        $product = $this->productService->update(
            tenant: $tenant,
            productId: $productId,
            data: $request->validated(),
        );

        return response()->json([
            'success' => true,

            'data' => [
                'tenant_id' => $tenant->tenantId,

                'product' => new ProductResource($product),
            ],
        ]);
    }

    // ============================================================
    // DELETE /api/products/{productId}
    // ============================================================

    public function destroy(
        Request $request,
        int $productId,
    ): JsonResponse {
        /** @var TenantContext $tenant */
        $tenant = $request->attributes->get('tenant');

        $this->productService->delete(
            tenant: $tenant,
            productId: $productId,
        );

        return response()->json([
            'success' => true,

            'data' => [
                'tenant_id' => $tenant->tenantId,

                'product_id' => $productId,
            ],
        ]);
    }
}
