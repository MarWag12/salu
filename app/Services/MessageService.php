<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Service;
use App\Models\User;
use App\Notifications\NewMessageReceived;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class MessageService
{
    /**
     * Start or get existing conversation between users about a service.
     */
    public function startConversation(User $client, User $provider, ?Service $service = null): Conversation
    {
        // Validate provider has approved KYC
        if (!$provider->serviceProvider?->hasApprovedKyc()) {
            throw ValidationException::withMessages([
                'provider' => 'O prestador não está disponível para receber mensagens.',
            ]);
        }

        // Validate client is not provider
        if ($client->id === $provider->id) {
            throw ValidationException::withMessages([
                'client' => 'Não pode enviar mensagens para si mesmo.',
            ]);
        }

        // Find or create conversation
        return Conversation::firstOrCreate(
            [
                'client_id' => $client->id,
                'provider_id' => $provider->id,
                'service_id' => $service?->id,
            ],
            [
                'last_message_at' => now(),
            ]
        );
    }

    /**
     * Send a message in a conversation.
     */
    public function sendMessage(Conversation $conversation, User $sender, string $content): Message
    {
        // Validate sender is participant
        if (!$this->isParticipant($conversation, $sender)) {
            throw ValidationException::withMessages([
                'sender' => 'Não tem permissão para enviar mensagens nesta conversa.',
            ]);
        }

        // Validate provider KYC if sender is provider
        if ($sender->isProvider() && !$sender->serviceProvider?->hasApprovedKyc()) {
            throw ValidationException::withMessages([
                'sender' => 'Precisa ter verificação KYC aprovada para enviar mensagens.',
            ]);
        }

        // Create message
        $message = $conversation->messages()->create([
            'sender_id' => $sender->id,
            'content' => $content,
        ]);

        // Load sender for broadcasting
        $message->load('sender');

        // Broadcast message via WebSocket
        broadcast(new MessageSent($message))->toOthers();

        // Notify recipient
        $recipient = $conversation->getOtherParticipant($sender);
        $recipient->notify(new NewMessageReceived($message, $conversation));

        return $message;
    }

    /**
     * Get conversations for a user.
     */
    public function getConversationsForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Conversation::forUser($user)
            ->with([
                'client',
                'provider',
                'service',
                'latestMessage',
            ])
            ->withCount([
                'messages as unread_count' => function ($query) use ($user) {
                    $query->where('sender_id', '!=', $user->id)
                          ->whereNull('read_at');
                },
            ])
            ->orderBy('last_message_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get messages for a conversation.
     */
    public function getMessagesForConversation(
        Conversation $conversation,
        User $user,
        int $perPage = 50
    ): LengthAwarePaginator {
        // Validate user is participant
        if (!$this->isParticipant($conversation, $user)) {
            throw ValidationException::withMessages([
                'conversation' => 'Não tem permissão para ver esta conversa.',
            ]);
        }

        // Mark messages as read
        $conversation->markAsReadFor($user);

        return $conversation->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    /**
     * Get unread message count for a user.
     */
    public function getUnreadCountForUser(User $user): int
    {
        return Message::whereHas('conversation', function ($query) use ($user) {
            $query->forUser($user);
        })
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * Mark all messages in conversation as read for user.
     */
    public function markConversationAsRead(Conversation $conversation, User $user): void
    {
        if (!$this->isParticipant($conversation, $user)) {
            return;
        }

        $conversation->markAsReadFor($user);
    }

    /**
     * Check if user is participant in conversation.
     */
    public function isParticipant(Conversation $conversation, User $user): bool
    {
        return $conversation->client_id === $user->id || $conversation->provider_id === $user->id;
    }

    /**
     * Find or create conversation for contacting a service provider.
     */
    public function getConversationForService(User $client, Service $service): Conversation
    {
        $provider = $service->serviceProvider->user;

        return $this->startConversation($client, $provider, $service);
    }
}
