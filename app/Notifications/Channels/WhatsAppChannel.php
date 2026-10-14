<?php

namespace App\Notifications\Channels;

use App\Services\WhatsAppService;
use Illuminate\Notifications\Notification;

class WhatsAppChannel
{
    protected WhatsAppService $whatsAppService;

    public function __construct(WhatsAppService $whatsAppService)
    {
        $this->whatsAppService = $whatsAppService;
    }

    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $phone = $notifiable->routeNotificationFor('whatsapp', $notification);

        if (!$phone) {
            return;
        }

        $message = $notification->toWhatsApp($notifiable);

        if (is_string($message)) {
            $this->whatsAppService->send($phone, $message);
        } elseif (is_array($message)) {
            // Template message
            if (isset($message['template'])) {
                $this->whatsAppService->sendTemplate(
                    $phone,
                    $message['template'],
                    $message['parameters'] ?? [],
                    $message['language'] ?? 'pt_BR'
                );
            }
        }
    }
}
