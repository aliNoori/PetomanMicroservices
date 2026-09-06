<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'tenant_id' => null,

            'name' => fake()->words(
                fake()->numberBetween(2, 5),
                true,
            ),

            'description' => fake()->optional()->sentence(),

            'price' => fake()->numberBetween(
                10_000,
                5_000_000,
            ),

            'stock' => fake()->numberBetween(
                0,
                1_000,
            ),

            'is_active' => fake()->boolean(85),
        ];
    }

    /**
     * Assign the product to a specific tenant.
     */
    public function forTenant(string $tenantId): static
    {
        return $this->state(fn () => [
            'tenant_id' => $tenantId,
        ]);
    }
}