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
    Table,
    Pagination,
    Paper,
    ThemeIcon,
    SimpleGrid,
    Alert,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import {
    IconWallet,
    IconClock,
    IconPlus,
    IconCreditCard,
    IconEye,
    IconX,
    IconCheck,
    IconAlertCircle,
    IconArrowUpRight,
    IconBuildingBank,
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
    is_verified: boolean;
}

interface Payout {
    id: number;
    amount: number;
    fee: number;
    net_amount: number;
    currency: string;
    status: string;
    reference: string;
    created_at: string;
    completed_at: string | null;
    payout_method: PayoutMethod | null;
}

interface PaginatedPayouts {
    data: Payout[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface RecentOrder {
    id: number;
    reference: string;
    service: {
        title: string;
    };
    agreed_price: number;
    currency: string;
    completed_at: string;
}

interface Props {
    balance: {
        available: number;
        pending: number;
        currency: string;
    };
    payouts: PaginatedPayouts;
    payoutMethods: PayoutMethod[];
    recentOrders: RecentOrder[];
    statuses: Record<string, string>;
}

export default function Wallet({ balance, payouts, payoutMethods, recentOrders, statuses }: Props) {
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

    const formatCurrency = (value: number, currency: string) => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 2,
        }).format(value) + ' ' + currency;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Carteira" />

            <Container size="xl" py="xl">
                <Stack gap="lg">
                    <Group justify="space-between">
                        <div>
                            <Title order={2}>Minha Carteira</Title>
                            <Text c="dimmed" size="sm">
                                Gerencie os seus ganhos e levantamentos
                            </Text>
                        </div>
                        <Group>
                            <Button
                                component={Link}
                                href={route('provider.payout-methods.index')}
                                variant="light"
                                leftSection={<IconCreditCard size={16} />}
                            >
                                Métodos de Pagamento
                            </Button>
                            <Button
                                component={Link}
                                href={route('provider.payouts.create')}
                                leftSection={<IconPlus size={16} />}
                                disabled={balance.available < 5000 || payoutMethods.length === 0}
                            >
                                Solicitar Levantamento
                            </Button>
                        </Group>
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group>
                                <ThemeIcon size="xl" variant="light" color="green" radius="md">
                                    <IconWallet size={28} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" c="dimmed">
                                        Saldo Disponível
                                    </Text>
                                    <Text size="xl" fw={700} c="green">
                                        {formatCurrency(balance.available, balance.currency)}
                                    </Text>
                                </div>
                            </Group>
                        </Card>

                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group>
                                <ThemeIcon size="xl" variant="light" color="yellow" radius="md">
                                    <IconClock size={28} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" c="dimmed">
                                        Levantamentos Pendentes
                                    </Text>
                                    <Text size="xl" fw={700} c="yellow">
                                        {formatCurrency(balance.pending, balance.currency)}
                                    </Text>
                                </div>
                            </Group>
                        </Card>

                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group>
                                <ThemeIcon size="xl" variant="light" color="violet" radius="md">
                                    <IconBuildingBank size={28} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" c="dimmed">
                                        Métodos de Pagamento
                                    </Text>
                                    <Text size="xl" fw={700}>
                                        {payoutMethods.length}
                                    </Text>
                                </div>
                            </Group>
                        </Card>
                    </SimpleGrid>

                    {payoutMethods.length === 0 && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            title="Configure um método de pagamento"
                            color="yellow"
                        >
                            <Text size="sm">
                                Para solicitar levantamentos, precisa configurar pelo menos um método de pagamento.
                            </Text>
                            <Button
                                component={Link}
                                href={route('provider.payout-methods.create')}
                                variant="light"
                                color="yellow"
                                size="xs"
                                mt="sm"
                            >
                                Adicionar Método
                            </Button>
                        </Alert>
                    )}

                    {balance.available > 0 && balance.available < 5000 && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            color="blue"
                        >
                            O valor mínimo para levantamento é de 5.000 AOA. Continue a trabalhar para atingir este valor.
                        </Alert>
                    )}

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="md">Histórico de Levantamentos</Title>

                        {payouts.data.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">
                                Ainda não fez nenhum levantamento
                            </Text>
                        ) : (
                            <>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Referência</Table.Th>
                                            <Table.Th>Método</Table.Th>
                                            <Table.Th>Valor Bruto</Table.Th>
                                            <Table.Th>Taxa</Table.Th>
                                            <Table.Th>Valor Líquido</Table.Th>
                                            <Table.Th>Status</Table.Th>
                                            <Table.Th>Data</Table.Th>
                                            <Table.Th>Ações</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {payouts.data.map((payout) => (
                                            <Table.Tr key={payout.id}>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>
                                                        {payout.reference}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">
                                                        {payout.payout_method?.name || 'N/A'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">
                                                        {formatCurrency(payout.amount, payout.currency)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="red">
                                                        -{formatCurrency(payout.fee, payout.currency)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500} c="green">
                                                        {formatCurrency(payout.net_amount, payout.currency)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color={getStatusColor(payout.status)}
                                                        leftSection={getStatusIcon(payout.status)}
                                                        size="sm"
                                                    >
                                                        {statuses[payout.status]}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">
                                                        {new Date(payout.created_at).toLocaleDateString('pt-AO')}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <Tooltip label="Ver detalhes">
                                                            <ActionIcon
                                                                component={Link}
                                                                href={route('provider.payouts.show', payout.id)}
                                                                variant="light"
                                                                size="sm"
                                                            >
                                                                <IconEye size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        {payout.status === 'pending' && (
                                                            <Tooltip label="Cancelar">
                                                                <ActionIcon
                                                                    variant="light"
                                                                    size="sm"
                                                                    color="red"
                                                                    onClick={() => {
                                                                        if (confirm('Cancelar este levantamento?')) {
                                                                            router.post(route('provider.payouts.cancel', payout.id));
                                                                        }
                                                                    }}
                                                                >
                                                                    <IconX size={14} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>

                                {payouts.last_page > 1 && (
                                    <Group justify="center" mt="md">
                                        <Pagination
                                            total={payouts.last_page}
                                            value={payouts.current_page}
                                            onChange={(page) => {
                                                window.location.href = route('provider.wallet', { page });
                                            }}
                                        />
                                    </Group>
                                )}
                            </>
                        )}
                    </Card>

                    {recentOrders.length > 0 && (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Title order={4} mb="md">Pedidos Concluídos Recentes</Title>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Referência</Table.Th>
                                        <Table.Th>Serviço</Table.Th>
                                        <Table.Th>Valor</Table.Th>
                                        <Table.Th>Concluído em</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {recentOrders.map((order) => (
                                        <Table.Tr key={order.id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>
                                                    {order.reference}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" lineClamp={1}>
                                                    {order.service.title}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="green" fw={500}>
                                                    {formatCurrency(order.agreed_price, order.currency)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {new Date(order.completed_at).toLocaleDateString('pt-AO')}
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Card>
                    )}
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
