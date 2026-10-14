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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // ORD-XXXXXX
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('provider_id')->constrained('service_providers')->cascadeOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained()->nullOnDelete();

            // Detalhes do pedido
            $table->text('description')->nullable(); // Descrição do trabalho
            $table->text('requirements')->nullable(); // Requisitos específicos
            $table->decimal('agreed_price', 10, 2)->nullable(); // Preço acordado
            $table->decimal('service_fee', 10, 2)->default(0); // Taxa da plataforma (10%)
            $table->string('currency', 3)->default('AOA');
            $table->date('expected_delivery_date')->nullable();

            // Status do pedido
            $table->string('status')->default('pending');
            // pending, accepted, in_progress, delivered, completed, cancelled, disputed

            // Datas importantes
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            // Cancelamento/Disputa
            $table->text('cancellation_reason')->nullable();
            $table->text('dispute_reason')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();

            // Notas
            $table->text('provider_notes')->nullable();
            $table->text('client_notes')->nullable();
            $table->text('delivery_notes')->nullable();

            $table->timestamps();

            // Índices
            $table->index(['client_id', 'status']);
            $table->index(['provider_id', 'status']);
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
