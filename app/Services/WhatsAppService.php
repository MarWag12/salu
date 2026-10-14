<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $apiUrl;
    protected string $apiToken;
    protected string $phoneNumberId;
    protected bool $enabled;

    public function __construct()
    {
        // Meta WhatsApp Business API configuration
        $this->apiUrl = config('services.whatsapp.url', 'https://graph.facebook.com/v18.0');
        $this->apiToken = config('services.whatsapp.token', '');
        $this->phoneNumberId = config('services.whatsapp.phone_number_id', '');
        $this->enabled = config('services.whatsapp.enabled', false);
    }

    /**
     * Send WhatsApp text message.
     */
    public function send(string $phone, string $message): bool
    {
        if (!$this->enabled) {
            Log::info('[WhatsApp] Service disabled. Would send to: ' . $phone, ['message' => $message]);
            return true;
        }

        $phone = $this->formatPhone($phone);

        if (!$this->isValidPhone($phone)) {
            Log::warning('[WhatsApp] Invalid phone number: ' . $phone);
            return false;
        }

        try {
            $response = Http::withToken($this->apiToken)
                ->post("{$this->apiUrl}/{$this->phoneNumberId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $phone,
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $message,
                    ],
                ]);

            if ($response->successful()) {
                Log::info('[WhatsApp] Message sent to: ' . $phone);
                return true;
            }

            Log::error('[WhatsApp] Failed to send message', [
                'phone' => $phone,
                'response' => $response->json(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('[WhatsApp] Exception sending message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send WhatsApp template message.
     */
    public function sendTemplate(string $phone, string $templateName, array $parameters = [], string $language = 'pt_BR'): bool
    {
        if (!$this->enabled) {
            Log::info('[WhatsApp] Service disabled. Would send template to: ' . $phone, [
                'template' => $templateName,
                'parameters' => $parameters,
            ]);
            return true;
        }

        $phone = $this->formatPhone($phone);

        if (!$this->isValidPhone($phone)) {
            Log::warning('[WhatsApp] Invalid phone number: ' . $phone);
            return false;
        }

        try {
            $components = [];

            if (!empty($parameters)) {
                $components[] = [
                    'type' => 'body',
                    'parameters' => array_map(function ($param) {
                        return ['type' => 'text', 'text' => $param];
                    }, $parameters),
                ];
            }

            $response = Http::withToken($this->apiToken)
                ->post("{$this->apiUrl}/{$this->phoneNumberId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to' => $phone,
                    'type' => 'template',
                    'template' => [
                        'name' => $templateName,
                        'language' => ['code' => $language],
                        'components' => $components,
                    ],
                ]);

            if ($response->successful()) {
                Log::info('[WhatsApp] Template sent to: ' . $phone, ['template' => $templateName]);
                return true;
            }

            Log::error('[WhatsApp] Failed to send template', [
                'phone' => $phone,
                'template' => $templateName,
                'response' => $response->json(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('[WhatsApp] Exception sending template', [
                'phone' => $phone,
                'template' => $templateName,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send order notification via WhatsApp.
     */
    public function sendOrderNotification(string $phone, string $orderRef, string $status, string $message): bool
    {
        $fullMessage = "🛒 *Salu - Atualização do Pedido*\n\n"
            . "📋 Pedido: {$orderRef}\n"
            . "📌 Estado: {$status}\n\n"
            . $message . "\n\n"
            . "Acesse o app para mais detalhes.";

        return $this->send($phone, $fullMessage);
    }

    /**
     * Send welcome message to new user.
     */
    public function sendWelcome(string $phone, string $name): bool
    {
        $message = "👋 *Bem-vindo ao Salu, {$name}!*\n\n"
            . "Estamos felizes em tê-lo connosco. O Salu é a sua plataforma para encontrar os melhores prestadores de serviços em Angola.\n\n"
            . "🔍 Explore serviços\n"
            . "⭐ Avalie prestadores\n"
            . "💬 Converse diretamente\n\n"
            . "Precisa de ajuda? Responda a esta mensagem.";

        return $this->send($phone, $message);
    }

    /**
     * Format phone number to WhatsApp format.
     */
    protected function formatPhone(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If starts with +, remove it (WhatsApp API doesn't need it)
        $phone = ltrim($phone, '+');

        // If starts with 244, it's already in international format
        if (str_starts_with($phone, '244')) {
            return $phone;
        }

        // If starts with 0, remove it
        if (str_starts_with($phone, '0')) {
            $phone = substr($phone, 1);
        }

        // Add Angola country code
        if (strlen($phone) === 9) {
            return '244' . $phone;
        }

        return $phone;
    }

    /**
     * Validate phone number for WhatsApp.
     */
    protected function isValidPhone(string $phone): bool
    {
        // Angola phone numbers: 244 followed by 9 digits
        return preg_match('/^244(9[0-9]{8}|2[0-9]{8})$/', $phone) === 1;
    }
}
