<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Tenant ownership
            $table->uuid('tenant_id');

            // Product information
            $table->string('name');
            $table->text('description')->nullable();

            // Price is stored as an integer in the smallest
            // currency unit used by the application.
            $table->unsignedBigInteger('price');

            // Inventory
            $table->unsignedInteger('stock')->default(0);

            // Product availability
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Tenant-aware queries
            $table->index('tenant_id');
            $table->index([
                'tenant_id',
                'is_active',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
