<?php

namespace App\Http\Controllers\Technician;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Payment;
use App\Models\ServiceRequest;
use App\Models\Technician;
use App\Support\Present;
use App\Support\Realtime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class JobController extends Controller
{
    protected function tech(Request $request): Technician
    {
        return $request->user()->technician ?? abort(403, 'Perfil de técnico não encontrado.');
    }

    protected function kycPayload(Technician $tech): array
    {
        return [
            'status' => $tech->kyc_status,
            'notes' => $tech->kyc_notes,
            'document_url' => $tech->kycDocumentUrl(),
            'approved' => $tech->isApproved(),
        ];
    }

    public function dashboard(Request $request)
    {
        $tech = $this->tech($request);
        $mine = ServiceRequest::where('technician_id', $tech->id);

        return Inertia::render('Technician/Dashboard', [
            'kyc' => $this->kycPayload($tech),
            'stats' => [
                'available' => $this->availableQuery($tech)->count(),
                'assigned' => (clone $mine)->where('status', ServiceRequest::ATRIBUIDO)->count(),
                'in_progress' => (clone $mine)->where('status', ServiceRequest::EM_CURSO)->count(),
                'done' => (clone $mine)->where('status', ServiceRequest::CONCLUIDO)->count(),
                'earnings' => (float) Payment::where('status', Payment::CONFIRMADO)
                    ->whereHas('serviceRequest', fn ($r) => $r->where('technician_id', $tech->id))->sum('amount'),
                'rating_avg' => (float) $tech->rating_avg,
                'reviews_count' => (int) $tech->reviews_count,
            ],
            'upcoming' => (clone $mine)->whereIn('status', [ServiceRequest::ATRIBUIDO, ServiceRequest::EM_CURSO])
                ->with(['service', 'client'])->orderBy('scheduled_at')->take(5)->get()->map(fn ($o) => Present::order($o)),
        ]);
    }

    protected function availableQuery(Technician $tech)
    {
        if (! $tech->isApproved() || ! $tech->available) {
            return ServiceRequest::whereRaw('1 = 0');
        }

        $catIds = $tech->categories()->pluck('categories.id');

        return ServiceRequest::where('status', ServiceRequest::PENDENTE)->whereNull('technician_id')
            ->whereHas('service', fn ($s) => $s->whereIn('category_id', $catIds));
    }

    public function index(Request $request)
    {
        $tech = $this->tech($request);

        return Inertia::render('Technician/Jobs/Index', [
            'kyc' => $this->kycPayload($tech),
            'available' => $this->availableQuery($tech)->with(['service', 'client'])->orderBy('scheduled_at')->get()->map(fn ($o) => Present::order($o)),
            'mine' => ServiceRequest::where('technician_id', $tech->id)->with(['service', 'client'])
                ->when($request->filled('estado'), fn ($q) => $q->where('status', $request->string('estado')))
                ->latest('scheduled_at')->paginate(10)->withQueryString()
                ->through(fn ($o) => Present::order($o)),
            'statuses' => Present::statuses(['atribuido', 'em_curso', 'concluido', 'cancelado']),
            'filters' => $request->only('estado'),
        ]);
    }

    public function show(Request $request, ServiceRequest $order)
    {
        $tech = $this->tech($request);
        abort_unless($order->technician_id === $tech->id, 403);
        $order->load(['service.category', 'client', 'payments', 'review']);

        return Inertia::render('Technician/Jobs/Show', ['order' => Present::order($order, full: true)]);
    }

    public function accept(Request $request, ServiceRequest $order)
    {
        $tech = $this->tech($request);
        abort_unless($tech->isApproved(), 403, 'A sua conta ainda não foi aprovada (KYC).');

        $ok = DB::transaction(function () use ($tech, $order) {
            $affected = ServiceRequest::where('id', $order->id)
                ->where('status', ServiceRequest::PENDENTE)->whereNull('technician_id')
                ->update(['technician_id' => $tech->id, 'status' => ServiceRequest::ATRIBUIDO]);

            return $affected === 1;
        });

        if (! $ok) {
            return back()->with('error', 'Este pedido já foi atribuído a outro técnico.');
        }

        AuditLog::record('pedido_aceite', "Pedido {$order->code} aceite pelo técnico");
        Realtime::order($order->refresh(), 'Técnico atribuído', "{$request->user()->name} aceitou o seu pedido {$order->code}.", [$order->client_id]);

        return redirect()->route('tecnico.trabalhos.show', $order)->with('success', 'Pedido aceite. Boa execução!');
    }

    public function start(Request $request, ServiceRequest $order)
    {
        abort_unless($order->technician_id === $this->tech($request)->id, 403);

        if ($order->status !== ServiceRequest::ATRIBUIDO) {
            return back()->with('error', 'Este trabalho não pode ser iniciado.');
        }

        $order->update(['status' => ServiceRequest::EM_CURSO]);
        AuditLog::record('trabalho_iniciado', "Pedido {$order->code} iniciado");
        Realtime::order($order, 'Trabalho iniciado', "O técnico iniciou o pedido {$order->code}.", [$order->client_id]);

        return back()->with('success', 'Trabalho iniciado.');
    }

    public function complete(Request $request, ServiceRequest $order)
    {
        abort_unless($order->technician_id === $this->tech($request)->id, 403);

        if ($order->status !== ServiceRequest::EM_CURSO) {
            return back()->with('error', 'Este trabalho não está em curso.');
        }

        $data = $request->validate(['price' => ['nullable', 'numeric', 'min:0', 'max:99999999']]);

        $order->update([
            'status' => ServiceRequest::CONCLUIDO,
            'completed_at' => now(),
            'price' => $data['price'] ?? $order->price,
        ]);
        AuditLog::record('trabalho_concluido', "Pedido {$order->code} concluído");
        Realtime::order($order, 'Trabalho concluído', "O pedido {$order->code} foi concluído. Já pode efectuar o pagamento.", [$order->client_id]);

        return back()->with('success', 'Trabalho concluído. O cliente já pode efectuar o pagamento.');
    }

    public function profile(Request $request)
    {
        $tech = $this->tech($request)->load('categories');

        return Inertia::render('Technician/Profile', [
            'kyc' => $this->kycPayload($tech),
            'profile' => [
                'phone' => $request->user()->phone,
                'municipality' => $tech->municipality,
                'experience_years' => (int) $tech->experience_years,
                'bio' => $tech->bio,
                'available' => (bool) $tech->available,
                'categories' => $tech->categories->pluck('id')->all(),
            ],
            'categories' => Category::active()->orderBy('name')->get()->map(fn ($c) => Present::category($c)),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $tech = $this->tech($request);

        $data = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'bio' => ['nullable', 'string', 'max:1500'],
            'municipality' => ['required', 'string', 'max:120'],
            'experience_years' => ['required', 'integer', 'min:0', 'max:60'],
            'available' => ['nullable', 'boolean'],
            'categories' => ['required', 'array', 'min:1'],
            'categories.*' => ['exists:categories,id'],
            'kyc_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:4096'],
        ]);

        $request->user()->update(['phone' => $data['phone']]);

        $fields = [
            'bio' => $data['bio'] ?? null,
            'municipality' => $data['municipality'],
            'experience_years' => $data['experience_years'],
            'available' => $request->boolean('available'),
        ];

        if ($request->hasFile('kyc_document')) {
            // Spatie Media Library: substitui o documento anterior (colecção singleFile, disco privado).
            $tech->addMediaFromRequest('kyc_document')->toMediaCollection('kyc_document');
            // Um novo documento volta para a fila de verificação.
            if ($tech->kyc_status === Technician::KYC_REJEITADO) {
                $fields['kyc_status'] = Technician::KYC_PENDENTE;
                $fields['kyc_notes'] = null;
            }
        }

        $tech->update($fields);
        $tech->categories()->sync($data['categories']);
        AuditLog::record('perfil_actualizado', 'Perfil de técnico actualizado');

        return back()->with('success', 'Perfil actualizado.');
    }
}
