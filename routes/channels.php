<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal privado por utilizador - para notificações em tempo real
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Canal privado para conversas - permite apenas participantes da conversa
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);

    if (!$conversation) {
        return false;
    }

    return $conversation->client_id === $user->id || $conversation->provider_id === $user->id;
});

// Canal privado para pedidos - permite cliente e prestador
Broadcast::channel('order.{orderId}', function ($user, $orderId) {
    $order = \App\Models\Order::find($orderId);

    if (!$order) {
        return false;
    }

    return $order->client_id === $user->id || $order->provider_id === $user->serviceProvider?->id;
});

// Canal privado para prestador - para notificações de novos pedidos
Broadcast::channel('provider.{providerId}', function ($user, $providerId) {
    return $user->serviceProvider?->id === (int) $providerId;
});
