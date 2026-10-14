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
        Schema::create('order_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('task_type')->nullable(); // ex: "Reparação", "Instalação"
            $table->text('description');
            $table->string('location')->nullable();
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->decimal('value_charged', 10, 2)->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->json('metadata')->nullable(); // Dados adicionais
            $table->timestamps();

            $table->index(['order_id', 'status']);
            $table->index('task_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_tasks');
    }
};
