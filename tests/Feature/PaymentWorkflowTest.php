<?php

namespace Tests\Feature;

use App\Enums\PaymentStatus;
use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\HighlightPlan;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Notifications\ServiceStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PaymentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $providerUser;
    protected ServiceProvider $provider;
    protected Service $service;
    protected HighlightPlan $plan;

    protected function setUp(): void
    {
        parent::setUp();
        config(['salu.simulated_payments' => true]);

        Notification::fake();

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
            'name' => 'Plano 7 dias',
            'duration_days' => 7,
            'price' => 5000.00,
            'currency' => 'AOA',
            'is_active' => true,
        ]);
    }

    public function test_provider_can_view_highlight_plans(): void
    {
        $response = $this->actingAs($this->providerUser)
            ->get(route('provider.payments.plans', $this->service));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Provider/Services/Highlight')
                ->has('plans', 1)
                ->where('service.id', $this->service->id)
        );
    }

    public function test_provider_can_initiate_checkout(): void
    {
        $response = $this->actingAs($this->providerUser)
            ->post(route('provider.payments.checkout', $this->service), [
                'plan_id' => $this->plan->id,
                'gateway' => 'simulated',
            ]);

        // Should redirect to checkout URL
        $response->assertRedirect();

        $this->assertDatabaseHas('payments', [
            'service_id' => $this->service->id,
            'highlight_plan_id' => $this->plan->id,
            'status' => PaymentStatus::PENDING->value,
        ]);
    }

    public function test_simulated_payment_confirmation_activates_highlight(): void
    {
        $payment = Payment::factory()->create([
            'service_id' => $this->service->id,
            'service_provider_id' => $this->provider->id,
            'highlight_plan_id' => $this->plan->id,
            'gateway' => \App\Enums\PaymentGateway::SIMULATION,
            'status' => PaymentStatus::PENDING,
            'external_id' => 'sim_test123',
        ]);

        $response = $this->actingAs($this->providerUser)->post(route('payments.simulate.confirm', $payment));

        $response->assertRedirect(route('payments.success', ['payment' => $payment->id]));

        $this->assertEquals(PaymentStatus::COMPLETED, $payment->fresh()->status);
        $this->assertEquals(ServiceStatus::FEATURED, $this->service->fresh()->status);
        $this->assertNotNull($this->service->fresh()->highlight_expires_at);

        Notification::assertSentTo(
            $this->providerUser,
            ServiceStatusChanged::class
        );
    }

    public function test_simulated_payment_failure_keeps_service_published(): void
    {
        $payment = Payment::factory()->create([
            'service_id' => $this->service->id,
            'service_provider_id' => $this->provider->id,
            'highlight_plan_id' => $this->plan->id,
            'gateway' => \App\Enums\PaymentGateway::SIMULATION,
            'status' => PaymentStatus::PENDING,
            'external_id' => 'sim_test456',
        ]);

        $response = $this->actingAs($this->providerUser)->post(route('payments.simulate.fail', $payment));

        $response->assertRedirect(route('payments.cancel', ['payment' => $payment->id]));

        $this->assertEquals(PaymentStatus::FAILED, $payment->fresh()->status);
        $this->assertEquals(ServiceStatus::PUBLISHED, $this->service->fresh()->status);
    }

    public function test_provider_can_view_payment_history(): void
    {
        Payment::factory()->count(3)->create([
            'service_id' => $this->service->id,
            'service_provider_id' => $this->provider->id,
            'highlight_plan_id' => $this->plan->id,
        ]);

        $response = $this->actingAs($this->providerUser)
            ->get(route('provider.payments.history'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Provider/Payments/History')
                ->has('payments.data', 3)
        );
    }

    public function test_cannot_initiate_payment_for_other_provider_service(): void
    {
        $otherUser = User::factory()->create(['type' => User::TYPE_PROVIDER]);
        $otherProvider = ServiceProvider::factory()->create([
            'user_id' => $otherUser->id,
            'is_verified' => true,
        ]);

        $response = $this->actingAs($otherUser)
            ->post(route('provider.payments.checkout', $this->service), [
                'plan_id' => $this->plan->id,
            ]);

        $response->assertForbidden();
    }

    public function test_cannot_highlight_pending_service(): void
    {
        $this->service->update(['status' => ServiceStatus::PENDING]);

        $response = $this->actingAs($this->providerUser)
            ->post(route('provider.payments.checkout', $this->service), [
                'plan_id' => $this->plan->id,
            ]);

        $response->assertForbidden();
    }
}
