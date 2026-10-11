<?php

namespace App\Support;

use App\Models\Category;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\Technician;
use App\Models\User;

/** Converte modelos Eloquent nas estruturas simples (snake_case) que as páginas React esperam. */
final class Present
{
    public static function person(?User $u): ?array
    {
        return $u ? ['id' => $u->id, 'name' => $u->name, 'phone' => $u->phone, 'initials' => $u->initials()] : null;
    }

    public static function category(Category $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'icon' => $c->icon,
            'description' => $c->description,
            'services_count' => $c->services_count ?? null,
        ];
    }

    public static function service(Service $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'slug' => $s->slug,
            'description' => $s->description,
            'base_price' => (float) $s->base_price,
            'duration_label' => $s->durationLabel(),
            'image_url' => $s->imageUrl(),
            'category' => $s->relationLoaded('category') && $s->category
                ? ['id' => $s->category->id, 'name' => $s->category->name, 'slug' => $s->category->slug, 'icon' => $s->category->icon]
                : null,
        ];
    }

    public static function technician(Technician $t): array
    {
        return [
            'id' => $t->id,
            'name' => $t->user->name,
            'initials' => $t->user->initials(),
            'municipality' => $t->municipality,
            'bio' => $t->bio,
            'experience_years' => (int) $t->experience_years,
            'rating_avg' => (float) $t->rating_avg,
            'reviews_count' => (int) $t->reviews_count,
            'categories' => $t->relationLoaded('categories') ? $t->categories->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->all() : [],
        ];
    }

    public static function payment(Payment $p): array
    {
        return [
            'id' => $p->id,
            'amount' => (float) $p->amount,
            'method' => $p->method,
            'method_label' => $p->methodLabel(),
            'reference' => $p->reference,
            'status' => $p->status,
        ];
    }

    public static function order(ServiceRequest $o, bool $full = false): array
    {
        $data = [
            'id' => $o->id,
            'code' => $o->code,
            'status' => $o->status,
            'status_label' => $o->statusLabel(),
            'scheduled_at' => $o->scheduled_at?->toIso8601String(),
            'price' => (float) $o->price,
            'municipality' => $o->municipality,
            'service' => $o->relationLoaded('service') && $o->service ? [
                'id' => $o->service->id,
                'name' => $o->service->name,
                'category' => $o->service->relationLoaded('category') ? $o->service->category?->name : null,
            ] : null,
            'client' => $o->relationLoaded('client') ? self::person($o->client) : null,
            'technician' => $o->relationLoaded('technician') && $o->technician ? [
                ...self::person($o->technician->user),
                'rating_avg' => (float) $o->technician->rating_avg,
                'reviews_count' => (int) $o->technician->reviews_count,
            ] : null,
        ];

        if ($full) {
            $data += [
                'address' => $o->address,
                'description' => $o->description,
                'cancel_reason' => $o->cancel_reason,
                'completed_at' => $o->completed_at?->toIso8601String(),
                'payments' => $o->relationLoaded('payments') ? $o->payments->map(fn ($p) => self::payment($p))->all() : [],
                'review' => $o->relationLoaded('review') && $o->review
                    ? ['rating' => (int) $o->review->rating, 'comment' => $o->review->comment]
                    : null,
                'disputes' => $o->relationLoaded('disputes')
                    ? $o->disputes->map(fn ($d) => ['id' => $d->id, 'status' => $d->status, 'reason' => $d->reason, 'resolution' => $d->resolution])->all()
                    : [],
            ];
        }

        return $data;
    }

    /** @return array<int, array{value:string,label:string}> */
    public static function statuses(array $only = []): array
    {
        $all = collect(ServiceRequest::STATUSES)->map(fn ($v, $k) => ['value' => $k, 'label' => $v[0]])->values();

        return ($only ? $all->whereIn('value', $only)->values() : $all)->all();
    }

    /** @return array<int, array{value:string,label:string}> */
    public static function paymentMethods(): array
    {
        return collect(Payment::METHODS)->map(fn ($l, $k) => ['value' => $k, 'label' => $l])->values()->all();
    }
}
