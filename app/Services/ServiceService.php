<?php

namespace App\Services;

use App\Enums\PriceType;
use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Notifications\ServiceStatusChanged;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServiceService
{
    /**
     * Create a new service.
     */
    public function create(
        ServiceProvider $provider,
        array $data,
        ?UploadedFile $coverImage = null,
        array $galleryImages = []
    ): Service {
        // Validate KYC status
        if (!$provider->hasApprovedKyc()) {
            throw ValidationException::withMessages([
                'provider' => 'O prestador precisa ter verificação KYC aprovada para criar serviços.',
            ]);
        }

        // Validate category exists and is active
        $category = Category::where('id', $data['category_id'])->active()->first();
        if (!$category) {
            throw ValidationException::withMessages([
                'category_id' => 'A categoria seleccionada não está disponível.',
            ]);
        }

        return DB::transaction(function () use ($provider, $data, $coverImage, $galleryImages) {
            $service = $provider->services()->create([
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'description' => $data['description'],
                'price_type' => $data['price_type'],
                'price_min' => $data['price_min'],
                'price_max' => $data['price_max'] ?? null,
                'location' => $data['location'] ?? null,
                'delivery_time' => $data['delivery_time'] ?? null,
                'tags' => $data['tags'] ?? [],
                'status' => ServiceStatus::PENDING,
            ]);

            // Handle cover image
            if ($coverImage) {
                $service->addMedia($coverImage)
                    ->toMediaCollection('cover');
            }

            // Handle gallery images
            foreach ($galleryImages as $image) {
                if ($image instanceof UploadedFile) {
                    $service->addMedia($image)
                        ->toMediaCollection('gallery');
                }
            }

            return $service;
        });
    }

    /**
     * Update an existing service.
     */
    public function update(
        Service $service,
        array $data,
        ?UploadedFile $coverImage = null,
        array $galleryImages = [],
        array $removeGalleryIds = []
    ): Service {
        // Validate category if changed
        if (isset($data['category_id']) && $data['category_id'] !== $service->category_id) {
            $category = Category::where('id', $data['category_id'])->active()->first();
            if (!$category) {
                throw ValidationException::withMessages([
                    'category_id' => 'A categoria seleccionada não está disponível.',
                ]);
            }
        }

        return DB::transaction(function () use ($service, $data, $coverImage, $galleryImages, $removeGalleryIds) {
            $service->update([
                'category_id' => $data['category_id'] ?? $service->category_id,
                'name' => $data['name'] ?? $service->name,
                'description' => $data['description'] ?? $service->description,
                'price_type' => $data['price_type'] ?? $service->price_type,
                'price_min' => $data['price_min'] ?? $service->price_min,
                'price_max' => $data['price_max'] ?? $service->price_max,
                'location' => $data['location'] ?? $service->location,
                'delivery_time' => $data['delivery_time'] ?? $service->delivery_time,
                'tags' => $data['tags'] ?? $service->tags,
            ]);

            // Update cover image if provided
            if ($coverImage) {
                $service->clearMediaCollection('cover');
                $service->addMedia($coverImage)
                    ->toMediaCollection('cover');
            }

            // Remove specified gallery images
            if (!empty($removeGalleryIds)) {
                $service->getMedia('gallery')
                    ->whereIn('id', $removeGalleryIds)
                    ->each(fn($media) => $media->delete());
            }

            // Add new gallery images (respect max limit)
            $currentGalleryCount = $service->getMedia('gallery')->count();
            $maxGallery = 5;
            $availableSlots = $maxGallery - $currentGalleryCount;

            foreach (array_slice($galleryImages, 0, $availableSlots) as $image) {
                if ($image instanceof UploadedFile) {
                    $service->addMedia($image)
                        ->toMediaCollection('gallery');
                }
            }

            return $service->fresh();
        });
    }

    /**
     * Delete a service.
     */
    public function delete(Service $service): bool
    {
        return DB::transaction(function () use ($service) {
            // Clear all media
            $service->clearMediaCollection('cover');
            $service->clearMediaCollection('gallery');

            return $service->delete();
        });
    }

    /**
     * Approve a service (admin action).
     */
    public function approve(Service $service): Service
    {
        $oldStatus = $service->status;

        $service->update([
            'status' => ServiceStatus::PUBLISHED,
        ]);

        // Notify provider
        $service->serviceProvider->user->notify(
            new ServiceStatusChanged($service, $oldStatus, ServiceStatus::PUBLISHED)
        );

        return $service;
    }

    /**
     * Suspend a service (admin action).
     */
    public function suspend(Service $service): Service
    {
        $oldStatus = $service->status;

        $service->update([
            'status' => ServiceStatus::SUSPENDED,
        ]);

        // Notify provider
        $service->serviceProvider->user->notify(
            new ServiceStatusChanged($service, $oldStatus, ServiceStatus::SUSPENDED)
        );

        return $service;
    }

    /**
     * Activate highlight for a service.
     */
    public function activateHighlight(Service $service, int $durationDays): Service
    {
        $oldStatus = $service->status;

        $service->update([
            'status' => ServiceStatus::FEATURED,
            'highlight_expires_at' => now()->addDays($durationDays),
        ]);

        // Notify provider
        $service->serviceProvider->user->notify(
            new ServiceStatusChanged($service, $oldStatus, ServiceStatus::FEATURED)
        );

        return $service;
    }

    /**
     * Expire highlights that have passed their expiration date.
     */
    public function expireHighlights(): int
    {
        return Service::where('status', ServiceStatus::FEATURED)
            ->where('highlight_expires_at', '<=', now())
            ->update([
                'status' => ServiceStatus::PUBLISHED,
                'highlight_expires_at' => null,
            ]);
    }

    /**
     * Get validation rules for service creation/update.
     */
    public static function validationRules(bool $isUpdate = false): array
    {
        $requiredRules = $isUpdate ? ['sometimes', 'required'] : ['required'];

        return [
            'category_id' => [...$requiredRules, 'exists:categories,id'],
            'name' => [...$requiredRules, 'string', 'max:255'],
            'description' => [...$requiredRules, 'string', 'max:5000'],
            'price_type' => [...$requiredRules, 'in:' . implode(',', array_column(PriceType::cases(), 'value'))],
            'price_min' => [...$requiredRules, 'numeric', 'min:0'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'gte:price_min'],
            'location' => ['nullable', 'string', 'max:255'],
            'delivery_time' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:50'],
            'cover_image' => [
                $isUpdate ? 'nullable' : 'required',
                'image',
                'mimes:jpg,jpeg,png',
                'max:5120', // 5MB
            ],
            'gallery_images' => ['nullable', 'array', 'max:5'],
            'gallery_images.*' => ['image', 'mimes:jpg,jpeg,png', 'max:5120'],
            'remove_gallery_ids' => ['nullable', 'array'],
            'remove_gallery_ids.*' => ['integer'],
        ];
    }
}
