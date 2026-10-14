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
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('service_providers')->onDelete('cascade');
            $table->foreignId('payout_method_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('amount', 10, 2);
            $table->decimal('fee', 10, 2)->default(0); // Taxa da plataforma
            $table->decimal('net_amount', 10, 2); // Valor líquido
            $table->string('currency', 3)->default('AOA');
            $table->string('status')->default('pending'); // pending, processing, completed, failed, cancelled
            $table->string('reference')->unique(); // Referência única do pagamento
            $table->text('notes')->nullable();
            $table->json('orders')->nullable(); // IDs das orders incluídas neste payout
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['provider_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
