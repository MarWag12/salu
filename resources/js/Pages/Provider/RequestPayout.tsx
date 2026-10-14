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
    NumberInput,
    Select,
    Textarea,
    Paper,
    ThemeIcon,
    Alert,
    Divider,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconSend,
    IconWallet,
    IconAlertCircle,
    IconPercentage,
} from '@tabler/icons-react';

interface PayoutMethod {
    id: number;
    type: string;
    name: string;
    bank_name: string | null;
    account_number: string | null;
    phone_number: string | null;
    provider_name: string | null;
    is_default: boolean;
    display_name?: string;
}

interface Props {
    balance: {
        available: number;
        pending: number;
        currency: string;
    };
    payoutMethods: PayoutMethod[];
    minAmount: number;
}

export default function RequestPayout({ balance, payoutMethods, minAmount }: Props) {
    const defaultMethod = payoutMethods.find(m => m.is_default);

    const { data, setData, post, processing, errors } = useForm({
        amount: balance.available,
        payout_method_id: defaultMethod?.id.toString() || '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('provider.payouts.store'));
    };

    const fee = data.amount * 0.10;
    const netAmount = data.amount - fee;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 2,
        }).format(value) + ' ' + balance.currency;
    };

    const methodOptions = payoutMethods.map((method) => ({
        value: method.id.toString(),
        label: method.name + (method.is_default ? ' (Padrão)' : ''),
    }));

    const canSubmit = data.amount >= minAmount &&
                      data.amount <= balance.available &&
                      data.payout_method_id;

    return (
        <AuthenticatedLayout>
            <Head title="Solicitar Levantamento" />

            <Container size="md" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href={route('provider.wallet')}
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Voltar à Carteira
                        </Button>
                    </Group>

                    <div>
                        <Title order={2}>Solicitar Levantamento</Title>
                        <Text c="dimmed" size="sm">
                            Transfira os seus ganhos para a sua conta bancária ou carteira móvel
                        </Text>
                    </div>

                    <Paper p="md" withBorder radius="md" bg="green.0">
                        <Group>
                            <ThemeIcon size="xl" variant="light" color="green" radius="md">
                                <IconWallet size={28} />
                            </ThemeIcon>
                            <div>
                                <Text size="sm" c="dimmed">
                                    Saldo Disponível
                                </Text>
                                <Text size="xl" fw={700} c="green">
                                    {formatCurrency(balance.available)}
                                </Text>
                            </div>
                        </Group>
                    </Paper>

                    {payoutMethods.length === 0 ? (
                        <Alert icon={<IconAlertCircle size={16} />} color="red">
                            <Text size="sm">
                                Precisa adicionar um método de pagamento antes de solicitar um levantamento.
                            </Text>
                            <Button
                                component={Link}
                                href={route('provider.payout-methods.create')}
                                variant="light"
                                color="red"
                                size="xs"
                                mt="sm"
                            >
                                Adicionar Método
                            </Button>
                        </Alert>
                    ) : (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <form onSubmit={handleSubmit}>
                                <Stack gap="md">
                                    <NumberInput
                                        label="Valor a levantar"
                                        description={`Mínimo: ${formatCurrency(minAmount)} | Máximo: ${formatCurrency(balance.available)}`}
                                        value={data.amount}
                                        onChange={(value) => setData('amount', Number(value) || 0)}
                                        min={minAmount}
                                        max={balance.available}
                                        step={1000}
                                        suffix={` ${balance.currency}`}
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        error={errors.amount}
                                        required
                                    />

                                    <Select
                                        label="Método de pagamento"
                                        placeholder="Selecione o método"
                                        data={methodOptions}
                                        value={data.payout_method_id}
                                        onChange={(value) => setData('payout_method_id', value || '')}
                                        error={errors.payout_method_id}
                                        required
                                    />

                                    <Textarea
                                        label="Notas (opcional)"
                                        placeholder="Informações adicionais..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        error={errors.notes}
                                    />

                                    <Divider my="sm" />

                                    <Paper p="md" withBorder radius="md">
                                        <Stack gap="xs">
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">Valor solicitado</Text>
                                                <Text size="sm" fw={500}>{formatCurrency(data.amount)}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Group gap="xs">
                                                    <IconPercentage size={14} />
                                                    <Text size="sm" c="dimmed">Taxa da plataforma (10%)</Text>
                                                </Group>
                                                <Text size="sm" c="red">-{formatCurrency(fee)}</Text>
                                            </Group>
                                            <Divider my="xs" />
                                            <Group justify="space-between">
                                                <Text fw={500}>Valor a receber</Text>
                                                <Text size="lg" fw={700} c="green">{formatCurrency(netAmount)}</Text>
                                            </Group>
                                        </Stack>
                                    </Paper>

                                    <Alert icon={<IconAlertCircle size={16} />} color="blue">
                                        <Text size="sm">
                                            O levantamento será processado em até 3 dias úteis. Receberá uma notificação quando for concluído.
                                        </Text>
                                    </Alert>

                                    <Group justify="flex-end">
                                        <Button
                                            component={Link}
                                            href={route('provider.wallet')}
                                            variant="default"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            loading={processing}
                                            disabled={!canSubmit}
                                            leftSection={<IconSend size={16} />}
                                        >
                                            Solicitar Levantamento
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Card>
                    )}
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
