<?php

namespace App\Events;

use App\Models\ServiceRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Evento em tempo real (Laravel Reverb / Pusher) quando um pedido muda.
 * Enviado de imediato (sem fila) para não exigir um worker.
 */
class OrderUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /** @param  array<int,int>  $userIds  Utilizadores que devem ser notificados */
    public function __construct(
        public ServiceRequest $order,
        public string $title,
        public string $message,
        public array $userIds = [],
        public bool $toTechnicians = false,
    ) {
    }

    /** @return array<int, Channel> */
    public function broadcastOn(): array
    {
        $channels = array_map(fn (int $id) => new PrivateChannel('users.'.$id), array_values(array_unique($this->userIds)));

        if ($this->toTechnicians) {
            $channels[] = new PrivateChannel('technicians');
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.updated';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        $this->order->loadMissing('service');

        return [
            'id' => $this->order->id,
            'code' => $this->order->code,
            'status' => $this->order->status,
            'status_label' => $this->order->statusLabel(),
            'category_id' => $this->order->service?->category_id,
            'title' => $this->title,
            'message' => $this->message,
        ];
    }
}
