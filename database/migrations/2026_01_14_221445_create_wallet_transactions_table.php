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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // TXN-XXXXXXXX
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('related_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type'); // top_up, order_payment, escrow_release, refund, platform_fee
            $table->decimal('amount', 15, 2); // Positivo para crédito, negativo para débito
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->string('status')->default('completed'); // pending, completed, failed, reversed
            $table->text('description')->nullable();
            $table->json('metadata')->nullable(); // Dados extras (gateway info, etc)
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['wallet_id', 'created_at']);
            $table->index(['order_id', 'type']);
            $table->index('reference');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
