<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\PayoutMethod;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Models\WalletTopUpRequest;
use App\Services\OrderService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MoneyFlowsHttpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        config(['salu.simulated_payments' => true]);
    }

    public function test_simulated_top_up_credits_wallet(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client)->post(route('wallet.top-up.process'), [
            'amount' => 5000,
            'payment_method' => 'simulation',
        ]);
        $response->assertRedirect();

        $payment = Payment::where('user_id', $client->id)->firstOrFail();
        $this->assertTrue($payment->isPending());

        $this->actingAs($client)->post(route('payments.simulate.confirm', $payment))->assertRedirect();

        $wallet = app(WalletService::class)->getOrCreateWallet($client)->fresh();
        $this->assertEquals(5000, (float) $wallet->balance);
        $this->assertEquals(5000, (float) $wallet->available_balance);
    }

    public function test_other_user_cannot_confirm_someone_elses_simulated_payment(): void
    {
        $client = User::factory()->client()->create();
        $attacker = User::factory()->client()->create();

        $this->actingAs($client)->post(route('wallet.top-up.process'), ['amount' => 5000, 'payment_method' => 'simulation']);
        $payment = Payment::firstOrFail();

        $this->actingAs($attacker)->post(route('payments.simulate.confirm', $payment))->assertForbidden();
        $this->post('/logout');
        auth()->logout();
        $this->post(route('payments.simulate.confirm', $payment))->assertRedirect(route('login'));
        $this->assertTrue($payment->fresh()->isPending());
    }

    public function test_simulation_blocked_when_disabled(): void
    {
        config(['salu.simulated_payments' => false]);
        $client = User::factory()->client()->create();

        $this->actingAs($client)->post(route('wallet.top-up.process'), ['amount' => 5000, 'payment_method' => 'simulation'])
            ->assertSessionHasErrors('payment_method');
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_direct_top_up_creates_pending_request_without_crediting(): void
    {
        $client = User::factory()->client()->create();

        $this->actingAs($client)->post(route('wallet.top-up.process'), ['amount' => 2000, 'payment_method' => 'direct'])
            ->assertRedirect(route('wallet.index'));

        $this->assertDatabaseHas('wallet_top_up_requests', ['user_id' => $client->id, 'status' => 'pending']);
        $wallet = app(WalletService::class)->getOrCreateWallet($client)->fresh();
        $this->assertEquals(0, (float) $wallet->balance);
    }

    public function test_provider_can_request_and_cancel_payout(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create(['is_verified' => true]);
        $service = Service::factory()->for($provider, 'serviceProvider')->create(['price_min' => 20000]);

        $orders = app(OrderService::class);
        app(WalletService::class)->topUp($client, 50000);
        $order = $orders->createOrder($service, $client);
        $orders->acceptOrder($order, $providerUser);
        $orders->startOrder($order->fresh(), $providerUser);
        $orders->deliverOrder($order->fresh(), $providerUser);
        $orders->completeOrder($order->fresh(), $client);

        $method = PayoutMethod::factory()->create(['provider_id' => $provider->id]);
        $this->assertEquals(18000, $provider->fresh()->available_balance);

        // Abaixo do mínimo
        $this->actingAs($providerUser)->post(route('provider.payouts.store'), [
            'amount' => 1000, 'payout_method_id' => $method->id,
        ])->assertSessionHasErrors('amount');

        // Acima do saldo
        $this->actingAs($providerUser)->post(route('provider.payouts.store'), [
            'amount' => 99999, 'payout_method_id' => $method->id,
        ])->assertSessionHasErrors('amount');

        // Válido
        $this->actingAs($providerUser)->post(route('provider.payouts.store'), [
            'amount' => 10000, 'payout_method_id' => $method->id,
        ])->assertRedirect(route('provider.wallet'));

        $payout = $provider->payouts()->firstOrFail();
        $this->assertEquals(10000, (float) $payout->net_amount);
        $this->assertEquals(8000, $provider->fresh()->available_balance);

        $this->actingAs($providerUser)->post(route('provider.payouts.cancel', $payout))->assertRedirect();
        $this->assertEquals(18000, $provider->fresh()->available_balance);
    }
}
