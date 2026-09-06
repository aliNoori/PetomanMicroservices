<?php

use App\Http\Controllers\ProductController;
use App\Http\Middleware\TenantContextMiddleware;
use App\Http\Middleware\VerifyInternalJwt;
use App\Http\Middleware\VerifyJwt;
use Illuminate\Support\Facades\Route;

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
    );

    Route::get(
        '/products/{productId}',
        [ProductController::class, 'show'],
    );

    Route::post(
        '/products',
        [ProductController::class, 'store'],
    );

    Route::put(
        '/products/{productId}',
        [ProductController::class, 'update'],
    );

    Route::delete(
        '/products/{productId}',
        [ProductController::class, 'destroy'],
    );
});


/*
|--------------------------------------------------------------------------
| Public Products
|--------------------------------------------------------------------------
|
| GET /api/public/stores/{storeSlug}/products
|
| No authentication required.
|
*/

Route::get(
    '/public/stores/{storeSlug}/products',
    [ProductController::class, 'publicIndex'],
);