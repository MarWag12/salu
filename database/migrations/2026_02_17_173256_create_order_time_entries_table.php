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
        Schema::create('order_time_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['start', 'pause', 'resume', 'stop', 'dispute']);
            $table->timestamp('logged_at');
            $table->unsignedInteger('elapsed_seconds')->nullable();
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable(); // IP, user_agent for audit
            $table->timestamps();

            $table->index(['order_id', 'type']);
            $table->index('logged_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_time_entries');
    }
};
