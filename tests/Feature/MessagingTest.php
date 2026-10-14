<?php

namespace Tests\Feature;

use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Notifications\NewMessageReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MessagingTest extends TestCase
{
    use RefreshDatabase;

    protected User $clientUser;
    protected User $providerUser;
    protected ServiceProvider $provider;
    protected Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->clientUser = User::factory()->create([
            'type' => User::TYPE_CLIENT,
        ]);

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
    }

    public function test_client_can_start_conversation_from_service(): void
    {
        $response = $this->actingAs($this->clientUser)
            ->post(route('services.contact', $this->service), [
                'message' => 'Olá, tenho interesse no seu serviço!',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('conversations', [
            'client_id' => $this->clientUser->id,
            'provider_id' => $this->providerUser->id,
            'service_id' => $this->service->id,
        ]);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $this->clientUser->id,
            'content' => 'Olá, tenho interesse no seu serviço!',
        ]);

        Notification::assertSentTo(
            $this->providerUser,
            NewMessageReceived::class
        );
    }

    public function test_user_can_view_conversations(): void
    {
        Conversation::factory()->count(3)->create([
            'client_id' => $this->clientUser->id,
            'provider_id' => $this->providerUser->id,
        ]);

        $response = $this->actingAs($this->clientUser)
            ->get(route('messages.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Messages/Index')
                ->has('conversations.data', 3)
        );
    }

    public function test_user_can_send_message_in_conversation(): void
    {
        $conversation = Conversation::factory()->create([
            'client_id' => $this->clientUser->id,
            'provider_id' => $this->providerUser->id,
        ]);

        $response = $this->actingAs($this->clientUser)
            ->post(route('messages.store', $conversation), [
                'content' => 'Quando pode começar o trabalho?',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $this->clientUser->id,
            'content' => 'Quando pode começar o trabalho?',
        ]);

        Notification::assertSentTo(
            $this->providerUser,
            NewMessageReceived::class
        );
    }

    public function test_provider_can_respond_to_message(): void
    {
        $conversation = Conversation::factory()->create([
            'client_id' => $this->clientUser->id,
            'provider_id' => $this->providerUser->id,
        ]);

        $response = $this->actingAs($this->providerUser)
            ->post(route('messages.store', $conversation), [
                'content' => 'Posso começar na próxima semana.',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $this->providerUser->id,
        ]);

        Notification::assertSentTo(
            $this->clientUser,
            NewMessageReceived::class
        );
    }

    public function test_unverified_provider_cannot_send_messages(): void
    {
        $this->provider->update(['is_verified' => false]);

        $conversation = Conversation::factory()->create([
            'client_id' => $this->clientUser->id,
            'provider_id' => $this->providerUser->id,
        ]);

        $response = $this->actingAs($this->providerUser)
            ->post(route('messages.store', $conversation), [
                'content' => 'Tentativa de resposta',
            ]);

        // Pedido web (não JSON): a regra KYC devolve o erro na sessão.
        $response->assertSessionHasErrors('sender');
        $this->assertDatabaseMissing('messages', ['content' => 'Tentativa de resposta']);
    }

    public function test_messages_marked_as_read_when_viewed(): void
    {
        $conversation = Conversation::factory()->create([
            'client_id' => $this->clientUser->id,
            'provider_id' => $this->providerUser->id,
        ]);

        // Provider sends a message
        $message = Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->providerUser->id,
            'read_at' => null,
        ]);

        // Client views the conversation
        $this->actingAs($this->clientUser)
            ->get(route('messages.show', $conversation));

        $this->assertNotNull($message->fresh()->read_at);
    }

    public function test_cannot_view_other_users_conversation(): void
    {
        $otherClient = User::factory()->create(['type' => User::TYPE_CLIENT]);

        $conversation = Conversation::factory()->create([
            'client_id' => $otherClient->id,
            'provider_id' => $this->providerUser->id,
        ]);

        $response = $this->actingAs($this->clientUser)
            ->get(route('messages.show', $conversation));

        $response->assertForbidden();
    }

    public function test_unread_count_is_accurate(): void
    {
        $conversation = Conversation::factory()->create([
            'client_id' => $this->clientUser->id,
            'provider_id' => $this->providerUser->id,
        ]);

        // Provider sends 3 unread messages
        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->providerUser->id,
            'read_at' => null,
        ]);

        $response = $this->actingAs($this->clientUser)
            ->get(route('messages.index'));

        $response->assertInertia(fn ($page) =>
            $page->where('unreadCount', 3)
        );
    }
}
