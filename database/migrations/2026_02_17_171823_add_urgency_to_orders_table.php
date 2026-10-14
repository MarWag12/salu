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
            $table->boolean('is_urgent')->default(false)->after('status');
            $table->decimal('urgent_fee', 10, 2)->nullable()->after('is_urgent');
            $table->timestamp('urgent_requested_at')->nullable()->after('urgent_fee');

            $table->index('is_urgent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['is_urgent']);
            $table->dropColumn(['is_urgent', 'urgent_fee', 'urgent_requested_at']);
        });
    }
};
