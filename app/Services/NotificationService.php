<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\Dispute;
use App\Models\Payout;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected SmsService $smsService;
    protected WhatsAppService $whatsAppService;

    public function __construct(SmsService $smsService, WhatsAppService $whatsAppService)
    {
        $this->smsService = $smsService;
        $this->whatsAppService = $whatsAppService;
    }

    /**
     * Send notification via preferred channel.
     */
    public function send(User $user, string $message, string $type = 'general'): void
    {
        $phone = $user->phone;

        if (!$phone) {
            Log::info('[Notification] User has no phone number', ['user_id' => $user->id]);
            return;
        }

        // Try WhatsApp first (preferred), then fallback to SMS
        $whatsappSent = $this->whatsAppService->send($phone, $message);

        if (!$whatsappSent) {
            $this->smsService->send($phone, $this->stripFormatting($message));
        }
    }

    /**
     * Send order status notification.
     */
    public function notifyOrderStatus(Order $order, string $status, bool $toClient = true): void
    {
        $user = $toClient ? $order->client : $order->provider->user;
        $phone = $user->phone;

        if (!$phone) {
            return;
        }

        $statusLabels = [
            'pending' => 'Pendente',
            'accepted' => 'Aceite',
            'in_progress' => 'Em Progresso',
            'delivered' => 'Entregue',
            'completed' => 'Concluído',
            'cancelled' => 'Cancelado',
            'disputed' => 'Em Disputa',
        ];

        $statusLabel = $statusLabels[$status] ?? $status;
        $serviceName = $order->service->name ?? 'Serviço';

        $messages = $this->getOrderStatusMessages($status, $order->reference, $serviceName, $toClient);

        $whatsappMessage = "🛒 *Salu - Pedido {$order->reference}*\n\n"
            . "📌 Estado: {$statusLabel}\n"
            . "🔧 Serviço: {$serviceName}\n\n"
            . $messages['detail'] . "\n\n"
            . "Acesse o app para mais detalhes.";

        $sent = $this->whatsAppService->send($phone, $whatsappMessage);

        if (!$sent) {
            $smsMessage = "Salu: {$messages['sms']}";
            $this->smsService->send($phone, $smsMessage);
        }
    }

    /**
     * Send dispute notification.
     */
    public function notifyDispute(Dispute $dispute, string $event): void
    {
        $order = $dispute->order;

        switch ($event) {
            case 'created':
                // Notify provider
                $this->sendDisputeMessage(
                    $dispute->provider->user,
                    $order->reference,
                    'O cliente abriu uma disputa. Responda para apresentar a sua versão dos factos.'
                );
                break;

            case 'responded':
                // Notify client
                $this->sendDisputeMessage(
                    $dispute->client,
                    $order->reference,
                    'O prestador respondeu à sua disputa. A equipa Salu está a analisar.'
                );
                break;

            case 'resolved':
                // Notify both parties
                $resolution = $dispute->status === 'resolved_client_favor'
                    ? 'A disputa foi resolvida a seu favor.'
                    : 'A disputa foi resolvida a favor do prestador.';

                $this->sendDisputeMessage($dispute->client, $order->reference, $resolution);
                $this->sendDisputeMessage($dispute->provider->user, $order->reference, $resolution);
                break;
        }
    }

    /**
     * Send payout notification.
     */
    public function notifyPayout(Payout $payout, string $event): void
    {
        $user = $payout->provider->user;
        $phone = $user->phone;

        if (!$phone) {
            return;
        }

        $amount = number_format($payout->net_amount, 0, ',', '.') . ' AOA';

        $messages = [
            'created' => "Pedido de levantamento de {$amount} criado. Referência: {$payout->reference}",
            'processing' => "Seu levantamento de {$amount} está sendo processado.",
            'completed' => "Levantamento de {$amount} concluído! O valor foi transferido para a sua conta.",
            'failed' => "Levantamento de {$amount} falhou. Entre em contacto com o suporte.",
        ];

        $message = $messages[$event] ?? "Atualização do levantamento {$payout->reference}";

        $whatsappMessage = "💰 *Salu - Levantamento*\n\n"
            . "📋 Ref: {$payout->reference}\n"
            . "💵 Valor: {$amount}\n\n"
            . $message;

        $sent = $this->whatsAppService->send($phone, $whatsappMessage);

        if (!$sent) {
            $this->smsService->send($phone, "Salu: {$message}");
        }
    }

    /**
     * Send welcome notification to new user.
     */
    public function sendWelcome(User $user): void
    {
        $phone = $user->phone;

        if (!$phone) {
            return;
        }

        // Try WhatsApp welcome first
        $sent = $this->whatsAppService->sendWelcome($phone, $user->name);

        if (!$sent) {
            $smsMessage = "Bem-vindo ao Salu, {$user->name}! Explore os melhores serviços de Angola. Acesse salu.ao";
            $this->smsService->send($phone, $smsMessage);
        }
    }

    /**
     * Send verification code.
     */
    public function sendVerificationCode(string $phone, string $code): bool
    {
        $message = "Seu código de verificação Salu é: {$code}. Válido por 10 minutos.";

        $whatsappMessage = "🔐 *Código de Verificação Salu*\n\n"
            . "Seu código: *{$code}*\n\n"
            . "Válido por 10 minutos. Não compartilhe este código.";

        $sent = $this->whatsAppService->send($phone, $whatsappMessage);

        if (!$sent) {
            return $this->smsService->send($phone, $message);
        }

        return true;
    }

    /**
     * Get order status messages.
     */
    protected function getOrderStatusMessages(string $status, string $reference, string $service, bool $toClient): array
    {
        if ($toClient) {
            return match ($status) {
                'accepted' => [
                    'detail' => 'O prestador aceitou o seu pedido! O trabalho irá começar em breve.',
                    'sms' => "Pedido {$reference} aceite pelo prestador.",
                ],
                'in_progress' => [
                    'detail' => 'O prestador iniciou o trabalho no seu pedido.',
                    'sms' => "Pedido {$reference} em progresso.",
                ],
                'delivered' => [
                    'detail' => 'O serviço foi entregue! Por favor, confirme a recepção.',
                    'sms' => "Pedido {$reference} entregue. Confirme no app.",
                ],
                'completed' => [
                    'detail' => 'Pedido concluído com sucesso! Obrigado por usar o Salu.',
                    'sms' => "Pedido {$reference} concluído. Avalie no app!",
                ],
                'cancelled' => [
                    'detail' => 'O pedido foi cancelado.',
                    'sms' => "Pedido {$reference} cancelado.",
                ],
                default => [
                    'detail' => 'O estado do seu pedido foi atualizado.',
                    'sms' => "Pedido {$reference} atualizado.",
                ],
            };
        }

        return match ($status) {
            'pending' => [
                'detail' => 'Novo pedido recebido! Responda ao cliente para aceitar.',
                'sms' => "Novo pedido {$reference}. Responda no app.",
            ],
            'completed' => [
                'detail' => 'O cliente confirmou a entrega! O pagamento será processado.',
                'sms' => "Pedido {$reference} confirmado pelo cliente.",
            ],
            'disputed' => [
                'detail' => 'O cliente abriu uma disputa. Responda para apresentar a sua versão.',
                'sms' => "Disputa aberta no pedido {$reference}.",
            ],
            default => [
                'detail' => 'O estado do pedido foi atualizado.',
                'sms' => "Pedido {$reference} atualizado.",
            ],
        };
    }

    /**
     * Send dispute message.
     */
    protected function sendDisputeMessage(User $user, string $orderRef, string $message): void
    {
        $phone = $user->phone;

        if (!$phone) {
            return;
        }

        $whatsappMessage = "⚠️ *Salu - Disputa*\n\n"
            . "📋 Pedido: {$orderRef}\n\n"
            . $message . "\n\n"
            . "Acesse o app para mais detalhes.";

        $sent = $this->whatsAppService->send($phone, $whatsappMessage);

        if (!$sent) {
            $this->smsService->send($phone, "Salu: {$message} Ref: {$orderRef}");
        }
    }

    /**
     * Strip WhatsApp formatting for SMS.
     */
    protected function stripFormatting(string $message): string
    {
        // Remove WhatsApp bold markers
        $message = preg_replace('/\*([^*]+)\*/', '$1', $message);
        // Remove emojis (basic)
        $message = preg_replace('/[\x{1F600}-\x{1F64F}]/u', '', $message);
        $message = preg_replace('/[\x{1F300}-\x{1F5FF}]/u', '', $message);
        $message = preg_replace('/[\x{1F680}-\x{1F6FF}]/u', '', $message);
        $message = preg_replace('/[\x{2600}-\x{26FF}]/u', '', $message);
        $message = preg_replace('/[\x{2700}-\x{27BF}]/u', '', $message);
        // Clean up multiple newlines
        $message = preg_replace('/\n{3,}/', "\n\n", $message);

        return trim($message);
    }
}
