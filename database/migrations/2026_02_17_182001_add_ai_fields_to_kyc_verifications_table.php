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
        Schema::table('kyc_verifications', function (Blueprint $table) {
            $table->decimal('ai_face_match_score', 5, 2)->nullable()->after('reviewed_at');
            $table->decimal('ai_liveness_score', 5, 2)->nullable()->after('ai_face_match_score');
            $table->enum('ai_verification_status', ['pending', 'passed', 'failed', 'error'])
                ->default('pending')
                ->after('ai_liveness_score');
            $table->json('ai_verification_response')->nullable()->after('ai_verification_status');
            $table->timestamp('ai_verified_at')->nullable()->after('ai_verification_response');

            $table->index('ai_verification_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kyc_verifications', function (Blueprint $table) {
            $table->dropIndex(['ai_verification_status']);
            $table->dropColumn([
                'ai_face_match_score',
                'ai_liveness_score',
                'ai_verification_status',
                'ai_verification_response',
                'ai_verified_at',
            ]);
        });
    }
};
