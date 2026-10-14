<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Order $order;
    public string $previousStatus;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order, string $previousStatus)
    {
        $this->order = $order;
        $this->previousStatus = $previousStatus;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to the client's private channel
        return [
            new PrivateChannel('user.' . $this->order->client_id),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $statusLabels = [
            'pending' => 'Pendente',
            'accepted' => 'Aceite',
            'in_progress' => 'Em Progresso',
            'delivered' => 'Entregue',
            'completed' => 'Concluido',
            'cancelled' => 'Cancelado',
            'disputed' => 'Em Disputa',
        ];

        $newStatusLabel = $statusLabels[$this->order->status->value] ?? $this->order->status->value;
        $previousStatusLabel = $statusLabels[$this->previousStatus] ?? $this->previousStatus;

        // Determine message based on status change
        $message = match($this->order->status->value) {
            'accepted' => "O seu pedido #{$this->order->reference} foi aceite pelo prestador.",
            'in_progress' => "O prestador iniciou o trabalho no pedido #{$this->order->reference}.",
            'delivered' => "O pedido #{$this->order->reference} foi marcado como entregue. Por favor confirme a recepcao.",
            'completed' => "O pedido #{$this->order->reference} foi concluido com sucesso.",
            'cancelled' => "O pedido #{$this->order->reference} foi cancelado.",
            'disputed' => "Foi aberta uma disputa no pedido #{$this->order->reference}.",
            default => "O estado do pedido #{$this->order->reference} foi alterado para {$newStatusLabel}.",
        };

        return [
            'order_id' => $this->order->id,
            'type' => 'order_status_changed',
            'reference' => $this->order->reference,
            'previous_status' => $this->previousStatus,
            'new_status' => $this->order->status->value,
            'new_status_label' => $newStatusLabel,
            'service_name' => $this->order->service?->name,
            'provider_name' => $this->order->provider?->display_name,
            'message' => $message,
            'updated_at' => $this->order->updated_at?->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order.status.changed';
    }
}
