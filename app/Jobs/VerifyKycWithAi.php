<?php

namespace App\Jobs;

use App\Models\KycVerification;
use App\Services\AiVerificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class VerifyKycWithAi implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public KycVerification $verification
    ) {}

    /**
     * Execute the job.
     */
    public function handle(AiVerificationService $aiService): void
    {
        Log::info('Processing KYC AI verification job', [
            'kyc_id' => $this->verification->id,
            'attempt' => $this->attempts(),
        ]);

        try {
            $aiService->processKycVerification($this->verification);
        } catch (\Exception $e) {
            Log::error('KYC AI verification job failed', [
                'kyc_id' => $this->verification->id,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            // Don't fail the job - mark as error in database instead
            $this->verification->update([
                'ai_verification_status' => 'error',
                'ai_verification_response' => [
                    'error' => $e->getMessage(),
                    'attempt' => $this->attempts(),
                ],
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('KYC AI verification job permanently failed', [
            'kyc_id' => $this->verification->id,
            'error' => $exception->getMessage(),
        ]);

        $this->verification->update([
            'ai_verification_status' => 'error',
            'ai_verification_response' => [
                'error' => 'Job failed after maximum attempts: ' . $exception->getMessage(),
            ],
        ]);
    }
}
