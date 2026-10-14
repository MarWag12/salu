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
        Schema::table('services', function (Blueprint $table) {
            $table->boolean('supports_urgent')->default(false)->after('delivery_time');
            $table->enum('urgent_fee_type', ['percentage', 'fixed'])->nullable()->after('supports_urgent');
            $table->decimal('urgent_fee_value', 10, 2)->nullable()->after('urgent_fee_type');
            $table->string('urgent_delivery_time')->nullable()->after('urgent_fee_value');

            $table->index('supports_urgent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropIndex(['supports_urgent']);
            $table->dropColumn([
                'supports_urgent',
                'urgent_fee_type',
                'urgent_fee_value',
                'urgent_delivery_time',
            ]);
        });
    }
};
