<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Service;
use App\Services\ServiceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(
        protected ServiceService $serviceService
    ) {}

    /**
     * Display a listing of the provider's services.
     */
    public function index(Request $request): Response
    {
        $provider = $request->user()->serviceProvider;

        $services = $provider->services()
            ->with(['category', 'media'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Provider/Services/Index', [
            'services' => $services->through(fn($service) => [
                'id' => $service->id,
                'name' => $service->name,
                'category' => $service->category->name,
                'status' => $service->status->value,
                'status_label' => $service->status->label(),
                'status_color' => $service->status->color(),
                'formatted_price' => $service->formatted_price,
                'view_count' => $service->view_count,
                'cover_url' => $service->getFirstMediaUrl('cover', 'thumb'),
                'created_at' => $service->created_at->format('d/m/Y'),
                'is_featured' => $service->isFeatured(),
                'highlight_expires_at' => $service->highlight_expires_at?->format('d/m/Y'),
            ]),
            'has_approved_kyc' => $provider?->hasApprovedKyc() ?? false,
        ]);
    }

    /**
     * Show the form for creating a new service.
     */
    public function create(Request $request): Response
    {
        $provider = $request->user()->serviceProvider;

        // Check KYC status
        if (!$provider?->hasApprovedKyc()) {
            return Inertia::render('Provider/Services/Create', [
                'categories' => [],
                'price_types' => [],
                'kyc_required' => true,
            ]);
        }

        return Inertia::render('Provider/Services/Create', [
            'categories' => Category::active()->ordered()->get(['id', 'name']),
            'price_types' => [
                ['value' => 'fixed', 'label' => 'Preço Fixo'],
                ['value' => 'variable', 'label' => 'Preço Variável (Faixa)'],
                ['value' => 'hourly', 'label' => 'Por Hora'],
            ],
            'kyc_required' => false,
        ]);
    }

    /**
     * Store a newly created service.
     */
    public function store(Request $request): RedirectResponse
    {
        $provider = $request->user()->serviceProvider;

        $validated = $request->validate(ServiceService::validationRules());

        try {
            $this->serviceService->create(
                $provider,
                $validated,
                $request->file('cover_image'),
                $request->file('gallery_images', [])
            );

            return redirect()
                ->route('provider.services.index')
                ->with('success', 'Serviço criado com sucesso. Aguarda aprovação.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified service.
     */
    public function edit(Request $request, Service $service): Response
    {
        $provider = $request->user()->serviceProvider;

        // Ensure provider owns this service
        if ($service->service_provider_id !== $provider->id) {
            abort(403);
        }

        return Inertia::render('Provider/Services/Edit', [
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'description' => $service->description,
                'category_id' => $service->category_id,
                'price_type' => $service->price_type->value,
                'price_min' => $service->price_min,
                'price_max' => $service->price_max,
                'location' => $service->location,
                'delivery_time' => $service->delivery_time,
                'tags' => $service->tags ?? [],
                'status' => $service->status->value,
                'cover_url' => $service->getFirstMediaUrl('cover', 'thumb'),
                'gallery' => $service->getMedia('gallery')->map(fn($media) => [
                    'id' => $media->id,
                    'url' => $media->getUrl('thumb'),
                ]),
            ],
            'categories' => Category::active()->ordered()->get(['id', 'name']),
            'price_types' => [
                ['value' => 'fixed', 'label' => 'Preço Fixo'],
                ['value' => 'variable', 'label' => 'Preço Variável (Faixa)'],
                ['value' => 'hourly', 'label' => 'Por Hora'],
            ],
        ]);
    }

    /**
     * Update the specified service.
     */
    public function update(Request $request, Service $service): RedirectResponse
    {
        $provider = $request->user()->serviceProvider;

        // Ensure provider owns this service
        if ($service->service_provider_id !== $provider->id) {
            abort(403);
        }

        $validated = $request->validate(ServiceService::validationRules(isUpdate: true));

        try {
            $this->serviceService->update(
                $service,
                $validated,
                $request->file('cover_image'),
                $request->file('gallery_images', []),
                $request->input('remove_gallery_ids', [])
            );

            return redirect()
                ->route('provider.services.index')
                ->with('success', 'Serviço actualizado com sucesso.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove the specified service.
     */
    public function destroy(Request $request, Service $service): RedirectResponse
    {
        $provider = $request->user()->serviceProvider;

        // Ensure provider owns this service
        if ($service->service_provider_id !== $provider->id) {
            abort(403);
        }

        $this->serviceService->delete($service);

        return redirect()
            ->route('provider.services.index')
            ->with('success', 'Serviço eliminado com sucesso.');
    }
}
