<?php

namespace App\Http\Controllers;

use App\Models\Payout;
use App\Models\PayoutMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayoutMethodController extends Controller
{
    /**
     * Display a listing of payout methods.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            abort(403, 'Você precisa ser um prestador de serviços.');
        }

        $payoutMethods = $provider->payoutMethods()->get();

        return Inertia::render('Provider/PayoutMethods', [
            'payoutMethods' => $payoutMethods,
            'types' => PayoutMethod::getTypes(),
            'banks' => PayoutMethod::getBanks(),
            'mobileProviders' => PayoutMethod::getMobileMoneyProviders(),
        ]);
    }

    /**
     * Show the form for creating a new payout method.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Provider/PayoutMethodForm', [
            'types' => PayoutMethod::getTypes(),
            'banks' => PayoutMethod::getBanks(),
            'mobileProviders' => PayoutMethod::getMobileMoneyProviders(),
        ]);
    }

    /**
     * Store a newly created payout method.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            abort(403, 'Você precisa ser um prestador de serviços.');
        }

        $validated = $request->validate([
            'type' => 'required|in:' . implode(',', array_keys(PayoutMethod::getTypes())),
            'name' => 'required|string|max:100',
            'bank_name' => 'required_if:type,bank_transfer|nullable|string|max:100',
            'account_number' => 'required_if:type,bank_transfer|nullable|string|max:50',
            'account_holder' => 'required_if:type,bank_transfer|nullable|string|max:100',
            'iban' => 'nullable|string|max:34',
            'phone_number' => 'required_if:type,mobile_money|nullable|string|max:20',
            'provider_name' => 'required_if:type,mobile_money|nullable|string|max:50',
            'is_default' => 'boolean',
        ]);

        // If this is the first method or marked as default, update others
        $isFirst = $provider->payoutMethods()->count() === 0;
        $isDefault = $validated['is_default'] ?? false || $isFirst;

        if ($isDefault) {
            $provider->payoutMethods()->update(['is_default' => false]);
        }

        PayoutMethod::create([
            'provider_id' => $provider->id,
            'type' => $validated['type'],
            'name' => $validated['name'],
            'bank_name' => $validated['bank_name'] ?? null,
            'account_number' => $validated['account_number'] ?? null,
            'account_holder' => $validated['account_holder'] ?? null,
            'iban' => $validated['iban'] ?? null,
            'phone_number' => $validated['phone_number'] ?? null,
            'provider_name' => $validated['provider_name'] ?? null,
            'is_default' => $isDefault,
        ]);

        return redirect()->route('provider.payout-methods.index')
            ->with('success', 'Método de pagamento adicionado com sucesso.');
    }

    /**
     * Show the form for editing the specified payout method.
     */
    public function edit(Request $request, PayoutMethod $payoutMethod): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider || $payoutMethod->provider_id !== $provider->id) {
            abort(403, 'Você não tem permissão para editar este método de pagamento.');
        }

        return Inertia::render('Provider/PayoutMethodForm', [
            'payoutMethod' => $payoutMethod,
            'types' => PayoutMethod::getTypes(),
            'banks' => PayoutMethod::getBanks(),
            'mobileProviders' => PayoutMethod::getMobileMoneyProviders(),
        ]);
    }

    /**
     * Update the specified payout method.
     */
    public function update(Request $request, PayoutMethod $payoutMethod): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider || $payoutMethod->provider_id !== $provider->id) {
            abort(403, 'Você não tem permissão para editar este método de pagamento.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'bank_name' => 'required_if:type,bank_transfer|nullable|string|max:100',
            'account_number' => 'required_if:type,bank_transfer|nullable|string|max:50',
            'account_holder' => 'required_if:type,bank_transfer|nullable|string|max:100',
            'iban' => 'nullable|string|max:34',
            'phone_number' => 'required_if:type,mobile_money|nullable|string|max:20',
            'provider_name' => 'required_if:type,mobile_money|nullable|string|max:50',
            'is_default' => 'boolean',
        ]);

        $isDefault = $validated['is_default'] ?? false;

        if ($isDefault && !$payoutMethod->is_default) {
            $provider->payoutMethods()->where('id', '!=', $payoutMethod->id)->update(['is_default' => false]);
        }

        $payoutMethod->update([
            'name' => $validated['name'],
            'bank_name' => $validated['bank_name'] ?? $payoutMethod->bank_name,
            'account_number' => $validated['account_number'] ?? $payoutMethod->account_number,
            'account_holder' => $validated['account_holder'] ?? $payoutMethod->account_holder,
            'iban' => $validated['iban'] ?? $payoutMethod->iban,
            'phone_number' => $validated['phone_number'] ?? $payoutMethod->phone_number,
            'provider_name' => $validated['provider_name'] ?? $payoutMethod->provider_name,
            'is_default' => $isDefault,
        ]);

        return redirect()->route('provider.payout-methods.index')
            ->with('success', 'Método de pagamento atualizado com sucesso.');
    }

    /**
     * Remove the specified payout method.
     */
    public function destroy(Request $request, PayoutMethod $payoutMethod): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider || $payoutMethod->provider_id !== $provider->id) {
            abort(403, 'Você não tem permissão para remover este método de pagamento.');
        }

        // Check if it has pending payouts
        if ($payoutMethod->payouts()->whereIn('status', [Payout::STATUS_PENDING, Payout::STATUS_PROCESSING])->exists()) {
            return back()->withErrors(['payout_method' => 'Este método tem levantamentos pendentes e não pode ser removido.']);
        }

        $wasDefault = $payoutMethod->is_default;
        $payoutMethod->delete();

        // If deleted was default, make the first one default
        if ($wasDefault) {
            $provider->payoutMethods()->first()?->update(['is_default' => true]);
        }

        return redirect()->route('provider.payout-methods.index')
            ->with('success', 'Método de pagamento removido com sucesso.');
    }

    /**
     * Set a payout method as default.
     */
    public function setDefault(Request $request, PayoutMethod $payoutMethod): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider || $payoutMethod->provider_id !== $provider->id) {
            abort(403, 'Você não tem permissão para alterar este método de pagamento.');
        }

        $provider->payoutMethods()->update(['is_default' => false]);
        $payoutMethod->update(['is_default' => true]);

        return back()->with('success', 'Método de pagamento definido como padrão.');
    }
}
