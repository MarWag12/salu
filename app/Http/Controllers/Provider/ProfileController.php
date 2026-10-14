<?php

namespace App\Http\Controllers\Provider;

use App\Enums\KycStatus;
use App\Http\Controllers\Controller;
use App\Services\KycService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected KycService $kycService
    ) {}

    /**
     * Display the provider profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;
        $kycVerification = $provider?->latestKycVerification;

        return Inertia::render('Provider/Profile/Edit', [
            'provider' => $provider ? [
                'id' => $provider->id,
                'company_name' => $provider->company_name,
                'trading_name' => $provider->trading_name,
                'document_type' => $provider->document_type,
                'document_number' => $provider->document_number,
                'description' => $provider->description,
                'working_hours' => $provider->working_hours,
                'is_verified' => $provider->is_verified,
            ] : null,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'city' => $user->city,
                'state' => $user->state,
                'postal_code' => $user->postal_code,
            ],
            'kyc' => $kycVerification ? [
                'status' => $kycVerification->status->value,
                'status_label' => $kycVerification->status->label(),
                'rejection_reason' => $kycVerification->rejection_reason,
                'submitted_at' => $kycVerification->submitted_at?->format('d/m/Y H:i'),
                'reviewed_at' => $kycVerification->reviewed_at?->format('d/m/Y H:i'),
                'can_submit' => in_array($kycVerification->status, [KycStatus::REJECTED, KycStatus::RESUBMIT]),
            ] : [
                'status' => null,
                'can_submit' => true,
            ],
        ]);
    }

    /**
     * Update the provider profile.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        $validated = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'trading_name' => ['nullable', 'string', 'max:255'],
            'document_type' => ['required', 'in:cpf,cnpj'],
            'document_number' => ['required', 'string', 'max:18'],
            'description' => ['nullable', 'string', 'max:1000'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:2'],
            'postal_code' => ['required', 'string', 'max:10'],
        ]);

        // Update user contact info
        $user->update([
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'state' => $validated['state'],
            'postal_code' => $validated['postal_code'],
        ]);

        // Update or create provider profile
        if ($provider) {
            // Only update non-KYC fields if already verified
            $providerData = $provider->is_verified
                ? ['description' => $validated['description']]
                : [
                    'company_name' => $validated['company_name'],
                    'trading_name' => $validated['trading_name'],
                    'document_type' => $validated['document_type'],
                    'document_number' => preg_replace('/\D/', '', $validated['document_number']),
                    'description' => $validated['description'],
                ];

            $provider->update($providerData);
        } else {
            $user->serviceProvider()->create([
                'company_name' => $validated['company_name'],
                'trading_name' => $validated['trading_name'],
                'document_type' => $validated['document_type'],
                'document_number' => preg_replace('/\D/', '', $validated['document_number']),
                'description' => $validated['description'],
            ]);
        }

        return back()->with('success', 'Perfil actualizado com sucesso.');
    }

    /**
     * Submit KYC verification documents.
     */
    public function submitKyc(Request $request): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            return back()->withErrors(['provider' => 'Complete o seu perfil antes de submeter a verificação.']);
        }

        $latestKyc = $provider->latestKycVerification;

        // Check if can submit
        if ($latestKyc && !in_array($latestKyc->status, [KycStatus::REJECTED, KycStatus::RESUBMIT])) {
            if ($latestKyc->status === KycStatus::PENDING) {
                return back()->withErrors(['kyc' => 'Já existe uma verificação pendente.']);
            }
            if ($latestKyc->status === KycStatus::APPROVED) {
                return back()->withErrors(['kyc' => 'A sua conta já está verificada.']);
            }
        }

        $validated = $request->validate([
            'identity_document' => [
                'required',
                File::types(['jpg', 'jpeg', 'png', 'pdf'])
                    ->max(5 * 1024), // 5MB
            ],
            'selfie' => [
                'required',
                File::types(['jpg', 'jpeg', 'png'])
                    ->max(5 * 1024), // 5MB
            ],
        ], [
            'identity_document.required' => 'O documento de identificação é obrigatório.',
            'identity_document.max' => 'O documento não pode exceder 5MB.',
            'identity_document.mimetypes' => 'O documento deve ser JPG, PNG ou PDF.',
            'selfie.required' => 'A selfie é obrigatória.',
            'selfie.max' => 'A selfie não pode exceder 5MB.',
            'selfie.mimetypes' => 'A selfie deve ser JPG ou PNG.',
        ]);

        try {
            $this->kycService->submit(
                $provider,
                $request->file('identity_document'),
                $request->file('selfie')
            );

            return back()->with('success', 'Documentos submetidos com sucesso. A verificação está em análise.');
        } catch (\Exception $e) {
            return back()->withErrors(['kyc' => 'Erro ao submeter documentos. Tente novamente.']);
        }
    }
}
