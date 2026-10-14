<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Order $order,
        public bool $forProvider = true
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->order;
        $service = $order->service;

        if ($this->forProvider) {
            return (new MailMessage)
                ->subject('Novo Pedido Recebido - ' . $order->reference)
                ->greeting('Olá ' . $notifiable->name . '!')
                ->line('Recebeu um novo pedido para o seu serviço.')
                ->line('**Serviço:** ' . $service->name)
                ->line('**Cliente:** ' . $order->client->name)
                ->line('**Valor:** ' . $this->formatCurrency($order->agreed_price))
                ->line('**Referência:** ' . $order->reference)
                ->action('Ver Pedido', route('orders.show', $order))
                ->line('Por favor, reveja e responda ao pedido o mais brevemente possível.')
                ->salutation('Obrigado por usar o Salu!');
        }

        return (new MailMessage)
            ->subject('Pedido Criado - ' . $order->reference)
            ->greeting('Olá ' . $notifiable->name . '!')
            ->line('O seu pedido foi criado com sucesso.')
            ->line('**Serviço:** ' . $service->name)
            ->line('**Prestador:** ' . ($order->provider->trading_name ?? $order->provider->user->name))
            ->line('**Valor:** ' . $this->formatCurrency($order->agreed_price))
            ->line('**Referência:** ' . $order->reference)
            ->action('Ver Pedido', route('orders.show', $order))
            ->line('Aguarde a confirmação do prestador.')
            ->salutation('Obrigado por usar o Salu!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_created',
            'order_id' => $this->order->id,
            'reference' => $this->order->reference,
            'service_name' => $this->order->service->name,
            'amount' => $this->order->agreed_price,
            'message' => $this->forProvider
                ? 'Novo pedido recebido: ' . $this->order->reference
                : 'Pedido criado: ' . $this->order->reference,
        ];
    }

    /**
     * Format currency to AOA.
     */
    protected function formatCurrency(float $value): string
    {
        return number_format($value, 0, ',', '.') . ' AOA';
    }
}
