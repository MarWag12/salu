<?php

namespace App\Notifications;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Order $order,
        public OrderStatus $newStatus,
        public bool $forClient = true
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['mail', 'database'];

        // Add SMS/WhatsApp if user has phone number
        if ($notifiable->phone) {
            $channels[] = \App\Notifications\Channels\WhatsAppChannel::class;
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->order;
        $mailMessage = new MailMessage();

        $mailMessage->subject($this->getSubject());
        $mailMessage->greeting('Olá ' . $notifiable->name . '!');

        foreach ($this->getMessageLines() as $line) {
            if (!empty($line)) {
                $mailMessage->line($line);
            }
        }

        $mailMessage->action('Ver Pedido', route('orders.show', $order));
        $mailMessage->salutation('Obrigado por usar o Salu!');

        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_status_changed',
            'order_id' => $this->order->id,
            'reference' => $this->order->reference,
            'status' => $this->newStatus->value,
            'status_label' => $this->newStatus->label(),
            'message' => $this->getNotificationMessage(),
        ];
    }

    /**
     * Get email subject based on status.
     */
    protected function getSubject(): string
    {
        $ref = $this->order->reference;

        return match ($this->newStatus) {
            OrderStatus::ACCEPTED => "Pedido Aceite - {$ref}",
            OrderStatus::IN_PROGRESS => "Trabalho Iniciado - {$ref}",
            OrderStatus::DELIVERED => "Serviço Entregue - {$ref}",
            OrderStatus::COMPLETED => "Pedido Concluído - {$ref}",
            OrderStatus::CANCELLED => "Pedido Cancelado - {$ref}",
            OrderStatus::DISPUTED => "Disputa Aberta - {$ref}",
            default => "Actualização do Pedido - {$ref}",
        };
    }

    /**
     * Get message lines based on status and recipient.
     */
    protected function getMessageLines(): array
    {
        $order = $this->order;
        $service = $order->service;
        $providerName = $order->provider->trading_name ?? $order->provider->user->name;
        $clientName = $order->client->name;

        if ($this->forClient) {
            return match ($this->newStatus) {
                OrderStatus::ACCEPTED => [
                    'O prestador aceitou o seu pedido!',
                    "**Serviço:** {$service->name}",
                    "**Prestador:** {$providerName}",
                    'O trabalho irá começar em breve.',
                ],
                OrderStatus::IN_PROGRESS => [
                    'O prestador iniciou o trabalho no seu pedido.',
                    "**Serviço:** {$service->name}",
                    "**Prestador:** {$providerName}",
                    'Será notificado quando o serviço for entregue.',
                ],
                OrderStatus::DELIVERED => [
                    'O prestador marcou o serviço como entregue!',
                    "**Serviço:** {$service->name}",
                    "**Prestador:** {$providerName}",
                    $order->delivery_notes ? "**Notas:** {$order->delivery_notes}" : '',
                    'Por favor, confirme a recepção do serviço.',
                ],
                OrderStatus::COMPLETED => [
                    'O seu pedido foi concluído com sucesso!',
                    "**Serviço:** {$service->name}",
                    "**Prestador:** {$providerName}",
                    "**Valor:** {$this->formatCurrency($order->agreed_price)}",
                    'Agradecemos a sua preferência. Considere deixar uma avaliação para ajudar outros utilizadores.',
                ],
                OrderStatus::CANCELLED => [
                    'O pedido foi cancelado.',
                    "**Serviço:** {$service->name}",
                    $order->cancellation_reason ? "**Motivo:** {$order->cancellation_reason}" : '',
                    'Se tiver dúvidas, entre em contacto connosco.',
                ],
                default => [
                    "O estado do seu pedido foi actualizado para: {$this->newStatus->label()}",
                ],
            };
        }

        // For provider
        return match ($this->newStatus) {
            OrderStatus::COMPLETED => [
                'O cliente confirmou a entrega do serviço!',
                "**Serviço:** {$service->name}",
                "**Cliente:** {$clientName}",
                "**Valor a receber:** {$this->formatCurrency($order->agreed_price - $order->service_fee)}",
                'O pagamento será processado em breve.',
            ],
            OrderStatus::CANCELLED => [
                'O pedido foi cancelado.',
                "**Serviço:** {$service->name}",
                "**Cliente:** {$clientName}",
                $order->cancellation_reason ? "**Motivo:** {$order->cancellation_reason}" : '',
            ],
            OrderStatus::DISPUTED => [
                'O cliente abriu uma disputa neste pedido.',
                "**Serviço:** {$service->name}",
                "**Cliente:** {$clientName}",
                $order->dispute_reason ? "**Motivo:** {$order->dispute_reason}" : '',
                'A nossa equipa irá analisar o caso e entrará em contacto.',
            ],
            default => [
                "O estado do pedido foi actualizado para: {$this->newStatus->label()}",
            ],
        };
    }

    /**
     * Get short notification message.
     */
    protected function getNotificationMessage(): string
    {
        $ref = $this->order->reference;

        return match ($this->newStatus) {
            OrderStatus::ACCEPTED => "Pedido {$ref} aceite",
            OrderStatus::IN_PROGRESS => "Trabalho iniciado no pedido {$ref}",
            OrderStatus::DELIVERED => "Serviço {$ref} marcado como entregue",
            OrderStatus::COMPLETED => "Pedido {$ref} concluído",
            OrderStatus::CANCELLED => "Pedido {$ref} cancelado",
            OrderStatus::DISPUTED => "Disputa aberta no pedido {$ref}",
            default => "Pedido {$ref} actualizado",
        };
    }

    /**
     * Format currency to AOA.
     */
    protected function formatCurrency(float $value): string
    {
        return number_format($value, 0, ',', '.') . ' AOA';
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): string
    {
        $order = $this->order;
        $statusLabel = $this->newStatus->label();
        $serviceName = $order->service->name ?? 'Serviço';
        $ref = $order->reference;

        $message = match ($this->newStatus) {
            OrderStatus::ACCEPTED => 'O prestador aceitou o seu pedido! O trabalho irá começar em breve.',
            OrderStatus::IN_PROGRESS => 'O prestador iniciou o trabalho no seu pedido.',
            OrderStatus::DELIVERED => 'O serviço foi entregue! Por favor, confirme a recepção.',
            OrderStatus::COMPLETED => 'Pedido concluído com sucesso! Obrigado por usar o Salu.',
            OrderStatus::CANCELLED => 'O pedido foi cancelado.',
            OrderStatus::DISPUTED => 'Disputa aberta neste pedido.',
            default => 'O estado do seu pedido foi atualizado.',
        };

        return "🛒 *Salu - Pedido {$ref}*\n\n"
            . "📌 Estado: {$statusLabel}\n"
            . "🔧 Serviço: {$serviceName}\n\n"
            . $message . "\n\n"
            . "Acesse o app para mais detalhes.";
    }

    /**
     * Get the SMS representation of the notification.
     */
    public function toSms(object $notifiable): string
    {
        $ref = $this->order->reference;

        return match ($this->newStatus) {
            OrderStatus::ACCEPTED => "Salu: Pedido {$ref} aceite pelo prestador.",
            OrderStatus::IN_PROGRESS => "Salu: Pedido {$ref} em progresso.",
            OrderStatus::DELIVERED => "Salu: Pedido {$ref} entregue. Confirme no app.",
            OrderStatus::COMPLETED => "Salu: Pedido {$ref} concluído. Avalie no app!",
            OrderStatus::CANCELLED => "Salu: Pedido {$ref} cancelado.",
            OrderStatus::DISPUTED => "Salu: Disputa aberta no pedido {$ref}.",
            default => "Salu: Pedido {$ref} atualizado.",
        };
    }
}
