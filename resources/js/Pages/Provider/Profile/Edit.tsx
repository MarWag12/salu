import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Provider {
    id: number;
    company_name: string | null;
    trading_name: string | null;
    document_type: string;
    document_number: string;
    description: string | null;
    working_hours: Record<string, unknown> | null;
    is_verified: boolean;
}

interface UserData {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
}

interface KycData {
    status: string | null;
    status_label?: string;
    rejection_reason?: string | null;
    submitted_at?: string | null;
    reviewed_at?: string | null;
    can_submit: boolean;
}

interface Props {
    provider: Provider | null;
    user: UserData;
    kyc: KycData;
}

// Províncias de Angola
const PROVINCIAS_ANGOLA = [
    { value: 'Bengo', label: 'Bengo' },
    { value: 'Benguela', label: 'Benguela' },
    { value: 'Bié', label: 'Bié' },
    { value: 'Cabinda', label: 'Cabinda' },
    { value: 'Cuando Cubango', label: 'Cuando Cubango' },
    { value: 'Cuanza Norte', label: 'Cuanza Norte' },
    { value: 'Cuanza Sul', label: 'Cuanza Sul' },
    { value: 'Cunene', label: 'Cunene' },
    { value: 'Huambo', label: 'Huambo' },
    { value: 'Huíla', label: 'Huíla' },
    { value: 'Luanda', label: 'Luanda' },
    { value: 'Lunda Norte', label: 'Lunda Norte' },
    { value: 'Lunda Sul', label: 'Lunda Sul' },
    { value: 'Malanje', label: 'Malanje' },
    { value: 'Moxico', label: 'Moxico' },
    { value: 'Namibe', label: 'Namibe' },
    { value: 'Uíge', label: 'Uíge' },
    { value: 'Zaire', label: 'Zaire' },
];

// Tipos de documento angolanos
const DOCUMENT_TYPES = [
    { value: 'bi', label: 'Bilhete de Identidade (BI)' },
    { value: 'nif', label: 'Número de Identificação Fiscal (NIF)' },
    { value: 'passaporte', label: 'Passaporte' },
];

export default function Edit({ provider, user, kyc }: Props) {
    const [activeTab, setActiveTab] = useState<'profile' | 'kyc'>('profile');

    const profileForm = useForm({
        company_name: provider?.company_name ?? '',
        trading_name: provider?.trading_name ?? '',
        document_type: provider?.document_type ?? 'bi',
        document_number: provider?.document_number ?? '',
        description: provider?.description ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        city: user.city ?? '',
        state: user.state ?? '',
        postal_code: user.postal_code ?? '',
    });

    const kycForm = useForm<{
        identity_document: File | null;
        selfie: File | null;
    }>({
        identity_document: null,
        selfie: null,
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.patch(route('provider.profile.update'));
    };

    const submitKyc: FormEventHandler = (e) => {
        e.preventDefault();
        kycForm.post(route('provider.profile.kyc'), {
            forceFormData: true,
        });
    };

    const getKycStatusBadge = (status: string | null) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-800">Pendente</span>;
            case 'approved':
                return <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800">Aprovado</span>;
            case 'rejected':
                return <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-0.5 text-sm font-medium text-red-800">Reprovado</span>;
            case 'resubmit':
                return <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">Reenviar</span>;
            default:
                return <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">Não Iniciado</span>;
        }
    };

    const getDocumentPlaceholder = (type: string) => {
        switch (type) {
            case 'bi':
                return '000000000LA000';
            case 'nif':
                return '0000000000';
            case 'passaporte':
                return 'N00000000';
            default:
                return '';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Meu Perfil
                </h2>
            }
        >
            <Head title="Meu Perfil" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'profile'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Dados do Perfil
                            </button>
                            <button
                                onClick={() => setActiveTab('kyc')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'kyc'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Verificação KYC
                                {!kyc.status && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                        Pendente
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">
                                    Informações do Prestador
                                </h3>

                                <form onSubmit={submitProfile} className="space-y-6">
                                    {/* Company Info */}
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="company_name" value="Nome da Empresa / Nome Completo" />
                                            <TextInput
                                                id="company_name"
                                                value={profileForm.data.company_name}
                                                onChange={(e) => profileForm.setData('company_name', e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="Nome legal da empresa ou nome completo"
                                                disabled={provider?.is_verified}
                                            />
                                            <InputError message={profileForm.errors.company_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="trading_name" value="Nome Comercial (opcional)" />
                                            <TextInput
                                                id="trading_name"
                                                value={profileForm.data.trading_name}
                                                onChange={(e) => profileForm.setData('trading_name', e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="Nome comercial ou marca"
                                                disabled={provider?.is_verified}
                                            />
                                            <InputError message={profileForm.errors.trading_name} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Document */}
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="document_type" value="Tipo de Documento" />
                                            <select
                                                id="document_type"
                                                value={profileForm.data.document_type}
                                                onChange={(e) => profileForm.setData('document_type', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                disabled={provider?.is_verified}
                                            >
                                                {DOCUMENT_TYPES.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={profileForm.errors.document_type} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="document_number" value="Número do Documento" />
                                            <TextInput
                                                id="document_number"
                                                value={profileForm.data.document_number}
                                                onChange={(e) => profileForm.setData('document_number', e.target.value.toUpperCase())}
                                                className="mt-1 block w-full"
                                                placeholder={getDocumentPlaceholder(profileForm.data.document_type)}
                                                disabled={provider?.is_verified}
                                            />
                                            <InputError message={profileForm.errors.document_number} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <InputLabel htmlFor="description" value="Descrição" />
                                        <textarea
                                            id="description"
                                            value={profileForm.data.description}
                                            onChange={(e) => profileForm.setData('description', e.target.value)}
                                            rows={4}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="Descreva os seus serviços e experiência profissional..."
                                        />
                                        <InputError message={profileForm.errors.description} className="mt-2" />
                                    </div>

                                    <hr className="my-6" />

                                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">
                                        Dados de Contacto
                                    </h3>

                                    {/* Contact Info */}
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="phone" value="Telefone" />
                                            <TextInput
                                                id="phone"
                                                value={profileForm.data.phone}
                                                onChange={(e) => profileForm.setData('phone', e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="+244 923 456 789"
                                                required
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Formato: +244 seguido do número</p>
                                            <InputError message={profileForm.errors.phone} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="state" value="Província" />
                                            <select
                                                id="state"
                                                value={profileForm.data.state}
                                                onChange={(e) => profileForm.setData('state', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="">Seleccione a província</option>
                                                {PROVINCIAS_ANGOLA.map((provincia) => (
                                                    <option key={provincia.value} value={provincia.value}>
                                                        {provincia.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={profileForm.errors.state} className="mt-2" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="city" value="Município" />
                                            <TextInput
                                                id="city"
                                                value={profileForm.data.city}
                                                onChange={(e) => profileForm.setData('city', e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="Ex: Talatona, Viana, Cazenga..."
                                                required
                                            />
                                            <InputError message={profileForm.errors.city} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="postal_code" value="Código Postal (opcional)" />
                                            <TextInput
                                                id="postal_code"
                                                value={profileForm.data.postal_code}
                                                onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                                                className="mt-1 block w-full"
                                                placeholder="Se aplicável"
                                            />
                                            <InputError message={profileForm.errors.postal_code} className="mt-2" />
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="address" value="Morada" />
                                        <TextInput
                                            id="address"
                                            value={profileForm.data.address}
                                            onChange={(e) => profileForm.setData('address', e.target.value)}
                                            className="mt-1 block w-full"
                                            placeholder="Rua, número, bairro..."
                                            required
                                        />
                                        <InputError message={profileForm.errors.address} className="mt-2" />
                                    </div>

                                    {provider?.is_verified && (
                                        <p className="text-sm text-gray-500">
                                            Nota: Alguns campos não podem ser alterados após a verificação KYC.
                                        </p>
                                    )}

                                    <div className="flex justify-end">
                                        <PrimaryButton disabled={profileForm.processing}>
                                            Guardar Alterações
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* KYC Tab */}
                    {activeTab === 'kyc' && (
                        <div className="space-y-6">
                            {/* KYC Status Card */}
                            <div className="bg-white shadow sm:rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                                Estado da Verificação
                                            </h3>
                                            <div className="mt-2">
                                                {getKycStatusBadge(kyc.status)}
                                            </div>
                                        </div>
                                        {kyc.submitted_at && (
                                            <div className="text-right text-sm text-gray-500">
                                                <p>Submetido: {kyc.submitted_at}</p>
                                                {kyc.reviewed_at && <p>Analisado: {kyc.reviewed_at}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {kyc.rejection_reason && (
                                        <div className="mt-4 rounded-md bg-red-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-red-800">
                                                        Motivo da Rejeição
                                                    </h3>
                                                    <p className="mt-2 text-sm text-red-700">
                                                        {kyc.rejection_reason}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* KYC Form */}
                            {kyc.can_submit && (
                                <div className="bg-white shadow sm:rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">
                                            {kyc.status === 'resubmit' || kyc.status === 'rejected'
                                                ? 'Reenviar Documentos'
                                                : 'Submeter Documentos'}
                                        </h3>

                                        <div className="mb-6 rounded-md bg-blue-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3 text-sm text-blue-700">
                                                    <p>Para verificar a sua identidade, precisa submeter:</p>
                                                    <ul className="mt-2 list-disc pl-5">
                                                        <li>Bilhete de Identidade (frente e verso) ou Passaporte</li>
                                                        <li>Selfie segurando o documento ao lado do rosto</li>
                                                    </ul>
                                                    <p className="mt-2">Formatos aceites: JPG, PNG, PDF (máx. 5MB)</p>
                                                </div>
                                            </div>
                                        </div>

                                        <form onSubmit={submitKyc} className="space-y-6">
                                            <div>
                                                <InputLabel htmlFor="identity_document" value="Documento de Identificação (BI ou Passaporte)" />
                                                <input
                                                    id="identity_document"
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        kycForm.setData('identity_document', file);
                                                    }}
                                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                    required
                                                />
                                                <InputError message={kycForm.errors.identity_document} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="selfie" value="Selfie com Documento" />
                                                <input
                                                    id="selfie"
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        kycForm.setData('selfie', file);
                                                    }}
                                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                    required
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Tire uma selfie segurando o seu BI ou Passaporte ao lado do rosto
                                                </p>
                                                <InputError message={kycForm.errors.selfie} className="mt-2" />
                                            </div>

                                            <div className="flex justify-end">
                                                <PrimaryButton disabled={kycForm.processing}>
                                                    {kycForm.processing ? 'A enviar...' : 'Submeter para Verificação'}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {kyc.status === 'pending' && (
                                <div className="bg-white shadow sm:rounded-lg">
                                    <div className="px-4 py-5 sm:p-6 text-center">
                                        <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Verificação em Análise</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Os seus documentos estão a ser analisados. Receberá uma notificação quando a verificação for concluída.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {kyc.status === 'approved' && (
                                <div className="bg-white shadow sm:rounded-lg">
                                    <div className="px-4 py-5 sm:p-6 text-center">
                                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Conta Verificada</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            A sua identidade foi verificada. Pode publicar serviços na plataforma.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
