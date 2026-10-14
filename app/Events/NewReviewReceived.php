<?php

namespace App\Events;

use App\Models\Review;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewReviewReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Review $review;

    /**
     * Create a new event instance.
     */
    public function __construct(Review $review)
    {
        $this->review = $review;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to the provider's private channel
        $providerId = $this->review->provider_id;

        // Get the user ID of the provider
        $userId = $this->review->provider?->user_id;

        if (!$userId) {
            return [];
        }

        return [
            new PrivateChannel('user.' . $userId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->review->id,
            'type' => 'new_review',
            'review_type' => $this->review->review_type,
            'service_id' => $this->review->service_id,
            'service_name' => $this->review->service?->name,
            'rating' => $this->review->rating,
            'reviewer_name' => $this->review->is_anonymous ? 'Utilizador Anónimo' : $this->review->user?->name,
            'has_comment' => !empty($this->review->comment),
            'message' => "Nova avaliação ({$this->review->rating}★) em {$this->review->service?->name}",
            'created_at' => $this->review->created_at?->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'review.received';
    }
}
