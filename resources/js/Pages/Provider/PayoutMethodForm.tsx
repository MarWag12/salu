import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    Container,
    Card,
    Title,
    Text,
    Group,
    Stack,
    Button,
    TextInput,
    Select,
    Switch,
    Divider,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconDeviceFloppy,
} from '@tabler/icons-react';

interface PayoutMethod {
    id: number;
    type: string;
    name: string;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
    iban: string | null;
    phone_number: string | null;
    provider_name: string | null;
    is_default: boolean;
}

interface Props {
    payoutMethod?: PayoutMethod;
    types: Record<string, string>;
    banks: Record<string, string>;
    mobileProviders: Record<string, string>;
}

export default function PayoutMethodForm({ payoutMethod, types, banks, mobileProviders }: Props) {
    const isEdit = !!payoutMethod;

    const { data, setData, post, patch, processing, errors } = useForm({
        type: payoutMethod?.type || 'bank_transfer',
        name: payoutMethod?.name || '',
        bank_name: payoutMethod?.bank_name || '',
        account_number: payoutMethod?.account_number || '',
        account_holder: payoutMethod?.account_holder || '',
        iban: payoutMethod?.iban || '',
        phone_number: payoutMethod?.phone_number || '',
        provider_name: payoutMethod?.provider_name || '',
        is_default: payoutMethod?.is_default || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            patch(route('provider.payout-methods.update', payoutMethod.id));
        } else {
            post(route('provider.payout-methods.store'));
        }
    };

    const typeOptions = Object.entries(types).map(([value, label]) => ({
        value,
        label,
    }));

    const bankOptions = Object.entries(banks).map(([value, label]) => ({
        value,
        label,
    }));

    const mobileProviderOptions = Object.entries(mobileProviders).map(([value, label]) => ({
        value,
        label,
    }));

    const isBankTransfer = data.type === 'bank_transfer';
    const isMobileMoney = data.type === 'mobile_money';

    return (
        <AuthenticatedLayout>
            <Head title={isEdit ? 'Editar Método de Pagamento' : 'Adicionar Método de Pagamento'} />

            <Container size="md" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href={route('provider.payout-methods.index')}
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Voltar
                        </Button>
                    </Group>

                    <div>
                        <Title order={2}>
                            {isEdit ? 'Editar Método de Pagamento' : 'Adicionar Método de Pagamento'}
                        </Title>
                        <Text c="dimmed" size="sm">
                            Configure como deseja receber os seus ganhos
                        </Text>
                    </div>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <form onSubmit={handleSubmit}>
                            <Stack gap="md">
                                <TextInput
                                    label="Nome do método"
                                    placeholder="Ex: Minha conta BAI Principal"
                                    description="Um nome para identificar este método"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    error={errors.name}
                                    required
                                />

                                {!isEdit && (
                                    <Select
                                        label="Tipo de pagamento"
                                        placeholder="Selecione o tipo"
                                        data={typeOptions}
                                        value={data.type}
                                        onChange={(value) => setData('type', value || 'bank_transfer')}
                                        error={errors.type}
                                        required
                                    />
                                )}

                                {isBankTransfer && (
                                    <>
                                        <Divider label="Dados bancários" labelPosition="center" my="sm" />

                                        <Select
                                            label="Banco"
                                            placeholder="Selecione o banco"
                                            data={bankOptions}
                                            value={data.bank_name}
                                            onChange={(value) => setData('bank_name', value || '')}
                                            error={errors.bank_name}
                                            searchable
                                            required
                                        />

                                        <TextInput
                                            label="Número da conta"
                                            placeholder="Ex: 123456789"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            error={errors.account_number}
                                            required
                                        />

                                        <TextInput
                                            label="Titular da conta"
                                            placeholder="Nome completo do titular"
                                            value={data.account_holder}
                                            onChange={(e) => setData('account_holder', e.target.value)}
                                            error={errors.account_holder}
                                            required
                                        />

                                        <TextInput
                                            label="IBAN (opcional)"
                                            placeholder="Ex: AO06..."
                                            value={data.iban}
                                            onChange={(e) => setData('iban', e.target.value)}
                                            error={errors.iban}
                                        />
                                    </>
                                )}

                                {isMobileMoney && (
                                    <>
                                        <Divider label="Dados da carteira móvel" labelPosition="center" my="sm" />

                                        <Select
                                            label="Operadora"
                                            placeholder="Selecione a operadora"
                                            data={mobileProviderOptions}
                                            value={data.provider_name}
                                            onChange={(value) => setData('provider_name', value || '')}
                                            error={errors.provider_name}
                                            required
                                        />

                                        <TextInput
                                            label="Número de telefone"
                                            placeholder="Ex: 923 456 789"
                                            value={data.phone_number}
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                            error={errors.phone_number}
                                            required
                                        />
                                    </>
                                )}

                                <Divider my="sm" />

                                <Switch
                                    label="Definir como método padrão"
                                    description="Este método será usado automaticamente nos levantamentos"
                                    checked={data.is_default}
                                    onChange={(e) => setData('is_default', e.currentTarget.checked)}
                                />

                                <Group justify="flex-end" mt="md">
                                    <Button
                                        component={Link}
                                        href={route('provider.payout-methods.index')}
                                        variant="default"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={processing}
                                        leftSection={<IconDeviceFloppy size={16} />}
                                    >
                                        {isEdit ? 'Guardar Alterações' : 'Adicionar Método'}
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Card>
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
