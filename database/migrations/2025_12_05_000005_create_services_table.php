<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_provider_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained();
            $table->string('name');
            $table->text('description');
            $table->string('price_type'); // fixed, variable, hourly
            $table->decimal('price_min', 10, 2);
            $table->decimal('price_max', 10, 2)->nullable();
            $table->string('location')->nullable();
            $table->string('delivery_time')->nullable();
            $table->json('tags')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedBigInteger('click_count')->default(0);
            $table->unsignedBigInteger('conversion_count')->default(0);
            $table->timestamp('highlight_expires_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'highlight_expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
