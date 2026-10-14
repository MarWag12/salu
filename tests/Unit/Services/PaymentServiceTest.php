<?php

namespace Tests\Unit\Services;

use App\Enums\PaymentStatus;
use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\HighlightPlan;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PaymentService $paymentService;
    protected User $providerUser;
    protected ServiceProvider $provider;
    protected Service $service;
    protected HighlightPlan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->paymentService = app(PaymentService::class);

        $this->providerUser = User::factory()->create([
            'type' => User::TYPE_PROVIDER,
        ]);

        $this->provider = ServiceProvider::factory()->create([
            'user_id' => $this->providerUser->id,
            'is_verified' => true,
        ]);

        $category = Category::factory()->create(['is_active' => true]);

        $this->service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $this->plan = HighlightPlan::factory()->create([
            'duration_days' => 7,
            'price' => 5000.00,
            'currency' => 'AOA',
            'is_active' => true,
        ]);
    }

    public function test_can_initiate_highlight_payment(): void
    {
        $result = $this->paymentService->initiateHighlightPayment(
            $this->service,
            $this->plan,
            'simulated'
        );

        $this->assertArrayHasKey('payment', $result);
        $this->assertArrayHasKey('checkout_url', $result);
        $this->assertInstanceOf(Payment::class, $result['payment']);
        $this->assertEquals(PaymentStatus::PENDING, $result['payment']->status);
        $this->assertEquals($this->service->id, $result['payment']->service_id);
    }

    public function test_cannot_initiate_payment_for_pending_service(): void
    {
        $this->service->update(['status' => ServiceStatus::PENDING]);

        $this->expectException(ValidationException::class);

        $this->paymentService->initiateHighlightPayment(
            $this->service,
            $this->plan
        );
    }

    public function test_cannot_initiate_payment_without_kyc(): void
    {
        $this->provider->update(['is_verified' => false]);

        $this->expectException(ValidationException::class);

        $this->paymentService->initiateHighlightPayment(
            $this->service,
            $this->plan
        );
    }

    public function test_cannot_initiate_duplicate_pending_payment(): void
    {
        // Create first pending payment
        Payment::factory()->create([
            'service_id' => $this->service->id,
            'service_provider_id' => $this->provider->id,
            'highlight_plan_id' => $this->plan->id,
            'status' => PaymentStatus::PENDING,
        ]);

        $this->expectException(ValidationException::class);

        $this->paymentService->initiateHighlightPayment(
            $this->service,
            $this->plan
        );
    }

    public function test_can_process_successful_payment(): void
    {
        $payment = Payment::factory()->create([
            'service_id' => $this->service->id,
            'service_provider_id' => $this->provider->id,
            'highlight_plan_id' => $this->plan->id,
            'status' => PaymentStatus::PENDING,
        ]);

        $service = $this->paymentService->processSuccessfulPayment($payment);

        $this->assertEquals(ServiceStatus::FEATURED, $service->status);
        $this->assertNotNull($service->highlight_expires_at);
        $this->assertEquals(PaymentStatus::COMPLETED, $payment->fresh()->status);
    }

    public function test_can_process_failed_payment(): void
    {
        $payment = Payment::factory()->create([
            'service_id' => $this->service->id,
            'service_provider_id' => $this->provider->id,
            'highlight_plan_id' => $this->plan->id,
            'status' => PaymentStatus::PENDING,
        ]);

        $failed = $this->paymentService->processFailedPayment($payment, [
            'error' => 'Card declined',
        ]);

        $this->assertEquals(PaymentStatus::FAILED, $failed->status);
        $this->assertEquals(ServiceStatus::PUBLISHED, $this->service->fresh()->status);
    }

    public function test_can_get_available_plans(): void
    {
        // Create additional inactive plan
        HighlightPlan::factory()->create(['is_active' => false]);

        $plans = $this->paymentService->getAvailablePlans();

        $this->assertCount(1, $plans);
        $this->assertTrue($plans->first()->is_active);
    }
}
