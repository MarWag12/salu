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
        Schema::table('payments', function (Blueprint $table) {
            // Make service-related fields nullable for wallet top-ups
            $table->foreignId('service_id')->nullable()->change();
            $table->foreignId('service_provider_id')->nullable()->change();
            $table->foreignId('highlight_plan_id')->nullable()->change();

            // Add user_id for wallet top-ups (since they're not service-related)
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();

            // Add type field to differentiate payment types
            $table->string('type')->default('highlight')->after('gateway'); // highlight, wallet_topup

            $table->index(['user_id', 'type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'type']);

            $table->foreignId('service_id')->nullable(false)->change();
            $table->foreignId('service_provider_id')->nullable(false)->change();
            $table->foreignId('highlight_plan_id')->nullable(false)->change();
        });
    }
};
