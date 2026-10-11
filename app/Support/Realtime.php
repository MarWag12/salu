<?php

namespace App\Support;

use App\Events\OrderUpdated;
use App\Models\ServiceRequest;

/** Envia notificações em tempo real sem nunca falhar o pedido se o servidor de WebSockets estiver em baixo. */
final class Realtime
{
    /** @param  array<int,int|null>  $userIds */
    public static function order(ServiceRequest $order, string $title, string $message, array $userIds = [], bool $technicians = false): void
    {
        $driver = config('broadcasting.default');
        if (! $driver || in_array($driver, ['null', 'log'], true)) {
            return;
        }

        try {
            event(new OrderUpdated($order, $title, $message, array_values(array_filter($userIds)), $technicians));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** IDs de utilizador do cliente e do técnico de um pedido. */
    public static function parties(ServiceRequest $order): array
    {
        $order->loadMissing('technician');

        return array_values(array_filter([$order->client_id, $order->technician?->user_id]));
    }
}
