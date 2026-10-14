<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Permite gravar uma avaliação do serviço E uma avaliação do prestador
     * para a mesma combinação serviço/utilizador (review_type distingue-as).
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->unique(['service_id', 'user_id', 'review_type'], 'reviews_service_user_type_unique');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique(['service_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->unique(['service_id', 'user_id']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique('reviews_service_user_type_unique');
        });
    }
};
