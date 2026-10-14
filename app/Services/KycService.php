<?php

namespace App\Services;

use App\Enums\KycStatus;
use App\Jobs\VerifyKycWithAi;
use App\Models\KycDocument;
use App\Models\KycStatusHistory;
use App\Models\KycVerification;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Notifications\KycStatusChanged;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KycService
{
    /**
     * Maximum file size in bytes (5MB)
     */
    protected const MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * Allowed mime types for documents
     */
    protected const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'application/pdf',
    ];

    /**
     * Allowed mime types for selfie
     */
    protected const ALLOWED_SELFIE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
    ];

    /**
     * Submit a new KYC verification with documents.
     *
     * @throws ValidationException
     */
    public function submit(ServiceProvider $provider, UploadedFile $identityDocument, UploadedFile $selfie): KycVerification
    {
        // Check for existing pending verification
        $this->ensureNoPendingVerification($provider);

        $this->validateDocument($identityDocument, 'identity_document');
        $this->validateDocument($selfie, 'selfie', self::ALLOWED_SELFIE_MIME_TYPES);

        return DB::transaction(function () use ($provider, $identityDocument, $selfie) {
            // Create verification record
            $verification = KycVerification::create([
                'service_provider_id' => $provider->id,
                'status' => KycStatus::PENDING,
                'submitted_at' => now(),
            ]);

            // Create and attach identity document
            $identityDoc = KycDocument::create([
                'kyc_verification_id' => $verification->id,
                'type' => KycDocument::TYPE_IDENTITY,
                'original_filename' => $identityDocument->getClientOriginalName(),
            ]);
            $identityDoc->addMedia($identityDocument)->toMediaCollection('document');

            // Create and attach selfie
            $selfieDoc = KycDocument::create([
                'kyc_verification_id' => $verification->id,
                'type' => KycDocument::TYPE_SELFIE,
                'original_filename' => $selfie->getClientOriginalName(),
            ]);
            $selfieDoc->addMedia($selfie)->toMediaCollection('document');

            // Record initial status in history
            $this->recordStatusChange($verification, null, KycStatus::PENDING);

            // Dispatch AI verification job if enabled
            if (config('services.ai_verification.enabled', false)) {
                VerifyKycWithAi::dispatch($verification);
            }

            return $verification->load('documents');
        });
    }

    /**
     * Approve a KYC verification.
     */
    public function approve(KycVerification $verification, User $admin): KycVerification
    {
        $this->ensureCanReview($admin);
        $this->ensureIsPending($verification);

        return DB::transaction(function () use ($verification, $admin) {
            $previousStatus = $verification->status;

            $verification->update([
                'status' => KycStatus::APPROVED,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);

            // Update provider verification status
            $verification->serviceProvider->update([
                'is_verified' => true,
                'verified_at' => now(),
            ]);

            // Record status change
            $this->recordStatusChange($verification, $previousStatus, KycStatus::APPROVED, null, $admin);

            // Notify the provider
            $this->notifyProvider($verification, 'approved');

            return $verification->fresh();
        });
    }

    /**
     * Reject a KYC verification.
     */
    public function reject(KycVerification $verification, User $admin, string $reason): KycVerification
    {
        $this->ensureCanReview($admin);
        $this->ensureIsPending($verification);

        if (empty(trim($reason))) {
            throw ValidationException::withMessages([
                'reason' => ['O motivo da rejeição é obrigatório.'],
            ]);
        }

        return DB::transaction(function () use ($verification, $admin, $reason) {
            $previousStatus = $verification->status;

            $verification->update([
                'status' => KycStatus::REJECTED,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            // Record status change
            $this->recordStatusChange($verification, $previousStatus, KycStatus::REJECTED, $reason, $admin);

            // Notify the provider
            $this->notifyProvider($verification, 'rejected');

            return $verification->fresh();
        });
    }

    /**
     * Request document resubmission.
     */
    public function requestResubmit(KycVerification $verification, User $admin, string $reason): KycVerification
    {
        $this->ensureCanReview($admin);
        $this->ensureIsPending($verification);

        if (empty(trim($reason))) {
            throw ValidationException::withMessages([
                'reason' => ['O motivo do pedido de reenvio é obrigatório.'],
            ]);
        }

        return DB::transaction(function () use ($verification, $admin, $reason) {
            $previousStatus = $verification->status;

            $verification->update([
                'status' => KycStatus::RESUBMIT,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            // Record status change
            $this->recordStatusChange($verification, $previousStatus, KycStatus::RESUBMIT, $reason, $admin);

            // Notify the provider
            $this->notifyProvider($verification, 'resubmit');

            return $verification->fresh();
        });
    }

    /**
     * Check if a provider has approved KYC.
     */
    public function isApproved(ServiceProvider $provider): bool
    {
        return $provider->is_verified ||
               $provider->latestKycVerification?->status === KycStatus::APPROVED;
    }

    /**
     * Validate an uploaded document.
     *
     * @throws ValidationException
     */
    protected function validateDocument(UploadedFile $file, string $fieldName, ?array $allowedMimeTypes = null): void
    {
        $mimeTypes = $allowedMimeTypes ?? self::ALLOWED_MIME_TYPES;

        if (!in_array($file->getMimeType(), $mimeTypes)) {
            $allowed = implode(', ', array_map(fn($type) => str_replace('/', '/', $type), $mimeTypes));
            throw ValidationException::withMessages([
                $fieldName => ["Tipo de ficheiro não permitido. Tipos aceites: {$allowed}"],
            ]);
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $maxMb = self::MAX_FILE_SIZE / (1024 * 1024);
            throw ValidationException::withMessages([
                $fieldName => ["O ficheiro excede o tamanho máximo de {$maxMb}MB."],
            ]);
        }
    }

    /**
     * Record a status change in history.
     */
    protected function recordStatusChange(
        KycVerification $verification,
        ?KycStatus $fromStatus,
        KycStatus $toStatus,
        ?string $reason = null,
        ?User $changedBy = null
    ): KycStatusHistory {
        return KycStatusHistory::create([
            'kyc_verification_id' => $verification->id,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'reason' => $reason,
            'changed_by' => $changedBy?->id,
        ]);
    }

    /**
     * Ensure user can review KYC verifications.
     *
     * @throws ValidationException
     */
    protected function ensureCanReview(User $user): void
    {
        if (!$user->isAdmin()) {
            throw ValidationException::withMessages([
                'user' => ['Apenas administradores podem rever verificações KYC.'],
            ]);
        }
    }

    /**
     * Ensure verification is pending review.
     *
     * @throws ValidationException
     */
    protected function ensureIsPending(KycVerification $verification): void
    {
        if (!in_array($verification->status, [KycStatus::PENDING, KycStatus::RESUBMIT])) {
            throw ValidationException::withMessages([
                'verification' => ['Esta verificação já foi processada.'],
            ]);
        }
    }

    /**
     * Ensure provider has no pending verification.
     *
     * @throws ValidationException
     */
    protected function ensureNoPendingVerification(ServiceProvider $provider): void
    {
        $existingPending = KycVerification::where('service_provider_id', $provider->id)
            ->whereIn('status', [KycStatus::PENDING, KycStatus::RESUBMIT])
            ->exists();

        if ($existingPending) {
            throw ValidationException::withMessages([
                'verification' => ['Já existe uma verificação pendente. Aguarde a análise ou cancele a verificação existente.'],
            ]);
        }
    }

    /**
     * Notify the provider about status change.
     */
    protected function notifyProvider(KycVerification $verification, string $action): void
    {
        $user = $verification->serviceProvider->user;

        if ($user) {
            $user->notify(new KycStatusChanged($verification, $action));
        }
    }
}
