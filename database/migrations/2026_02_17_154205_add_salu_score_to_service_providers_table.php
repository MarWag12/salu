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
        Schema::table('service_providers', function (Blueprint $table) {
            $table->unsignedTinyInteger('salu_score')->default(0)->after('rating');
            $table->enum('salu_badge', ['bronze', 'silver', 'gold', 'platinum'])->nullable()->after('salu_score');
            $table->unsignedInteger('total_cancellations')->default(0)->after('completed_services');
            $table->unsignedInteger('total_complaints')->default(0)->after('total_cancellations');
            $table->decimal('punctuality_score', 5, 2)->default(0.00)->after('total_complaints');
            $table->timestamp('score_updated_at')->nullable()->after('punctuality_score');
            $table->unsignedInteger('average_response_time_minutes')->default(0)->after('score_updated_at');
            $table->decimal('acceptance_rate', 5, 2)->default(0.00)->after('average_response_time_minutes');
            $table->decimal('on_time_delivery_rate', 5, 2)->default(0.00)->after('acceptance_rate');
            $table->timestamp('last_active_at')->nullable()->after('on_time_delivery_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_providers', function (Blueprint $table) {
            $table->dropColumn([
                'salu_score',
                'salu_badge',
                'total_cancellations',
                'total_complaints',
                'punctuality_score',
                'score_updated_at',
                'average_response_time_minutes',
                'acceptance_rate',
                'on_time_delivery_rate',
                'last_active_at',
            ]);
        });
    }
};
