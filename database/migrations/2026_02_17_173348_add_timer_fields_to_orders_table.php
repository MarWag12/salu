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
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('timer_active')->default(false)->after('urgent_requested_at');
            $table->timestamp('timer_started_at')->nullable()->after('timer_active');
            $table->timestamp('timer_last_action_at')->nullable()->after('timer_started_at');
            $table->unsignedInteger('timer_pause_count')->default(0)->after('timer_last_action_at');
            $table->timestamp('client_disputed_at')->nullable()->after('timer_pause_count');
            $table->boolean('timer_dispute_resolved')->default(false)->after('client_disputed_at');

            $table->index('timer_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['timer_active']);
            $table->dropColumn([
                'timer_active',
                'timer_started_at',
                'timer_last_action_at',
                'timer_pause_count',
                'client_disputed_at',
                'timer_dispute_resolved',
            ]);
        });
    }
};
