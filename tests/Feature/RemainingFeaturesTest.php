<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RemainingFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private User $client;
    private User $providerUser;
    private ServiceProvider $provider;
    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->client()->create();
        $this->providerUser = User::factory()->provider()->create();
        $this->provider = ServiceProvider::factory()->for($this->providerUser, 'user')->create(['is_verified' => true]);
        $this->service = Service::factory()->for($this->provider, 'serviceProvider')->create(['price_min' => 8000]);
    }

    public function test_wishlist_add_and_remove(): void
    {
        $this->actingAs($this->client)->post(route('wishlist.store', $this->service))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('wishlists', ['user_id' => $this->client->id, 'service_id' => $this->service->id]);
        $this->actingAs($this->client)->get(route('wishlist.index'))->assertOk();
        $this->actingAs($this->client)->delete(route('wishlist.destroy', $this->service))->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('wishlists', ['user_id' => $this->client->id, 'service_id' => $this->service->id]);
    }

    public function test_conversation_from_service_message_unread_and_read(): void
    {
        $this->actingAs($this->client)->post(route('services.contact', $this->service), ['message' => 'Olá, está disponível amanhã?'])
            ->assertSessionHasNoErrors();
        $conversation = \App\Models\Conversation::firstOrFail();

        $this->actingAs($this->providerUser)->getJson(route('messages.unread-count'))->assertOk();
        $this->actingAs($this->providerUser)->post(route('messages.store', $conversation), ['content' => 'Sim, às 10h.'])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseCount('messages', 2);

        $this->actingAs($this->client)->post(route('messages.read', $conversation))->assertSuccessful();
        $this->assertDatabaseMissing('messages', ['conversation_id' => $conversation->id, 'sender_id' => $this->providerUser->id, 'read_at' => null]);

        // Um terceiro não acede à conversa
        $other = User::factory()->client()->create();
        $this->actingAs($other)->get(route('messages.show', $conversation))->assertForbidden();
    }

    public function test_notifications_mark_read(): void
    {
        $this->actingAs($this->client)->post(route('services.contact', $this->service), ['message' => 'Olá!']);
        $this->assertGreaterThan(0, $this->providerUser->notifications()->count());
        $n = $this->providerUser->notifications()->first();

        $this->actingAs($this->providerUser)->getJson(route('notifications.unread-count'))->assertOk();
        $this->actingAs($this->providerUser)->post(route('notifications.read', $n->id))->assertRedirect();
        $this->assertNotNull($n->fresh()->read_at);
        $this->actingAs($this->providerUser)->post(route('notifications.read-all'))->assertRedirect();
        $this->assertEquals(0, $this->providerUser->unreadNotifications()->count());
    }

    public function test_provider_manages_order_tasks(): void
    {
        app(WalletService::class)->topUp($this->client, 50000);
        $order = app(\App\Services\OrderService::class)->createOrder($this->service, $this->client);

        $this->actingAs($this->providerUser)->post(route('orders.tasks.store', $order), [
            'description' => 'Trocar vedante', 'duration_minutes' => 30, 'value_charged' => 1500,
        ])->assertSessionHasNoErrors();
        $task = $order->tasks()->firstOrFail();
        $this->actingAs($this->providerUser)->post(route('orders.tasks.toggle', [$order, $task]))->assertSuccessful();
        $this->actingAs($this->providerUser)->patch(route('orders.tasks.update', [$order, $task]), ['description' => 'Trocar vedante e testar'])->assertSessionHasNoErrors();
        $this->actingAs($this->providerUser)->delete(route('orders.tasks.destroy', [$order, $task]))->assertSuccessful();
        $this->assertDatabaseCount('order_tasks', 0);
    }

    public function test_payout_methods_crud_and_default(): void
    {
        $p = $this->actingAs($this->providerUser);
        $p->post(route('provider.payout-methods.store'), [
            'type' => 'bank_transfer', 'name' => 'BAI', 'bank_name' => 'BAI',
            'account_number' => '1234567890', 'account_holder' => 'Prestador Teste',
            'iban' => 'AO06004000001234567890123', 'is_default' => true,
        ])->assertSessionHasNoErrors();
        $p->post(route('provider.payout-methods.store'), [
            'type' => 'mobile_money', 'name' => 'Unitel Money', 'phone_number' => '923000000',
            'provider_name' => 'Unitel Money', 'account_holder' => 'Prestador Teste',
        ])->assertSessionHasNoErrors();
        $this->assertEquals(2, $this->provider->payoutMethods()->count());

        $second = $this->provider->payoutMethods()->where('type', 'mobile_money')->firstOrFail();
        $p->post(route('provider.payout-methods.set-default', $second))->assertSessionHasNoErrors();
        $this->assertTrue((bool) $second->fresh()->is_default);
        $this->assertEquals(1, $this->provider->payoutMethods()->where('is_default', true)->count());

        $p->delete(route('provider.payout-methods.destroy', $second))->assertSessionHasNoErrors();
        $this->assertEquals(1, $this->provider->payoutMethods()->count());
    }

    public function test_earnings_pdf_export(): void
    {
        $response = $this->actingAs($this->providerUser)->get(route('provider.earnings.export'));
        $response->assertOk();
        $this->assertStringContainsString('pdf', (string) $response->headers->get('content-type'));
    }

    public function test_review_respond_update_delete(): void
    {
        $review = Review::factory()->forService($this->service)->byUser($this->client)->create(['review_type' => 'service']);

        $this->actingAs($this->providerUser)->post(route('reviews.respond', $review), ['response' => 'Obrigado pelo feedback!'])
            ->assertSessionHasNoErrors();
        $this->assertNotNull($review->fresh()->provider_response);

        $this->actingAs($this->client)->patch(route('reviews.update', $review), ['rating' => 4, 'comment' => 'Bom'])
            ->assertSessionHasNoErrors();
        $this->assertEquals(4, $review->fresh()->rating);

        $this->actingAs($this->client)->delete(route('reviews.destroy', $review))->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_password_and_profile_update(): void
    {
        $this->actingAs($this->client)->put(route('password.update'), [
            'current_password' => 'password', 'password' => 'NovaPass#2026', 'password_confirmation' => 'NovaPass#2026',
        ])->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('NovaPass#2026', $this->client->fresh()->password));

        $this->actingAs($this->client)->patch(route('profile.update'), [
            'name' => 'Nome Novo', 'email' => $this->client->email,
        ])->assertSessionHasNoErrors();
        $this->assertEquals('Nome Novo', $this->client->fresh()->name);
    }
}
