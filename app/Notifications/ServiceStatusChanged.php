<?php

namespace App\Notifications;

use App\Enums\ServiceStatus;
use App\Models\Service;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ServiceStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Service $service,
        protected ServiceStatus $oldStatus,
        protected ServiceStatus $newStatus
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject($this->getSubject());

        return match ($this->newStatus) {
            ServiceStatus::PUBLISHED => $message
                ->greeting("Olá {$notifiable->name}!")
                ->line("O seu serviço \"{$this->service->name}\" foi aprovado e está agora publicado na plataforma.")
                ->line('Os clientes podem agora encontrar e contactar-lhe sobre este serviço.')
                ->action('Ver Serviço', url('/provider/services'))
                ->line('Obrigado por usar a nossa plataforma!'),

            ServiceStatus::SUSPENDED => $message
                ->greeting("Olá {$notifiable->name},")
                ->line("O seu serviço \"{$this->service->name}\" foi suspenso.")
                ->line('O serviço não está mais visível na plataforma.')
                ->line('Se tiver dúvidas, por favor contacte o suporte.')
                ->action('Ver Meus Serviços', url('/provider/services')),

            default => $message
                ->greeting("Olá {$notifiable->name},")
                ->line("O estado do seu serviço \"{$this->service->name}\" foi actualizado.")
                ->line("Novo estado: {$this->newStatus->label()}")
                ->action('Ver Serviço', url('/provider/services')),
        };
    }

    public function toArray(object $notifiable): array
    {
        return [
            'service_id' => $this->service->id,
            'service_name' => $this->service->name,
            'old_status' => $this->oldStatus->value,
            'new_status' => $this->newStatus->value,
            'message' => $this->getMessage(),
        ];
    }

    protected function getSubject(): string
    {
        return match ($this->newStatus) {
            ServiceStatus::PUBLISHED => 'Serviço Aprovado - ' . $this->service->name,
            ServiceStatus::SUSPENDED => 'Serviço Suspenso - ' . $this->service->name,
            ServiceStatus::FEATURED => 'Serviço em Destaque - ' . $this->service->name,
            default => 'Actualização de Serviço - ' . $this->service->name,
        };
    }

    protected function getMessage(): string
    {
        return match ($this->newStatus) {
            ServiceStatus::PUBLISHED => "O serviço \"{$this->service->name}\" foi aprovado e publicado.",
            ServiceStatus::SUSPENDED => "O serviço \"{$this->service->name}\" foi suspenso.",
            ServiceStatus::FEATURED => "O serviço \"{$this->service->name}\" está agora em destaque.",
            default => "O estado do serviço \"{$this->service->name}\" foi actualizado para {$this->newStatus->label()}.",
        };
    }
}
