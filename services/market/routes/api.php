<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\VerifyJwt;

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
*/

Route::middleware(VerifyJwt::class)->group(function () {

    /*
     * GET /api/orders
     *
     * Static proxy route.
     */
    Route::get('/orders', function () {
        Log::info('req',request()->header());
        //sleep(1);
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
     * GET /api/products
     *
     * Static proxy route.
     */
    Route::get('/products', function () {
        return response()->json([
            'success' => true,
            'data' => [
                'products' => [
                    [
                        'id' => 'product-001',
                        'name' => 'Premium Dog Food',
                        'price' => 350000,
                        'stock' => 12,
                    ],
                    [
                        'id' => 'product-002',
                        'name' => 'Cat Food',
                        'price' => 280000,
                        'stock' => 8,
                    ],
                ],
            ],
        ]);
    });

    /*
     * GET /api/products/{productId}
     *
     * Parameterized proxy route.
     */
    Route::get('/products/{productId}', function (string $productId) {
        return response()->json([
            'success' => true,
            'data' => [
                'product' => [
                    'id' => $productId,
                    'name' => 'Premium Dog Food',
                    'price' => 350000,
                    'stock' => 12,
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
        function (
            string $userId,
            string $orderId,
        ) {
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