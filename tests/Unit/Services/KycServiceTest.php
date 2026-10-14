<?php

namespace Tests\Unit\Services;

use App\Enums\KycStatus;
use App\Models\KycVerification;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\KycService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KycServiceTest extends TestCase
{
    use RefreshDatabase;

    protected KycService $kycService;
    protected User $providerUser;
    protected ServiceProvider $provider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->kycService = app(KycService::class);

        $this->providerUser = User::factory()->create([
            'type' => User::TYPE_PROVIDER,
        ]);

        $this->provider = ServiceProvider::factory()->create([
            'user_id' => $this->providerUser->id,
            'is_verified' => false,
        ]);

        Storage::fake('local');
    }

    public function test_can_submit_kyc_verification(): void
    {
        $identityDocument = UploadedFile::fake()->image('id_document.jpg', 800, 600);
        $selfie = UploadedFile::fake()->image('selfie.jpg', 600, 800);

        $verification = $this->kycService->submit($this->provider, $identityDocument, $selfie);

        $this->assertInstanceOf(KycVerification::class, $verification);
        $this->assertEquals(KycStatus::PENDING, $verification->status);
        $this->assertEquals($this->provider->id, $verification->service_provider_id);
    }

    public function test_can_approve_kyc_verification(): void
    {
        $admin = User::factory()->create(['type' => User::TYPE_ADMIN]);

        $verification = KycVerification::factory()->create([
            'service_provider_id' => $this->provider->id,
            'status' => KycStatus::PENDING,
        ]);

        $approved = $this->kycService->approve($verification, $admin);

        $this->assertEquals(KycStatus::APPROVED, $approved->status);
        $this->assertTrue($this->provider->fresh()->is_verified);
    }

    public function test_can_reject_kyc_verification(): void
    {
        $admin = User::factory()->create(['type' => User::TYPE_ADMIN]);

        $verification = KycVerification::factory()->create([
            'service_provider_id' => $this->provider->id,
            'status' => KycStatus::PENDING,
        ]);

        $rejected = $this->kycService->reject($verification, $admin, 'Documento ilegível');

        $this->assertEquals(KycStatus::REJECTED, $rejected->status);
        $this->assertEquals('Documento ilegível', $rejected->rejection_reason);
        $this->assertFalse($this->provider->fresh()->is_verified);
    }

    public function test_records_status_history(): void
    {
        $admin = User::factory()->create(['type' => User::TYPE_ADMIN]);

        $verification = KycVerification::factory()->create([
            'service_provider_id' => $this->provider->id,
            'status' => KycStatus::PENDING,
        ]);

        $this->kycService->approve($verification, $admin);

        $this->assertDatabaseHas('kyc_status_history', [
            'kyc_verification_id' => $verification->id,
            'from_status' => KycStatus::PENDING->value,
            'to_status' => KycStatus::APPROVED->value,
            'changed_by' => $admin->id,
        ]);
    }
}
