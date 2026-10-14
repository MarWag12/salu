<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\OrderService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class WalletOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $client;
    private User $providerUser;
    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();

        $this->client = User::factory()->client()->create();
        $this->providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($this->providerUser, 'user')->create(['is_verified' => true]);
        $this->service = Service::factory()->for($provider, 'serviceProvider')->create(['price_min' => 10000]);

        app(WalletService::class)->topUp($this->client, 50000);
    }

    public function test_paying_with_wallet_holds_funds(): void
    {
        $order = app(OrderService::class)->createOrder($this->service, $this->client);

        $wallet = app(WalletService::class)->getOrCreateWallet($this->client)->fresh();
        $this->assertEquals(50000, (float) $wallet->balance);
        $this->assertEquals(40000, (float) $wallet->available_balance);
        $this->assertEquals(10000, (float) $wallet->held_balance);
        $this->assertTrue($order->fresh()->payment_completed);
    }

    public function test_completing_order_pays_provider_and_charges_client(): void
    {
        $orders = app(OrderService::class);
        $order = $orders->createOrder($this->service, $this->client);
        $orders->acceptOrder($order, $this->providerUser);
        $orders->startOrder($order->fresh(), $this->providerUser);
        $orders->deliverOrder($order->fresh(), $this->providerUser);
        $orders->completeOrder($order->fresh(), $this->client);

        $wallets = app(WalletService::class);
        $client = $wallets->getOrCreateWallet($this->client)->fresh();
        $provider = $wallets->getOrCreateWallet($this->providerUser)->fresh();

        // Cliente: perdeu exactamente o valor do pedido; nada fica retido.
        $this->assertEquals(40000, (float) $client->balance);
        $this->assertEquals(40000, (float) $client->available_balance);
        $this->assertEquals(0, (float) $client->held_balance);
        // Prestador: recebe o valor menos a comissão da plataforma (10%).
        $this->assertEquals(9000, (float) $provider->balance);
        $this->assertEquals(9000, (float) $provider->available_balance);
    }

    public function test_cancelling_pending_order_refunds_client(): void
    {
        $orders = app(OrderService::class);
        $order = $orders->createOrder($this->service, $this->client);
        $orders->cancelOrder($order->fresh(), $this->client, 'Mudei de ideias');

        $client = app(WalletService::class)->getOrCreateWallet($this->client)->fresh();
        $this->assertEquals(50000, (float) $client->balance);
        $this->assertEquals(50000, (float) $client->available_balance);
        $this->assertEquals(0, (float) $client->held_balance);
    }

    public function test_insufficient_balance_blocks_order(): void
    {
        $poor = User::factory()->client()->create();

        $this->expectExceptionMessage('Saldo insuficiente');
        app(OrderService::class)->createOrder($this->service, $poor);
    }

    private function deliveredOrder(): Order
    {
        $orders = app(OrderService::class);
        $order = $orders->createOrder($this->service, $this->client);
        $orders->acceptOrder($order, $this->providerUser);
        $orders->startOrder($order->fresh(), $this->providerUser);
        $orders->deliverOrder($order->fresh(), $this->providerUser);

        return $order->fresh();
    }

    public function test_dispute_full_refund_returns_money_to_client(): void
    {
        $order = $this->deliveredOrder();
        app(WalletService::class)->settleDispute($order, 10000);

        $client = app(WalletService::class)->getOrCreateWallet($this->client)->fresh();
        $this->assertEquals(50000, (float) $client->balance);
        $this->assertEquals(50000, (float) $client->available_balance);
        $this->assertEquals(0, (float) $client->held_balance);
    }

    public function test_dispute_partial_refund_splits_money(): void
    {
        $order = $this->deliveredOrder();
        app(WalletService::class)->settleDispute($order, 4000);

        $wallets = app(WalletService::class);
        $client = $wallets->getOrCreateWallet($this->client)->fresh();
        $provider = $wallets->getOrCreateWallet($this->providerUser)->fresh();

        // Cliente paga 6000 (recupera 4000); prestador recebe 6000 menos 10% = 5400.
        $this->assertEquals(44000, (float) $client->balance);
        $this->assertEquals(44000, (float) $client->available_balance);
        $this->assertEquals(0, (float) $client->held_balance);
        $this->assertEquals(5400, (float) $provider->balance);
    }

    public function test_hire_from_service_page_saves_requirements_and_urgency(): void
    {
        $this->service->update(['supports_urgent' => true, 'urgent_fee_type' => 'fixed', 'urgent_fee_value' => 1000]);

        $this->actingAs($this->client)->post(route('orders.create-from-service', $this->service), [
            'requirements' => 'Torneira da cozinha a pingar',
            'is_urgent' => true,
            'payment_method' => 'wallet',
        ])->assertSessionHasNoErrors();

        $order = Order::firstOrFail();
        $this->assertEquals('Torneira da cozinha a pingar', $order->requirements);
        $this->assertTrue((bool) $order->is_urgent);
        $this->assertEquals(11000, (float) $order->agreed_price);
        $this->assertEquals(1000, (float) $order->urgent_fee);
        $this->assertTrue($order->payment_completed);
    }
}
