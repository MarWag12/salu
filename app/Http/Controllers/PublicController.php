<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Service;
use App\Models\Technician;
use App\Support\Present;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicController extends Controller
{
    public function home()
    {
        return Inertia::render('Public/Home', [
            'categories' => Category::active()->withCount(['services' => fn ($q) => $q->active()])->orderBy('name')->get()->map(fn ($c) => Present::category($c)),
            'featured' => Service::active()->where('featured', true)->with(['category', 'media'])->latest()->take(6)->get()->map(fn ($s) => Present::service($s)),
            'stats' => [
                'services' => Service::active()->count(),
                'technicians' => Technician::approved()->count(),
                'categories' => Category::active()->count(),
            ],
        ]);
    }

    public function services(Request $request)
    {
        $services = Service::active()->with(['category', 'media'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->string('q')->trim().'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('description', 'like', $term));
            })
            ->when($request->filled('categoria'), fn ($q) => $q->whereHas('category', fn ($c) => $c->where('slug', $request->string('categoria'))))
            ->orderBy($request->get('ordem') === 'preco' ? 'base_price' : 'name')
            ->paginate(9)->withQueryString()
            ->through(fn ($s) => Present::service($s));

        return Inertia::render('Public/Services', [
            'services' => $services,
            'categories' => Category::active()->orderBy('name')->get()->map(fn ($c) => Present::category($c)),
            'filters' => $request->only('q', 'categoria', 'ordem'),
        ]);
    }

    public function service(string $slug)
    {
        $service = Service::active()->with(['category', 'media'])->where('slug', $slug)->firstOrFail();
        $related = Service::active()->with(['category', 'media'])
            ->where('category_id', $service->category_id)->where('id', '!=', $service->id)->take(3)->get();

        return Inertia::render('Public/ServiceShow', [
            'service' => Present::service($service),
            'related' => $related->map(fn ($s) => Present::service($s)),
        ]);
    }

    public function technicians(Request $request)
    {
        $technicians = Technician::approved()->with(['user', 'categories'])
            ->when($request->filled('q'), fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', '%'.$request->string('q')->trim().'%')))
            ->when($request->filled('categoria'), fn ($q) => $q->whereHas('categories', fn ($c) => $c->where('slug', $request->string('categoria'))))
            ->when($request->get('ordem') === 'experiencia',
                fn ($q) => $q->orderByDesc('experience_years'),
                fn ($q) => $q->orderByDesc('rating_avg')->orderByDesc('reviews_count'))
            ->paginate(9)->withQueryString()
            ->through(fn ($t) => Present::technician($t));

        return Inertia::render('Public/Technicians', [
            'technicians' => $technicians,
            'categories' => Category::active()->orderBy('name')->get()->map(fn ($c) => Present::category($c)),
            'totals' => [
                'technicians' => Technician::approved()->count(),
                'categories' => Category::active()->count(),
            ],
            'filters' => $request->only('q', 'categoria', 'ordem'),
        ]);
    }

    /** Sugestões de pesquisa (JSON) — chamado com Axios pela barra de pesquisa. */
    public function suggest(Request $request)
    {
        $term = trim((string) $request->query('q', ''));
        if (mb_strlen($term) < 2) {
            return response()->json([]);
        }

        return response()->json(
            Service::active()->with('category')
                ->where('name', 'like', '%'.$term.'%')
                ->orderBy('name')->limit(6)->get()
                ->map(fn ($s) => ['name' => $s->name, 'slug' => $s->slug, 'category' => $s->category?->name])
        );
    }
}
