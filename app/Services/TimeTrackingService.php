<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderTimeEntry;
use App\Models\OrderTimerSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TimeTrackingService
{
    public function __construct(
        protected WalletService $walletService
    ) {}

    /**
     * Start timer for an order.
     */
    public function startTimer(Order $order, User $provider): array
    {
        // Validate order can start timer
        if ($order->timer_active) {
            throw new \Exception('Timer já está ativo para esta encomenda.');
        }

        if (!$order->isInProgress()) {
            throw new \Exception('Apenas encomendas em progresso podem iniciar o cronómetro.');
        }

        // Check if service is hourly
        $service = $order->service;
        if ($service->price_type->value !== 'hourly') {
            throw new \Exception('Cronómetro só está disponível para serviços cobrados por hora.');
        }

        return DB::transaction(function () use ($order, $provider) {
            // Create new timer session
            $session = OrderTimerSession::create([
                'order_id' => $order->id,
                'started_at' => now(),
                'status' => 'active',
                'is_current' => true,
                'active_duration_seconds' => 0,
                'paused_duration_seconds' => 0,
            ]);

            // Log time entry
            $this->logTimeEntry($order, 'start', 0);

            // Update order
            $order->update([
                'timer_active' => true,
                'timer_started_at' => now(),
                'timer_last_action_at' => now(),
            ]);

            return [
                'success' => true,
                'session_token' => $session->session_token,
                'started_at' => $session->started_at->toIso8601String(),
                'elapsed_seconds' => 0,
            ];
        });
    }

    /**
     * Pause timer for an order.
     */
    public function pauseTimer(Order $order, User $provider, ?string $reason = null): array
    {
        if (!$order->timer_active) {
            throw new \Exception('Timer não está ativo para esta encomenda.');
        }

        $session = $order->currentTimerSession;
        if (!$session || !$session->isActive()) {
            throw new \Exception('Sessão de timer ativa não encontrada.');
        }

        return DB::transaction(function () use ($order, $session, $reason) {
            // Calculate elapsed time since start/resume
            $lastActionTime = $session->resumed_at ?? $session->started_at;
            $elapsedSinceLastAction = (int) max(0, floor($lastActionTime->diffInSeconds(now())));

            // Update active duration
            $newActiveDuration = $session->active_duration_seconds + $elapsedSinceLastAction;

            // Update session
            $session->update([
                'status' => 'paused',
                'paused_at' => now(),
                'active_duration_seconds' => $newActiveDuration,
            ]);

            // Log time entry
            $this->logTimeEntry($order, 'pause', $elapsedSinceLastAction, $reason);

            // Update order
            $order->update([
                'timer_active' => false,
                'timer_last_action_at' => now(),
                'timer_pause_count' => $order->timer_pause_count + 1,
            ]);

            return [
                'success' => true,
                'paused_at' => now()->toIso8601String(),
                'elapsed_seconds' => $newActiveDuration,
                'formatted_time' => $session->getFormattedDuration(),
            ];
        });
    }

    /**
     * Resume timer for an order.
     */
    public function resumeTimer(Order $order, User $provider): array
    {
        if ($order->timer_active) {
            throw new \Exception('Timer já está ativo para esta encomenda.');
        }

        $session = $order->currentTimerSession;
        if (!$session || !$session->isPaused()) {
            throw new \Exception('Sessão de timer pausada não encontrada.');
        }

        return DB::transaction(function () use ($order, $session) {
            // Calculate paused duration
            $pausedSince = $session->paused_at;
            $pausedDuration = (int) max(0, floor($pausedSince->diffInSeconds(now())));

            // Update session
            $session->update([
                'status' => 'active',
                'resumed_at' => now(),
                'paused_duration_seconds' => $session->paused_duration_seconds + $pausedDuration,
            ]);

            // Log time entry
            $this->logTimeEntry($order, 'resume', 0);

            // Update order
            $order->update([
                'timer_active' => true,
                'timer_last_action_at' => now(),
            ]);

            return [
                'success' => true,
                'resumed_at' => now()->toIso8601String(),
                'elapsed_seconds' => $session->active_duration_seconds,
            ];
        });
    }

    /**
     * Stop timer for an order.
     */
    public function stopTimer(Order $order, User $provider, ?string $notes = null): array
    {
        $session = $order->currentTimerSession;
        if (!$session) {
            throw new \Exception('Sessão de timer não encontrada.');
        }

        if ($session->isStopped()) {
            throw new \Exception('Timer já foi parado para esta encomenda.');
        }

        return DB::transaction(function () use ($order, $session, $notes) {
            // Calculate final elapsed time
            if ($session->isActive()) {
                $lastActionTime = $session->resumed_at ?? $session->started_at;
                $elapsedSinceLastAction = (int) max(0, floor($lastActionTime->diffInSeconds(now())));
                $finalActiveDuration = $session->active_duration_seconds + $elapsedSinceLastAction;
            } else {
                $finalActiveDuration = $session->active_duration_seconds;
            }

            // Update session
            $session->update([
                'status' => 'stopped',
                'stopped_at' => now(),
                'active_duration_seconds' => $finalActiveDuration,
                'is_current' => false,
                'stop_reason' => $notes,
            ]);

            // Calculate price based on time
            $service = $order->service;
            $hourlyRate = $service->price_min; // Assuming price_min is the hourly rate
            $hoursWorked = $finalActiveDuration / 3600;
            $calculatedPrice = round($hourlyRate * $hoursWorked, 2);

            // Log time entry
            $this->logTimeEntry($order, 'stop', $finalActiveDuration, $notes);

            // Update order
            $order->update([
                'timer_active' => false,
                'timer_last_action_at' => now(),
                'calculated_price' => $calculatedPrice,
                'total_work_duration_seconds' => $finalActiveDuration,
            ]);

            // Só é preciso reter mais dinheiro se o tempo real exceder o que já está retido
            $originalPrice = $order->agreed_price;
            $alreadyHeld = $order->payment_method === 'wallet'
                ? $this->walletService->activeHeldAmount($order)
                : (float) $originalPrice;
            $priceDifference = $calculatedPrice - max($alreadyHeld, (float) $originalPrice);

            if ($priceDifference > 0) {
                // Need more money - create additional hold
                try {
                    $this->walletService->createAdditionalHold(
                        $order,
                        $priceDifference,
                        'Ajuste de tempo de serviço'
                    );
                } catch (\Exception $e) {
                    Log::warning('Failed to create additional hold for order ' . $order->id, [
                        'error' => $e->getMessage(),
                        'additional_amount' => $priceDifference,
                    ]);
                    // Continue even if hold fails - admin can resolve later
                }
            }

            return [
                'success' => true,
                'stopped_at' => now()->toIso8601String(),
                'elapsed_seconds' => $finalActiveDuration,
                'formatted_time' => $session->getFormattedDuration(),
                'hours_worked' => round($hoursWorked, 2),
                'calculated_price' => $calculatedPrice,
                'original_price' => $originalPrice,
                'price_difference' => $priceDifference,
                'needs_additional_payment' => $priceDifference > 0,
            ];
        });
    }

    /**
     * Client disputes the timer.
     */
    public function disputeTimer(Order $order, User $client, string $reason, int $disputedSeconds): void
    {
        $session = $order->currentTimerSession;
        if (!$session || !$session->isStopped()) {
            throw new \Exception('Timer deve estar parado para ser disputado.');
        }

        DB::transaction(function () use ($order, $reason, $disputedSeconds) {
            // Log dispute entry
            $this->logTimeEntry($order, 'dispute', $disputedSeconds, $reason);

            // Update order
            $order->update([
                'client_disputed_at' => now(),
                'timer_dispute_resolved' => false,
            ]);

            // Create a formal dispute if needed
            // This would integrate with your existing dispute system
        });
    }

    /**
     * Get current timer status.
     */
    public function getTimerStatus(Order $order): array
    {
        $session = $order->currentTimerSession;

        if (!$session) {
            return [
                'has_timer' => false,
                'is_active' => false,
            ];
        }

        $currentSeconds = $session->getCurrentActiveSeconds();

        return [
            'has_timer' => true,
            'is_active' => $order->timer_active,
            'status' => $session->status,
            'session_token' => $session->session_token,
            'started_at' => $session->started_at->toIso8601String(),
            'paused_at' => $session->paused_at?->toIso8601String(),
            'resumed_at' => $session->resumed_at?->toIso8601String(),
            'stopped_at' => $session->stopped_at?->toIso8601String(),
            'elapsed_seconds' => $currentSeconds,
            'formatted_time' => $session->getFormattedDuration(),
            'pause_count' => $order->timer_pause_count,
            'is_disputed' => $order->client_disputed_at !== null,
        ];
    }

    /**
     * Log time entry for audit trail.
     */
    protected function logTimeEntry(Order $order, string $type, int $elapsedSeconds = 0, ?string $notes = null): OrderTimeEntry
    {
        return OrderTimeEntry::create([
            'order_id' => $order->id,
            'type' => $type,
            'logged_at' => now(),
            'elapsed_seconds' => $elapsedSeconds,
            'notes' => $notes,
            'metadata' => [
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ],
        ]);
    }

    /**
     * Calculate price based on elapsed time.
     */
    public function calculatePriceFromTime(Order $order, int $elapsedSeconds): float
    {
        $service = $order->service;
        $hourlyRate = $service->price_min;
        $hoursWorked = $elapsedSeconds / 3600;

        return round($hourlyRate * $hoursWorked, 2);
    }

    /**
     * Get timer breakdown for detailed view.
     */
    public function getTimerBreakdown(Order $order): array
    {
        $entries = $order->timeEntries()->orderBy('logged_at')->get();
        $session = $order->currentTimerSession;

        return [
            'entries' => $entries->map(fn($entry) => [
                'type' => $entry->type,
                'logged_at' => $entry->logged_at->toIso8601String(),
                'elapsed_seconds' => $entry->elapsed_seconds,
                'notes' => $entry->notes,
                'formatted_time' => gmdate('H:i:s', $entry->elapsed_seconds ?? 0),
            ]),
            'session' => $session ? [
                'total_active_seconds' => $session->active_duration_seconds,
                'total_paused_seconds' => $session->paused_duration_seconds,
                'pause_count' => $order->timer_pause_count,
            ] : null,
        ];
    }
}
