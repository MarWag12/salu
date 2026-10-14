<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kyc_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kyc_verification_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['kyc_verification_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kyc_status_history');
    }
};
