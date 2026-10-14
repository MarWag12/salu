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
            $table->foreignId('wallet_transaction_id')->nullable()->after('service_fee')->constrained('wallet_transactions')->nullOnDelete();
            $table->string('payment_method')->default('wallet')->after('currency'); // wallet, external
            $table->boolean('payment_completed')->default(false)->after('payment_method');
            $table->timestamp('payment_completed_at')->nullable()->after('payment_completed');
            $table->decimal('hourly_rate', 10, 2)->nullable()->after('agreed_price');
            $table->integer('total_work_duration_seconds')->default(0)->after('hourly_rate');
            $table->decimal('calculated_price', 10, 2)->nullable()->after('total_work_duration_seconds');
            $table->boolean('timer_validated')->default(false)->after('calculated_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['wallet_transaction_id']);
            $table->dropColumn([
                'wallet_transaction_id',
                'payment_method',
                'payment_completed',
                'payment_completed_at',
                'hourly_rate',
                'total_work_duration_seconds',
                'calculated_price',
                'timer_validated',
            ]);
        });
    }
};
