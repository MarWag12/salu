import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Container,
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    Paper,
    ThemeIcon,
    Divider,
    Timeline,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconClock,
    IconCheck,
    IconX,
    IconArrowUpRight,
    IconWallet,
    IconBuildingBank,
    IconSend,
} from '@tabler/icons-react';

interface PayoutMethod {
    id: number;
    type: string;
    name: string;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
    phone_number: string | null;
    provider_name: string | null;
}

interface Payout {
    id: number;
    amount: number;
    fee: number;
    net_amount: number;
    currency: string;
    status: string;
    reference: string;
    notes: string | null;
    failure_reason: string | null;
    created_at: string;
    processed_at: string | null;
    completed_at: string | null;
    payout_method: PayoutMethod | null;
}

interface Props {
    payout: Payout;
    statuses: Record<string, string>;
}

export default function PayoutDetail({ payout, statuses }: Props) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'yellow';
            case 'processing':
                return 'blue';
            case 'completed':
                return 'green';
            case 'failed':
                return 'red';
            case 'cancelled':
                return 'gray';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <IconClock size={14} />;
            case 'processing':
                return <IconArrowUpRight size={14} />;
            case 'completed':
                return <IconCheck size={14} />;
            case 'failed':
            case 'cancelled':
                return <IconX size={14} />;
            default:
                return null;
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 2,
        }).format(value) + ' ' + payout.currency;
    };

    const getTimelineActive = () => {
        switch (payout.status) {
            case 'pending':
                return 0;
            case 'processing':
                return 1;
            case 'completed':
                return 2;
            case 'failed':
            case 'cancelled':
                return 1;
            default:
                return 0;
        }
    };

    const isPending = payout.status === 'pending';

    return (
        <AuthenticatedLayout>
            <Head title={`Levantamento ${payout.reference}`} />

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

                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Title order={2}>Levantamento</Title>
                            <Text c="dimmed" size="sm">
                                {payout.reference}
                            </Text>
                        </div>
                        <Badge
                            color={getStatusColor(payout.status)}
                            leftSection={getStatusIcon(payout.status)}
                            size="lg"
                        >
                            {statuses[payout.status]}
                        </Badge>
                    </Group>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Group>
                                    <ThemeIcon size="xl" variant="light" color="green" radius="md">
                                        <IconWallet size={28} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="sm" c="dimmed">Valor Líquido</Text>
                                        <Text size="xl" fw={700} c="green">
                                            {formatCurrency(payout.net_amount)}
                                        </Text>
                                    </div>
                                </Group>
                            </Group>

                            <Divider />

                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Valor solicitado</Text>
                                    <Text size="sm" fw={500}>{formatCurrency(payout.amount)}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Taxa da plataforma (10%)</Text>
                                    <Text size="sm" c="red">-{formatCurrency(payout.fee)}</Text>
                                </Group>
                                <Divider variant="dashed" />
                                <Group justify="space-between">
                                    <Text fw={500}>Valor a receber</Text>
                                    <Text fw={700} c="green">{formatCurrency(payout.net_amount)}</Text>
                                </Group>
                            </Stack>
                        </Stack>
                    </Card>

                    {payout.payout_method && (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group>
                                <ThemeIcon size="lg" variant="light" color="violet" radius="md">
                                    <IconBuildingBank size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" c="dimmed">Método de Pagamento</Text>
                                    <Text fw={500}>{payout.payout_method.name}</Text>
                                    {payout.payout_method.bank_name && (
                                        <Text size="sm" c="dimmed">
                                            {payout.payout_method.bank_name} - ****{payout.payout_method.account_number?.slice(-4)}
                                        </Text>
                                    )}
                                    {payout.payout_method.provider_name && (
                                        <Text size="sm" c="dimmed">
                                            {payout.payout_method.provider_name} - ****{payout.payout_method.phone_number?.slice(-4)}
                                        </Text>
                                    )}
                                </div>
                            </Group>
                        </Card>
                    )}

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Estado do Levantamento</Title>

                        <Timeline active={getTimelineActive()} bulletSize={24} lineWidth={2}>
                            <Timeline.Item
                                bullet={<IconSend size={12} />}
                                title="Pedido criado"
                            >
                                <Text c="dimmed" size="sm">
                                    {new Date(payout.created_at).toLocaleString('pt-AO')}
                                </Text>
                            </Timeline.Item>

                            <Timeline.Item
                                bullet={<IconArrowUpRight size={12} />}
                                title="Em processamento"
                                color={payout.status === 'processing' ? 'blue' : undefined}
                            >
                                {payout.processed_at ? (
                                    <Text c="dimmed" size="sm">
                                        {new Date(payout.processed_at).toLocaleString('pt-AO')}
                                    </Text>
                                ) : (
                                    <Text c="dimmed" size="sm">
                                        Aguardando processamento
                                    </Text>
                                )}
                            </Timeline.Item>

                            <Timeline.Item
                                bullet={payout.status === 'completed' ? <IconCheck size={12} /> : <IconClock size={12} />}
                                title={payout.status === 'failed' ? 'Falhou' : 'Concluído'}
                                color={payout.status === 'completed' ? 'green' : (payout.status === 'failed' ? 'red' : undefined)}
                            >
                                {payout.completed_at ? (
                                    <Text c="dimmed" size="sm">
                                        {new Date(payout.completed_at).toLocaleString('pt-AO')}
                                    </Text>
                                ) : payout.status === 'failed' ? (
                                    <Paper p="sm" mt="sm" withBorder bg="red.0">
                                        <Text size="sm" c="red">
                                            {payout.failure_reason || 'Ocorreu um erro no processamento'}
                                        </Text>
                                    </Paper>
                                ) : (
                                    <Text c="dimmed" size="sm">
                                        Aguardando conclusão
                                    </Text>
                                )}
                            </Timeline.Item>
                        </Timeline>
                    </Card>

                    {payout.notes && (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Title order={4} mb="sm">Notas</Title>
                            <Text size="sm">{payout.notes}</Text>
                        </Card>
                    )}

                    {isPending && (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between">
                                <div>
                                    <Text fw={500}>Cancelar Levantamento</Text>
                                    <Text size="sm" c="dimmed">
                                        Pode cancelar enquanto o pedido está pendente
                                    </Text>
                                </div>
                                <Button
                                    variant="outline"
                                    color="red"
                                    leftSection={<IconX size={16} />}
                                    onClick={() => {
                                        if (confirm('Cancelar este levantamento?')) {
                                            router.post(route('provider.payouts.cancel', payout.id));
                                        }
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </Group>
                        </Card>
                    )}
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
