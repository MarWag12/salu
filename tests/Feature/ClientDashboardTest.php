<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ClientDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    public function test_client_can_view_dashboard(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Client/Dashboard'));
    }

    public function test_unauthenticated_user_cannot_view_dashboard(): void
    {
        $response = $this->get(route('dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_dashboard_shows_order_statistics(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Create orders in various statuses
        Order::factory()->forService($service)->forClient($client)->pending()->create(['agreed_price' => 1000]);
        Order::factory()->forService($service)->forClient($client)->inProgress()->create(['agreed_price' => 2000]);
        Order::factory()->forService($service)->forClient($client)->delivered()->create(['agreed_price' => 3000]);
        Order::factory()->forService($service)->forClient($client)->completed()->create(['agreed_price' => 5000]);
        Order::factory()->forService($service)->forClient($client)->completed()->create(['agreed_price' => 4000]);

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->has('orderStats')
            ->where('orderStats.total', 5)
            ->where('orderStats.pending', 1)
            ->where('orderStats.in_progress', 1)
            ->where('orderStats.delivered', 1)
            ->where('orderStats.completed', 2)
            ->where('orderStats.total_spent', 9000)
        );
    }

    public function test_dashboard_shows_recent_orders(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Create 7 orders (should only show 5 recent)
        Order::factory()
            ->count(7)
            ->forService($service)
            ->forClient($client)
            ->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->has('recentOrders', 5)
        );
    }

    public function test_dashboard_shows_review_statistics(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Create reviews
        // Um utilizador só avalia cada serviço uma vez por tipo: usamos 3 serviços.
        foreach (range(1, 3) as $i) {
            $other = Service::factory()->for($provider, 'serviceProvider')->create();
            Review::factory()->forService($other)->byUser($client)->create();
        }

        // Create completed order without review (needs review)
        Order::factory()->forService($service)->forClient($client)->completed()->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->has('reviewStats')
            ->where('reviewStats.total', 3)
            ->where('reviewStats.pending_for_completed', 1)
        );
    }

    public function test_dashboard_shows_orders_needing_review(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Create 5 completed orders without review (should only show 3)
        Order::factory()
            ->count(5)
            ->forService($service)
            ->forClient($client)
            ->completed()
            ->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->has('ordersNeedingReview', 3)
        );
    }

    public function test_completed_orders_with_reviews_not_shown_as_needing_review(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Create completed order with review
        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->completed()
            ->create();

        Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create(['order_id' => $order->id]);

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->where('reviewStats.pending_for_completed', 0)
            ->has('ordersNeedingReview', 0)
        );
    }

    public function test_dashboard_shows_recent_services(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();

        // Create published services
        Service::factory()
            ->count(6)
            ->for($provider, 'serviceProvider')
            ->published()
            ->create();

        $client = User::factory()->client()->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->has('recentServices', 4) // Should show max 4
        );
    }

    public function test_dashboard_does_not_show_other_clients_orders(): void
    {
        $client = User::factory()->client()->create();
        $otherClient = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Create orders for other client
        Order::factory()
            ->count(3)
            ->forService($service)
            ->forClient($otherClient)
            ->create();

        // Create 1 order for this client
        Order::factory()
            ->forService($service)
            ->forClient($client)
            ->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->where('orderStats.total', 1)
            ->has('recentOrders', 1)
        );
    }

    public function test_dashboard_shows_active_orders_count(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Active orders: pending, accepted, in_progress, delivered
        Order::factory()->forService($service)->forClient($client)->pending()->create();
        Order::factory()->forService($service)->forClient($client)->accepted()->create();
        Order::factory()->forService($service)->forClient($client)->inProgress()->create();
        Order::factory()->forService($service)->forClient($client)->delivered()->create();

        // Non-active orders
        Order::factory()->forService($service)->forClient($client)->completed()->create();
        Order::factory()->forService($service)->forClient($client)->cancelled()->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->where('orderStats.total', 6)
            ->where('orderStats.active', 4)
        );
    }

    public function test_dashboard_shows_conversation_statistics(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();

        // Create conversations for the client
        $conversation1 = Conversation::factory()->create([
            'client_id' => $client->id,
            'provider_id' => $providerUser->id,
        ]);

        $conversation2 = Conversation::factory()->create([
            'client_id' => $client->id,
            'provider_id' => $providerUser->id,
        ]);

        // Create unread message from provider in conversation1
        Message::factory()->create([
            'conversation_id' => $conversation1->id,
            'sender_id' => $providerUser->id,
            'read_at' => null,
        ]);

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->has('conversationStats')
            ->where('conversationStats.total', 2)
        );
    }

    public function test_provider_cannot_access_client_dashboard(): void
    {
        $providerUser = User::factory()->provider()->create();
        ServiceProvider::factory()->for($providerUser, 'user')->create();

        $response = $this->actingAs($providerUser)->get(route('dashboard'));

        // O middleware devolve o prestador ao seu próprio painel.
        $response->assertRedirect(route('provider.dashboard'));
    }

    public function test_dashboard_order_stats_are_correct_for_empty_state(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->where('orderStats.total', 0)
            ->where('orderStats.active', 0)
            ->where('orderStats.pending', 0)
            ->where('orderStats.completed', 0)
            ->where('orderStats.total_spent', 0)
            ->has('recentOrders', 0)
            ->has('ordersNeedingReview', 0)
        );
    }

    public function test_recent_orders_include_correct_data(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create([
            'trading_name' => 'Provider Trading Name',
        ]);
        $service = Service::factory()->for($provider, 'serviceProvider')->create([
            'name' => 'Test Service',
        ]);

        Order::factory()
            ->forService($service)
            ->forClient($client)
            ->pending()
            ->create(['agreed_price' => 15000]);

        $response = $this->actingAs($client)->get(route('dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Client/Dashboard')
            ->has('recentOrders', 1)
            ->has('recentOrders.0', fn ($order) => $order
                ->has('id')
                ->has('reference')
                ->where('service_name', 'Test Service')
                ->where('provider_name', 'Provider Trading Name')
                ->where('status', 'pending')
                ->has('status_label')
                ->has('status_color')
                ->where('agreed_price', '15000.00')
                ->has('created_at')
            )
        );
    }
}
