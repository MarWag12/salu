<?php

namespace App\Notifications\Channels;

use App\Services\SmsService;
use Illuminate\Notifications\Notification;

class SmsChannel
{
    protected SmsService $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Send the given notification.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $phone = $notifiable->routeNotificationFor('sms', $notification);

        if (!$phone) {
            return;
        }

        $message = $notification->toSms($notifiable);

        if (is_string($message)) {
            $this->smsService->send($phone, $message);
        }
    }
}
