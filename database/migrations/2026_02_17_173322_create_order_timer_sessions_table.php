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
        Schema::create('order_timer_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('session_token')->unique();
            $table->timestamp('started_at');
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('resumed_at')->nullable();
            $table->timestamp('stopped_at')->nullable();
            $table->unsignedInteger('active_duration_seconds')->default(0);
            $table->unsignedInteger('paused_duration_seconds')->default(0);
            $table->enum('status', ['active', 'paused', 'stopped']);
            $table->boolean('is_current')->default(true);
            $table->text('stop_reason')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'is_current']);
            $table->index('status');
            $table->index('session_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_timer_sessions');
    }
};
