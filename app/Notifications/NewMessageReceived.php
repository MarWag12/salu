<?php

namespace App\Notifications;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMessageReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Message $message,
        protected Conversation $conversation
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $sender = $this->message->sender;
        $serviceName = $this->conversation->service?->name;

        $mail = (new MailMessage)
            ->subject('Nova mensagem de ' . $sender->name)
            ->greeting("Olá {$notifiable->name}!")
            ->line("{$sender->name} enviou-lhe uma nova mensagem.");

        if ($serviceName) {
            $mail->line("Serviço: {$serviceName}");
        }

        $mail->line('Mensagem:')
            ->line('"' . \Str::limit($this->message->content, 200) . '"')
            ->action('Responder', url('/messages/' . $this->conversation->id))
            ->line('Obrigado por usar a nossa plataforma!');

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'conversation_id' => $this->conversation->id,
            'message_id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender->name,
            'service_id' => $this->conversation->service_id,
            'service_name' => $this->conversation->service?->name,
            'content_preview' => \Str::limit($this->message->content, 100),
            'message' => $this->getMessage(),
        ];
    }

    protected function getMessage(): string
    {
        $senderName = $this->message->sender->name;

        if ($this->conversation->service) {
            return "{$senderName} enviou uma mensagem sobre \"{$this->conversation->service->name}\".";
        }

        return "{$senderName} enviou-lhe uma nova mensagem.";
    }
}
