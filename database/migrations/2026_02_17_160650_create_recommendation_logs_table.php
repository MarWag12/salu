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
        Schema::create('recommendation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->constrained('service_providers')->cascadeOnDelete();
            $table->decimal('recommendation_score', 8, 4);
            $table->json('factors')->nullable();
            $table->boolean('was_clicked')->default(false);
            $table->boolean('was_hired')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'service_id']);
            $table->index('provider_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recommendation_logs');
    }
};
