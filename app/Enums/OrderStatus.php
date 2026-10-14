<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';           // Aguardando aceitação do prestador
    case ACCEPTED = 'accepted';         // Aceite pelo prestador
    case IN_PROGRESS = 'in_progress';   // Em execução
    case DELIVERED = 'delivered';       // Entregue pelo prestador
    case COMPLETED = 'completed';       // Concluído (confirmado pelo cliente)
    case CANCELLED = 'cancelled';       // Cancelado
    case DISPUTED = 'disputed';         // Em disputa

    /**
     * Get the label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pendente',
            self::ACCEPTED => 'Aceite',
            self::IN_PROGRESS => 'Em Execução',
            self::DELIVERED => 'Entregue',
            self::COMPLETED => 'Concluído',
            self::CANCELLED => 'Cancelado',
            self::DISPUTED => 'Em Disputa',
        };
    }

    /**
     * Get the color for the status badge.
     */
    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'yellow',
            self::ACCEPTED => 'blue',
            self::IN_PROGRESS => 'cyan',
            self::DELIVERED => 'orange',
            self::COMPLETED => 'green',
            self::CANCELLED => 'red',
            self::DISPUTED => 'red',
        };
    }

    /**
     * Check if the order can be cancelled.
     */
    public function canBeCancelled(): bool
    {
        return in_array($this, [
            self::PENDING,
            self::ACCEPTED,
        ]);
    }

    /**
     * Check if the order is active.
     */
    public function isActive(): bool
    {
        return in_array($this, [
            self::PENDING,
            self::ACCEPTED,
            self::IN_PROGRESS,
            self::DELIVERED,
        ]);
    }

    /**
     * Check if the order is finished.
     */
    public function isFinished(): bool
    {
        return in_array($this, [
            self::COMPLETED,
            self::CANCELLED,
        ]);
    }

    /**
     * Get allowed transitions from current status.
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::PENDING => [self::ACCEPTED, self::CANCELLED],
            self::ACCEPTED => [self::IN_PROGRESS, self::CANCELLED],
            self::IN_PROGRESS => [self::DELIVERED, self::DISPUTED],
            self::DELIVERED => [self::COMPLETED, self::DISPUTED],
            self::DISPUTED => [self::COMPLETED, self::CANCELLED],
            self::COMPLETED, self::CANCELLED => [],
        };
    }
}
