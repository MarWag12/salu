import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Table,
    Badge,
    Group,
    Stack,
    Pagination,
    Button,
    Tabs,
    Paper,
    ThemeIcon,
    Title,
    SimpleGrid,
    Tooltip,
    ActionIcon,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconReceipt,
    IconCash,
    IconClock,
    IconCheck,
    IconChevronRight,
    IconSparkles,
} from '@tabler/icons-react';

interface Payment {
    id: number;
    amount: string;
    currency: string;
    formatted_amount: string;
    status: string;
    gateway: string;
    created_at: string;
    service: {
        id: number;
        name: string;
    };
    highlight_plan: {
        name: string;
        duration_label: string;
    } | null;
}

interface Order {
    id: number;
    reference: string;
    agreed_price: number;
    status: string;
    completed_at: string | null;
    delivered_at: string | null;
    service: {
        id: number;
        name: string;
    };
    client: {
        id: number;
        name: string;
    };
}

interface PaginatedPayments {
    data: Payment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface EarningsSummary {
    total_completed: number;
    total_pending: number;
    completed_count: number;
    pending_count: number;
}

interface Props {
    payments: PaginatedPayments;
    completedOrders: PaginatedOrders;
    earningsSummary: EarningsSummary;
}

const statusColors: Record<string, string> = {
    pending: 'yellow',
    completed: 'green',
    delivered: 'blue',
    failed: 'red',
    refunded: 'blue',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    completed: 'Concluido',
    delivered: 'Entregue',
    failed: 'Falhado',
    refunded: 'Reembolsado',
};

const gatewayLabels: Record<string, string> = {
    simulation: 'Simulacao',
    simulated: 'Simulacao',
    stripe: 'Stripe',
    paypal: 'PayPal',
    mpesa: 'M-Pesa',
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-AO', {
        style: 'decimal',
        minimumFractionDigits: 0,
    }).format(value) + ' Kz';
};

export default function History({ payments, completedOrders, earningsSummary }: Props) {
    const handleEarningsPageChange = (page: number) => {
        router.get(route('provider.payments.history'), { earnings_page: page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleHighlightPageChange = (page: number) => {
        router.get(route('provider.payments.history'), { highlight_page: page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Pagamentos e Ganhos
                </h2>
            }
        >
            <Head title="Pagamentos e Ganhos" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Stack gap="xl">
                        {/* Summary Cards */}
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                            <Paper p="lg" radius="lg" shadow="sm" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                                        Ganhos Confirmados
                                    </Text>
                                    <ThemeIcon size="lg" variant="light" color="green">
                                        <IconCash size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text fw={700} size="xl" c="green">
                                    {formatCurrency(earningsSummary.total_completed)}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {earningsSummary.completed_count} pedido(s)
                                </Text>
                            </Paper>

                            <Paper p="lg" radius="lg" shadow="sm" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                                        Aguardando Confirmacao
                                    </Text>
                                    <ThemeIcon size="lg" variant="light" color="orange">
                                        <IconClock size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text fw={700} size="xl" c="orange">
                                    {formatCurrency(earningsSummary.total_pending)}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {earningsSummary.pending_count} pedido(s) entregue(s)
                                </Text>
                            </Paper>

                            <Paper p="lg" radius="lg" shadow="sm" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                                        Total Geral
                                    </Text>
                                    <ThemeIcon size="lg" variant="light" color="blue">
                                        <IconReceipt size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text fw={700} size="xl">
                                    {formatCurrency(earningsSummary.total_completed + earningsSummary.total_pending)}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Confirmados + Pendentes
                                </Text>
                            </Paper>

                            <Paper p="lg" radius="lg" shadow="sm" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                                        Servicos Concluidos
                                    </Text>
                                    <ThemeIcon size="lg" variant="light" color="teal">
                                        <IconCheck size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text fw={700} size="xl">
                                    {earningsSummary.completed_count + earningsSummary.pending_count}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Total de servicos
                                </Text>
                            </Paper>
                        </SimpleGrid>

                        {/* Tabs */}
                        <Card shadow="sm" padding="lg" radius="lg" withBorder>
                            <Tabs defaultValue="earnings">
                                <Tabs.List>
                                    <Tabs.Tab value="earnings" leftSection={<IconCash size={16} />}>
                                        Ganhos dos Servicos
                                        {completedOrders.total > 0 && (
                                            <Badge size="xs" ml="xs" variant="light">
                                                {completedOrders.total}
                                            </Badge>
                                        )}
                                    </Tabs.Tab>
                                    <Tabs.Tab value="highlights" leftSection={<IconSparkles size={16} />}>
                                        Pagamentos de Destaque
                                        {payments.total > 0 && (
                                            <Badge size="xs" ml="xs" variant="light">
                                                {payments.total}
                                            </Badge>
                                        )}
                                    </Tabs.Tab>
                                </Tabs.List>

                                <Tabs.Panel value="earnings" pt="lg">
                                    {completedOrders.data.length === 0 ? (
                                        <Paper p="xl" bg="gray.0" radius="md" ta="center">
                                            <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                                <IconReceipt size={30} />
                                            </ThemeIcon>
                                            <Text c="dimmed" size="lg">
                                                Nenhum ganho registado ainda.
                                            </Text>
                                            <Text size="sm" c="dimmed" mt="xs">
                                                Os ganhos aparecerao aqui quando completar servicos.
                                            </Text>
                                        </Paper>
                                    ) : (
                                        <>
                                            <Table highlightOnHover>
                                                <Table.Thead>
                                                    <Table.Tr>
                                                        <Table.Th>Referencia</Table.Th>
                                                        <Table.Th>Servico</Table.Th>
                                                        <Table.Th>Cliente</Table.Th>
                                                        <Table.Th>Data</Table.Th>
                                                        <Table.Th ta="right">Valor</Table.Th>
                                                        <Table.Th>Estado</Table.Th>
                                                        <Table.Th></Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {completedOrders.data.map((order) => (
                                                        <Table.Tr key={order.id}>
                                                            <Table.Td>
                                                                <Badge variant="light">#{order.reference}</Badge>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm" fw={500} lineClamp={1}>
                                                                    {order.service?.name || 'N/A'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm">{order.client?.name || 'N/A'}</Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm" c="dimmed">
                                                                    {order.completed_at
                                                                        ? new Date(order.completed_at).toLocaleDateString('pt-PT')
                                                                        : order.delivered_at
                                                                        ? new Date(order.delivered_at).toLocaleDateString('pt-PT')
                                                                        : '-'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td ta="right">
                                                                <Text fw={600} c="green">
                                                                    {formatCurrency(order.agreed_price)}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Badge color={statusColors[order.status] || 'gray'}>
                                                                    {statusLabels[order.status] || order.status}
                                                                </Badge>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Tooltip label="Ver Pedido">
                                                                    <ActionIcon
                                                                        variant="light"
                                                                        component={Link}
                                                                        href={route('orders.show', order.id)}
                                                                    >
                                                                        <IconChevronRight size={16} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))}
                                                </Table.Tbody>
                                            </Table>

                                            {completedOrders.last_page > 1 && (
                                                <Group justify="center" mt="xl">
                                                    <Pagination
                                                        total={completedOrders.last_page}
                                                        value={completedOrders.current_page}
                                                        onChange={handleEarningsPageChange}
                                                        radius="xl"
                                                        withEdges
                                                    />
                                                </Group>
                                            )}
                                        </>
                                    )}
                                </Tabs.Panel>

                                <Tabs.Panel value="highlights" pt="lg">
                                    {payments.data.length === 0 ? (
                                        <Paper p="xl" bg="gray.0" radius="md" ta="center">
                                            <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                                <IconSparkles size={30} />
                                            </ThemeIcon>
                                            <Text c="dimmed" size="lg">
                                                Nenhum pagamento de destaque.
                                            </Text>
                                            <Text size="sm" c="dimmed" mt="xs">
                                                Destaque os seus servicos para aparecerem no topo das pesquisas.
                                            </Text>
                                        </Paper>
                                    ) : (
                                        <>
                                            <Table highlightOnHover>
                                                <Table.Thead>
                                                    <Table.Tr>
                                                        <Table.Th>Data</Table.Th>
                                                        <Table.Th>Servico</Table.Th>
                                                        <Table.Th>Plano</Table.Th>
                                                        <Table.Th>Metodo</Table.Th>
                                                        <Table.Th>Valor</Table.Th>
                                                        <Table.Th>Estado</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {payments.data.map((payment) => (
                                                        <Table.Tr key={payment.id}>
                                                            <Table.Td>
                                                                {new Date(payment.created_at).toLocaleDateString('pt-PT')}
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm" fw={500} lineClamp={1}>
                                                                    {payment.service?.name || 'N/A'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm">
                                                                    {payment.highlight_plan?.duration_label || 'N/A'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm">
                                                                    {gatewayLabels[payment.gateway] || payment.gateway}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm" fw={500}>
                                                                    {payment.formatted_amount}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Badge color={statusColors[payment.status] || 'gray'}>
                                                                    {statusLabels[payment.status] || payment.status}
                                                                </Badge>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))}
                                                </Table.Tbody>
                                            </Table>

                                            {payments.last_page > 1 && (
                                                <Group justify="center" mt="xl">
                                                    <Pagination
                                                        total={payments.last_page}
                                                        value={payments.current_page}
                                                        onChange={handleHighlightPageChange}
                                                        radius="xl"
                                                        withEdges
                                                    />
                                                </Group>
                                            )}
                                        </>
                                    )}
                                </Tabs.Panel>
                            </Tabs>
                        </Card>
                    </Stack>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
