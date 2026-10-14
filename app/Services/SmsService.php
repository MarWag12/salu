<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected string $senderId;
    protected bool $enabled;

    public function __construct()
    {
        $this->apiUrl = config('services.sms.url', '');
        $this->apiKey = config('services.sms.key', '');
        $this->senderId = config('services.sms.sender_id', 'SALU');
        $this->enabled = config('services.sms.enabled', false);
    }

    /**
     * Send SMS message.
     */
    public function send(string $phone, string $message): bool
    {
        if (!$this->enabled) {
            Log::info('[SMS] Service disabled. Would send to: ' . $phone, ['message' => $message]);
            return true;
        }

        $phone = $this->formatPhone($phone);

        if (!$this->isValidPhone($phone)) {
            Log::warning('[SMS] Invalid phone number: ' . $phone);
            return false;
        }

        try {
            // Generic SMS API implementation
            // Adjust based on the actual SMS provider (Infobip, Twilio, local providers)
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl . '/messages', [
                'from' => $this->senderId,
                'to' => $phone,
                'text' => $message,
            ]);

            if ($response->successful()) {
                Log::info('[SMS] Message sent to: ' . $phone);
                return true;
            }

            Log::error('[SMS] Failed to send message', [
                'phone' => $phone,
                'response' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('[SMS] Exception sending message', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send bulk SMS messages.
     */
    public function sendBulk(array $messages): array
    {
        $results = [];

        foreach ($messages as $msg) {
            $results[] = [
                'phone' => $msg['phone'],
                'success' => $this->send($msg['phone'], $msg['message']),
            ];
        }

        return $results;
    }

    /**
     * Format phone number to international format (Angola).
     */
    protected function formatPhone(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // If starts with 244, it's already in international format
        if (str_starts_with($phone, '244')) {
            return '+' . $phone;
        }

        // If starts with 0, remove it
        if (str_starts_with($phone, '0')) {
            $phone = substr($phone, 1);
        }

        // Add Angola country code
        if (strlen($phone) === 9) {
            return '+244' . $phone;
        }

        return '+' . $phone;
    }

    /**
     * Validate phone number.
     */
    protected function isValidPhone(string $phone): bool
    {
        // Angola phone numbers: +244 followed by 9 digits
        // Valid prefixes: 9xx (mobile), 2xx (landline)
        return preg_match('/^\+244(9[0-9]{8}|2[0-9]{8})$/', $phone) === 1;
    }

    /**
     * Get estimated SMS cost.
     */
    public function getEstimatedCost(string $message): float
    {
        // Standard SMS is 160 characters
        // Each SMS costs approximately 5 AOA
        $segments = ceil(strlen($message) / 160);
        return $segments * 5.0;
    }
}
