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
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->enum('package_type', ['basic', 'professional', 'premium']);
            $table->string('name'); // e.g., "Pacote Básico"
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('delivery_time')->nullable(); // e.g., "3 dias"
            $table->json('features')->nullable(); // Array of features included
            $table->unsignedInteger('revisions_included')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['service_id', 'is_active']);
            $table->index('package_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_packages');
    }
};
