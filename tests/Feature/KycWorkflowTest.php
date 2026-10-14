<?php

namespace Tests\Feature;

use App\Enums\KycStatus;
use App\Models\KycVerification;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Notifications\KycStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KycWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Notification::fake();
    }

    public function test_provider_can_submit_kyc_documents(): void
    {
        $provider = $this->createProvider();

        $response = $this->actingAs($provider->user)
            ->post(route('provider.profile.kyc'), [
                'identity_document' => UploadedFile::fake()->image('id_doc.jpg', 800, 600),
                'selfie' => UploadedFile::fake()->image('selfie.jpg', 600, 800),
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('kyc_verifications', [
            'service_provider_id' => $provider->id,
            'status' => KycStatus::PENDING->value,
        ]);
    }

    public function test_admin_can_approve_kyc(): void
    {
        $admin = User::factory()->create(['type' => User::TYPE_ADMIN]);
        $provider = $this->createProvider();

        $verification = KycVerification::factory()->create([
            'service_provider_id' => $provider->id,
            'status' => KycStatus::PENDING,
        ]);

        // O painel Filament aciona o KycService; testamos o mesmo caminho.
        app(\App\Services\KycService::class)->approve($verification, $admin);

        $this->assertEquals(KycStatus::APPROVED, $verification->fresh()->status);
        $this->assertTrue($provider->fresh()->is_verified);

        Notification::assertSentTo(
            $provider->user,
            KycStatusChanged::class
        );
    }

    public function test_admin_can_reject_kyc(): void
    {
        $admin = User::factory()->create(['type' => User::TYPE_ADMIN]);
        $provider = $this->createProvider();

        $verification = KycVerification::factory()->create([
            'service_provider_id' => $provider->id,
            'status' => KycStatus::PENDING,
        ]);

        app(\App\Services\KycService::class)->reject($verification, $admin, 'Documento ilegível');

        $this->assertEquals(KycStatus::REJECTED, $verification->fresh()->status);
        $this->assertFalse($provider->fresh()->is_verified);

        Notification::assertSentTo(
            $provider->user,
            KycStatusChanged::class
        );
    }

    public function test_provider_can_resubmit_after_rejection(): void
    {
        $provider = $this->createProvider();

        $verification = KycVerification::factory()->create([
            'service_provider_id' => $provider->id,
            'status' => KycStatus::REJECTED,
            'rejection_reason' => 'Documento expirado',
        ]);

        $response = $this->actingAs($provider->user)
            ->post(route('provider.profile.kyc'), [
                'identity_document' => UploadedFile::fake()->image('new_doc.jpg', 800, 600),
                'selfie' => UploadedFile::fake()->image('new_selfie.jpg', 600, 800),
            ]);

        $response->assertRedirect();

        // New verification should be created
        $this->assertDatabaseCount('kyc_verifications', 2);
    }

    protected function createProvider(): ServiceProvider
    {
        $user = User::factory()->create([
            'type' => User::TYPE_PROVIDER,
        ]);

        return ServiceProvider::factory()->create([
            'user_id' => $user->id,
            'is_verified' => false,
        ]);
    }
}
