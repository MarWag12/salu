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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Cliente que avaliou
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete(); // Pedido associado (opcional)
            $table->tinyInteger('rating')->unsigned(); // 1-5 estrelas
            $table->text('comment')->nullable();
            $table->text('provider_response')->nullable(); // Resposta do prestador
            $table->timestamp('provider_responded_at')->nullable();
            $table->boolean('is_verified')->default(false); // Verificado (comprou o serviço)
            $table->boolean('is_visible')->default(true); // Visível publicamente
            $table->timestamps();

            // Índices
            $table->index(['service_id', 'is_visible']);
            $table->index(['user_id']);
            $table->index('rating');

            // Um utilizador só pode avaliar um serviço uma vez
            $table->unique(['service_id', 'user_id']);
        });

        // Adicionar campos de rating ao service_providers
        Schema::table('service_providers', function (Blueprint $table) {
            // Se os campos não existirem, serão criados
            // rating e total_reviews já devem existir, mas vamos garantir
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
