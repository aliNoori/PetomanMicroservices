<?php

use App\Http\Controllers\ProductController;
use App\Http\Middleware\TenantContextMiddleware;
use App\Http\Middleware\VerifyInternalJwt;
use App\Http\Middleware\VerifyJwt;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\RequirePermission;

/*
|--------------------------------------------------------------------------
| User JWT Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware(VerifyJwt::class)->group(function () {

    /*
     * GET /api/orders
     *
     * Static proxy route.
     */
    Route::get('/orders', function () {
        Log::info('req', request()->header());

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => [
                    [
                        'id' => 'order-001',
                        'user_id' => request()->attributes->get('user_id'),
                        'status' => 'pending',
                        'total' => 250000,
                    ],
                    [
                        'id' => 'order-002',
                        'user_id' => request()->attributes->get('user_id'),
                        'status' => 'completed',
                        'total' => 480000,
                    ],
                ],
            ],
        ]);
    });

    /*
     * GET /api/orders/{orderId}
     *
     * Parameterized proxy route.
     */
    Route::get('/orders/{orderId}', function (string $orderId) {
        return response()->json([
            'success' => true,
            'data' => [
                'order' => [
                    'id' => $orderId,
                    'user_id' => request()->attributes->get('user_id'),
                    'status' => 'pending',
                    'total' => 250000,
                ],
            ],
        ]);
    });

    /*
     * GET /api/users/{userId}/orders/{orderId}
     *
     * Multi-parameter proxy route.
     */
    Route::get(
        '/users/{userId}/orders/{orderId}',
        function (string $userId, string $orderId) {
            return response()->json([
                'success' => true,
                'data' => [
                    'userId' => $userId,
                    'orderId' => $orderId,
                    'order' => [
                        'id' => $orderId,
                        'user_id' => $userId,
                        'status' => 'pending',
                        'total' => 250000,
                    ],
                ],
            ]);
        },
    );
});


/*
|--------------------------------------------------------------------------
| Internal Gateway Routes
|--------------------------------------------------------------------------
*/


Route::middleware([
    VerifyInternalJwt::class,
    TenantContextMiddleware::class,
])->group(function () {

    Route::get(
        '/products',
        [ProductController::class, 'index'],
    )->middleware(RequirePermission::class . ':product.read');

    Route::get(
        '/products/{productId}',
        [ProductController::class, 'show'],
    )->middleware(RequirePermission::class . ':product.read');

    Route::post(
        '/products',
        [ProductController::class, 'store'],
    )->middleware(RequirePermission::class . ':product.create');

    Route::put(
        '/products/{productId}',
        [ProductController::class, 'update'],
    )->middleware(RequirePermission::class . ':product.update');

    Route::delete(
        '/products/{productId}',
        [ProductController::class, 'destroy'],
    )->middleware(RequirePermission::class . ':product.delete');
});


/*
|--------------------------------------------------------------------------
| Internal Gateway Public Product Routes
|--------------------------------------------------------------------------
|
| GET /api/public/products
|
| Accessible only through the trusted Gateway.
|
*/

Route::middleware([
    VerifyInternalJwt::class,
    TenantContextMiddleware::class,
])->group(function () {
    Route::get(
        '/public/stores/{storeSlug}/products',
        [ProductController::class, 'publicIndex'],
    );
});


/*
|--------------------------------------------------------------------------
| Internal Gateway Home Products Route
|--------------------------------------------------------------------------
|
| POST /api/internal/public/home-products
|
| Accessible only through a GLOBAL service token issued by the Gateway.
|
*/

Route::middleware(VerifyInternalJwt::class)->group(function () {
    Route::post(
        '/internal/public/home-products',
        [ProductController::class, 'homeIndex'],
    );
});
