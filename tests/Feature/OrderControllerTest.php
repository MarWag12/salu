<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    public function test_client_can_view_orders_index(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client)->get(route('orders.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Orders/Index'));
    }

    public function test_provider_can_view_orders_index(): void
    {
        $providerUser = User::factory()->provider()->create();
        ServiceProvider::factory()->for($providerUser, 'user')->create();

        $response = $this->actingAs($providerUser)->get(route('orders.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Orders/Index'));
    }

    public function test_unauthenticated_user_cannot_view_orders(): void
    {
        $response = $this->get(route('orders.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_client_can_create_order(): void
    {
        $client = User::factory()->client()->create();
        app(\App\Services\WalletService::class)->topUp($client, 100000);
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create([
            'price_min' => 5000,
        ]);

        $response = $this->actingAs($client)->post(route('orders.store'), [
            'service_id' => $service->id,
            'requirements' => 'Preciso deste serviço urgentemente',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('orders', [
            'service_id' => $service->id,
            'client_id' => $client->id,
            'provider_id' => $provider->id,
            'requirements' => 'Preciso deste serviço urgentemente',
        ]);
    }

    public function test_provider_cannot_order_own_service(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $response = $this->actingAs($providerUser)->post(route('orders.store'), [
            'service_id' => $service->id,
        ]);

        $response->assertSessionHasErrors(['service']);
    }

    public function test_client_can_view_own_order(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->create();

        $response = $this->actingAs($client)->get(route('orders.show', $order));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Orders/Show')
            ->has('order')
            ->where('isClient', true)
        );
    }

    public function test_provider_can_view_order_for_their_service(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->create();

        $response = $this->actingAs($providerUser)->get(route('orders.show', $order));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Orders/Show')
            ->where('isProvider', true)
        );
    }

    public function test_unauthorized_user_cannot_view_order(): void
    {
        $client = User::factory()->client()->create();
        $otherClient = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->create();

        $response = $this->actingAs($otherClient)->get(route('orders.show', $order));

        $response->assertStatus(403);
    }

    public function test_provider_can_accept_order(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $response = $this->actingAs($providerUser)->post(route('orders.accept', $order));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $order->refresh();
        $this->assertEquals(OrderStatus::ACCEPTED, $order->status);
    }

    public function test_client_cannot_accept_order(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $response = $this->actingAs($client)->post(route('orders.accept', $order));

        $response->assertSessionHasErrors(['error']);
    }

    public function test_provider_can_start_order(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->accepted()
            ->create();

        $response = $this->actingAs($providerUser)->post(route('orders.start', $order));

        $response->assertRedirect();

        $order->refresh();
        $this->assertEquals(OrderStatus::IN_PROGRESS, $order->status);
    }

    public function test_provider_can_deliver_order(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->inProgress()
            ->create();

        $response = $this->actingAs($providerUser)->post(route('orders.deliver', $order), [
            'delivery_notes' => 'Trabalho finalizado com sucesso!',
        ]);

        $response->assertRedirect();

        $order->refresh();
        $this->assertEquals(OrderStatus::DELIVERED, $order->status);
        $this->assertEquals('Trabalho finalizado com sucesso!', $order->delivery_notes);
    }

    public function test_client_can_complete_order(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->delivered()
            ->create();

        $response = $this->actingAs($client)->post(route('orders.complete', $order));

        $response->assertRedirect();

        $order->refresh();
        $this->assertEquals(OrderStatus::COMPLETED, $order->status);
    }

    public function test_client_can_cancel_pending_order(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $response = $this->actingAs($client)->post(route('orders.cancel', $order), [
            'reason' => 'Mudei de ideias',
        ]);

        $response->assertRedirect();

        $order->refresh();
        $this->assertEquals(OrderStatus::CANCELLED, $order->status);
    }

    public function test_cancel_requires_reason(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create();

        $response = $this->actingAs($client)->post(route('orders.cancel', $order), [
            'reason' => '',
        ]);

        $response->assertSessionHasErrors(['reason']);
    }

    public function test_client_can_open_dispute(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->delivered()
            ->create();

        $response = $this->actingAs($client)->post(route('orders.dispute', $order), [
            'reason' => 'O serviço não corresponde ao combinado',
        ]);

        $response->assertRedirect();

        $order->refresh();
        $this->assertEquals(OrderStatus::DISPUTED, $order->status);
    }
}
