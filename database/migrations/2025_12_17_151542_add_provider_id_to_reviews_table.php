<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->foreignId('provider_id')->nullable()->after('service_id')->constrained('service_providers')->onDelete('cascade');
        });

        // Migrate existing reviews to use provider_id from their service
        DB::statement('
            UPDATE reviews
            SET provider_id = (
                SELECT service_provider_id
                FROM services
                WHERE services.id = reviews.service_id
            )
            WHERE provider_id IS NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropForeign(['provider_id']);
            $table->dropColumn('provider_id');
        });
    }
};
