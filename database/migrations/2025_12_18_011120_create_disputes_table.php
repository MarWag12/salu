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
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('provider_id')->constrained('service_providers')->onDelete('cascade');
            $table->string('reason'); // quality, not_delivered, not_as_described, communication, other
            $table->text('description');
            $table->string('status')->default('pending'); // pending, under_review, resolved_client_favor, resolved_provider_favor, cancelled
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->json('evidence')->nullable(); // URLs de fotos/documentos
            $table->json('provider_response')->nullable(); // Resposta do prestador
            $table->timestamp('provider_responded_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
