<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dispute;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Support\Present;
use App\Support\Realtime;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RequestController extends Controller
{
    public function dashboard(Request $request)
    {
        $q = ServiceRequest::where('client_id', $request->user()->id);

        return Inertia::render('Client/Dashboard', [
            'stats' => [
                'total' => (clone $q)->count(),
                'open' => (clone $q)->whereIn('status', [ServiceRequest::PENDENTE, ServiceRequest::ATRIBUIDO, ServiceRequest::EM_CURSO])->count(),
                'done' => (clone $q)->where('status', ServiceRequest::CONCLUIDO)->count(),
                'to_pay' => (clone $q)->where('status', ServiceRequest::CONCLUIDO)->whereDoesntHave('payments', fn ($p) => $p->where('status', Payment::CONFIRMADO))->count(),
            ],
            'recent' => (clone $q)->with(['service', 'technician.user'])->latest()->take(5)->get()->map(fn ($o) => Present::order($o)),
        ]);
    }

    public function index(Request $request)
    {
        $requests = ServiceRequest::where('client_id', $request->user()->id)
            ->with(['service', 'technician.user'])
            ->when($request->filled('estado'), fn ($q) => $q->where('status', $request->string('estado')))
            ->latest()->paginate(10)->withQueryString()
            ->through(fn ($o) => Present::order($o));

        return Inertia::render('Client/Requests/Index', [
            'requests' => $requests,
            'statuses' => Present::statuses(),
            'filters' => $request->only('estado'),
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('Client/Requests/Create', [
            'services' => Service::active()->with('category')->orderBy('name')->get()->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'base_price' => (float) $s->base_price,
                'category' => $s->category?->name,
            ]),
            'selected' => $request->query('servico') ? (int) $request->query('servico') : null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'address' => ['required', 'string', 'max:255'],
            'municipality' => ['required', 'string', 'max:120'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $service = Service::active()->findOrFail($data['service_id']);

        $order = ServiceRequest::create($data + [
            'code' => ServiceRequest::generateCode(),
            'client_id' => $request->user()->id,
            'price' => $service->base_price,
            'status' => ServiceRequest::PENDENTE,
        ]);

        AuditLog::record('pedido_criado', "Pedido {$order->code} ({$service->name})");
        Realtime::order($order, 'Novo pedido disponível', "{$service->name} em {$order->municipality}", [], technicians: true);

        return redirect()->route('cliente.pedidos.show', $order)->with('success', 'Pedido enviado! Em breve será atribuído um técnico.');
    }

    public function show(Request $request, ServiceRequest $order)
    {
        $this->authorizeOwner($request, $order);
        $order->load(['service.category', 'technician.user', 'payments', 'review', 'disputes']);

        $concluded = $order->status === ServiceRequest::CONCLUIDO;

        return Inertia::render('Client/Requests/Show', [
            'order' => Present::order($order, full: true),
            'abilities' => [
                'cancel' => $order->canBeCancelled(),
                'pay' => $concluded && $order->payments->isEmpty(),
                'review' => $concluded && $order->technician_id && ! $order->review,
                'dispute' => $order->status !== ServiceRequest::CANCELADO,
            ],
            'methods' => Present::paymentMethods(),
        ]);
    }

    public function cancel(Request $request, ServiceRequest $order)
    {
        $this->authorizeOwner($request, $order);

        if (! $order->canBeCancelled()) {
            return back()->with('error', 'Este pedido já não pode ser cancelado.');
        }

        $data = $request->validate(['cancel_reason' => ['nullable', 'string', 'max:255']]);
        $order->update(['status' => ServiceRequest::CANCELADO, 'cancel_reason' => $data['cancel_reason'] ?? null]);
        AuditLog::record('pedido_cancelado', "Pedido {$order->code} cancelado pelo cliente");
        Realtime::order($order, 'Pedido cancelado', "O cliente cancelou o pedido {$order->code}.", Realtime::parties($order));

        return back()->with('success', 'Pedido cancelado.');
    }

    public function pay(Request $request, ServiceRequest $order)
    {
        $this->authorizeOwner($request, $order);

        if ($order->status !== ServiceRequest::CONCLUIDO) {
            return back()->with('error', 'Só pode pagar pedidos concluídos.');
        }
        if ($order->payments()->exists()) {
            return back()->with('error', 'Já existe um pagamento registado para este pedido.');
        }

        $data = $request->validate([
            'method' => ['required', 'in:'.implode(',', array_keys(Payment::METHODS))],
            'reference' => ['nullable', 'string', 'max:120'],
        ]);

        Payment::create($data + ['service_request_id' => $order->id, 'amount' => $order->price, 'status' => Payment::PENDENTE]);
        AuditLog::record('pagamento_registado', "Pagamento do pedido {$order->code} registado (aguarda confirmação)");

        return back()->with('success', 'Pagamento registado. Aguarda confirmação da CAFPMIF.');
    }

    public function review(Request $request, ServiceRequest $order)
    {
        $this->authorizeOwner($request, $order);

        if ($order->status !== ServiceRequest::CONCLUIDO || ! $order->technician_id) {
            return back()->with('error', 'Só pode avaliar pedidos concluídos.');
        }
        if ($order->review()->exists()) {
            return back()->with('error', 'Este pedido já foi avaliado.');
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        Review::create($data + [
            'service_request_id' => $order->id,
            'client_id' => $request->user()->id,
            'technician_id' => $order->technician_id,
        ]);
        $order->technician->recalcRating();
        AuditLog::record('avaliacao', "Avaliação {$data['rating']}/5 no pedido {$order->code}");

        return back()->with('success', 'Obrigado pela sua avaliação!');
    }

    public function dispute(Request $request, ServiceRequest $order)
    {
        $this->authorizeOwner($request, $order);

        if ($order->status === ServiceRequest::CANCELADO) {
            return back()->with('error', 'Não pode abrir disputa num pedido cancelado.');
        }

        $data = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:2000']]);
        Dispute::create($data + ['service_request_id' => $order->id, 'user_id' => $request->user()->id]);
        AuditLog::record('disputa_aberta', "Disputa aberta no pedido {$order->code}");

        return back()->with('success', 'Disputa registada. A nossa equipa irá analisá-la.');
    }

    protected function authorizeOwner(Request $request, ServiceRequest $order): void
    {
        abort_unless($order->client_id === $request->user()->id, 403);
    }
}
