<?php

namespace App\Notifications;

use App\Models\KycVerification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class KycStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected KycVerification $verification,
        protected string $action
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = new MailMessage();

        switch ($this->action) {
            case 'approved':
                $message
                    ->subject('Verificação KYC Aprovada - Salu')
                    ->greeting('Parabéns!')
                    ->line('A sua verificação de identidade foi aprovada.')
                    ->line('Agora pode publicar os seus serviços na plataforma.')
                    ->action('Aceder ao Dashboard', url('/provider/dashboard'));
                break;

            case 'rejected':
                $message
                    ->subject('Verificação KYC Reprovada - Salu')
                    ->greeting('Olá,')
                    ->line('Infelizmente, a sua verificação de identidade foi reprovada.')
                    ->line('Motivo: ' . $this->verification->rejection_reason)
                    ->line('Pode submeter novos documentos para uma nova verificação.')
                    ->action('Submeter Novamente', url('/provider/profile'));
                break;

            case 'resubmit':
                $message
                    ->subject('Documentos KYC - Reenvio Necessário - Salu')
                    ->greeting('Olá,')
                    ->line('Precisamos que reenvie os seus documentos de verificação.')
                    ->line('Motivo: ' . $this->verification->rejection_reason)
                    ->action('Reenviar Documentos', url('/provider/profile'));
                break;
        }

        return $message->line('Obrigado por utilizar a Salu!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'kyc_status_changed',
            'verification_id' => $this->verification->id,
            'action' => $this->action,
            'status' => $this->verification->status->value,
            'reason' => $this->verification->rejection_reason,
            'message' => $this->getNotificationMessage(),
        ];
    }

    protected function getNotificationMessage(): string
    {
        return match ($this->action) {
            'approved' => 'A sua verificação KYC foi aprovada! Pode agora publicar serviços.',
            'rejected' => 'A sua verificação KYC foi reprovada. Verifique o motivo e submeta novamente.',
            'resubmit' => 'Por favor, reenvie os seus documentos de verificação.',
            default => 'O estado da sua verificação KYC foi alterado.',
        };
    }
}
