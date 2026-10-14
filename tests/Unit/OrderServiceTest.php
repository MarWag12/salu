<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $orderService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderService = app(OrderService::class);
        Notification::fake();
    }

    public function test_can_create_order(): void
    {
        $provider = ServiceProvider::factory()->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create([
            'price_min' => 10000,
        ]);
        $client = User::factory()->client()->create();
        app(\App\Services\WalletService::class)->topUp($client, 100000);

        $order = $this->orderService->createOrder($service, $client);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'service_id' => $service->id,
            'client_id' => $client->id,
            'provider_id' => $provider->id,
            'status' => OrderStatus::PENDING->value,
            'agreed_price' => 10000,
        ]);

        $this->assertEquals(1000, $order->service_fee); // 10% fee
    }

    public function test_can_create_order_with_custom_price(): void
    {
        $provider = ServiceProvider::factory()->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create([
            'price_min' => 10000,
        ]);
        $client = User::factory()->client()->create();
        app(\App\Services\WalletService::class)->topUp($client, 100000);

        $order = $this->orderService->createOrder($service, $client, null, 15000);

        $this->assertEquals(15000, $order->agreed_price);
        $this->assertEquals(1500, $order->service_fee);
    }

    public function test_provider_can_accept_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $result = $this->orderService->acceptOrder($order, $providerUser);

        $this->assertEquals(OrderStatus::ACCEPTED, $result->status);
        $this->assertNotNull($result->accepted_at);
    }

    public function test_non_provider_cannot_accept_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();
        $otherUser = User::factory()->provider()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Não tem permissão para realizar esta acção.');

        $this->orderService->acceptOrder($order, $otherUser);
    }

    public function test_provider_can_start_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->accepted()
            ->create();

        $result = $this->orderService->startOrder($order, $providerUser);

        $this->assertEquals(OrderStatus::IN_PROGRESS, $result->status);
        $this->assertNotNull($result->started_at);
    }

    public function test_cannot_start_pending_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Este pedido não pode ser iniciado no estado atual.');

        $this->orderService->startOrder($order, $providerUser);
    }

    public function test_provider_can_deliver_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->inProgress()
            ->create();

        $result = $this->orderService->deliverOrder($order, $providerUser, 'Trabalho concluído!');

        $this->assertEquals(OrderStatus::DELIVERED, $result->status);
        $this->assertNotNull($result->delivered_at);
        $this->assertEquals('Trabalho concluído!', $result->delivery_notes);
    }

    public function test_client_can_complete_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create([
            'completed_services' => 5,
        ]);
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->delivered()
            ->create();

        $result = $this->orderService->completeOrder($order, $client);

        $this->assertEquals(OrderStatus::COMPLETED, $result->status);
        $this->assertNotNull($result->completed_at);

        // Check provider's completed_services was incremented
        $provider->refresh();
        $this->assertEquals(6, $provider->completed_services);
    }

    public function test_client_can_cancel_pending_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $result = $this->orderService->cancelOrder($order, $client, 'Mudei de ideias');

        $this->assertEquals(OrderStatus::CANCELLED, $result->status);
        $this->assertEquals('Mudei de ideias', $result->cancellation_reason);
    }

    public function test_cannot_cancel_completed_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->completed()
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Este pedido não pode ser cancelado no estado actual.');

        $this->orderService->cancelOrder($order, $client, 'Quero cancelar');
    }

    public function test_client_can_dispute_delivered_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->delivered()
            ->create();

        $result = $this->orderService->disputeOrder($order, $client, 'Serviço não corresponde ao combinado');

        $this->assertEquals(OrderStatus::DISPUTED, $result->status);
        $this->assertEquals('Serviço não corresponde ao combinado', $result->dispute_reason);
    }

    public function test_get_client_orders(): void
    {
        $client = User::factory()->client()->create();

        // Create orders for this client
        Order::factory()->count(3)->forClient($client)->create();

        // Create orders for another client
        $otherClient = User::factory()->client()->create();
        Order::factory()->count(2)->forClient($otherClient)->create();

        $orders = $this->orderService->getClientOrders($client);

        $this->assertEquals(3, $orders->total());
    }

    public function test_get_client_stats(): void
    {
        $client = User::factory()->client()->create();

        Order::factory()->forClient($client)->pending()->create(['agreed_price' => 1000]);
        Order::factory()->forClient($client)->inProgress()->create(['agreed_price' => 2000]);
        Order::factory()->forClient($client)->completed()->create(['agreed_price' => 3000]);
        Order::factory()->forClient($client)->completed()->create(['agreed_price' => 4000]);

        $stats = $this->orderService->getClientStats($client);

        $this->assertEquals(4, $stats['total']);
        $this->assertEquals(2, $stats['active']); // pending + in_progress
        $this->assertEquals(2, $stats['completed']);
        $this->assertEquals(7000, $stats['total_spent']);
    }

    public function test_service_fee_calculation(): void
    {
        $this->assertEquals(100, $this->orderService->calculateServiceFee(1000));
        $this->assertEquals(1500, $this->orderService->calculateServiceFee(15000));
        $this->assertEquals(0, $this->orderService->calculateServiceFee(0));
    }
}
