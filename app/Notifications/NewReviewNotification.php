<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewReviewNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Review $review
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
        $review = $this->review;
        $service = $review->service;
        $reviewer = $review->user;

        $stars = str_repeat('★', $review->rating) . str_repeat('☆', 5 - $review->rating);

        $mailMessage = (new MailMessage)
            ->subject('Nova Avaliação Recebida - ' . $service->name)
            ->greeting('Olá ' . $notifiable->name . '!')
            ->line('Recebeu uma nova avaliação para o seu serviço.')
            ->line("**Serviço:** {$service->name}")
            ->line("**Cliente:** {$reviewer->name}")
            ->line("**Avaliação:** {$stars} ({$review->rating}/5)");

        if ($review->comment) {
            $mailMessage->line("**Comentário:** \"{$review->comment}\"");
        }

        if ($review->is_verified) {
            $mailMessage->line('✓ Compra Verificada');
        }

        $mailMessage
            ->action('Ver Avaliação', route('reviews.index'))
            ->line('Considere responder à avaliação para mostrar que valoriza o feedback dos seus clientes.')
            ->salutation('Obrigado por usar o Salu!');

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
            'type' => 'new_review',
            'review_id' => $this->review->id,
            'service_id' => $this->review->service_id,
            'service_name' => $this->review->service->name,
            'rating' => $this->review->rating,
            'reviewer_name' => $this->review->user->name,
            'has_comment' => !empty($this->review->comment),
            'message' => "Nova avaliação ({$this->review->rating}★) em {$this->review->service->name}",
        ];
    }
}
