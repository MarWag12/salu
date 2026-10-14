import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Group,
    Stack,
    Badge,
    Paper,
    SimpleGrid,
    ThemeIcon,
    Table,
    Pagination,
    Button,
    Select,
    TextInput,
    ActionIcon,
    Tooltip,
    Divider,
    Progress,
    Box,
    Title,
    Menu,
    rem,
} from '@mantine/core';
import {
    IconCash,
    IconReceipt,
    IconTrendingUp,
    IconDownload,
    IconFilter,
    IconCalendar,
    IconChevronRight,
    IconFileTypePdf,
    IconRefresh,
    IconChartBar,
} from '@tabler/icons-react';
import { useState } from 'react';

interface Order {
    id: number;
    reference: string;
    agreed_price: number;
    completed_at: string;
    service: {
        id: number;
        name: string;
    };
    client: {
        id: number;
        name: string;
    };
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface MonthlyEarning {
    month: string;
    total: number;
    orders: number;
}

interface Props {
    orders: PaginatedOrders;
    stats: {
        total_earnings: number;
        total_orders: number;
        average_order_value: number;
    };
    allTimeStats: {
        total_earnings: number;
        total_orders: number;
    };
    pendingEarnings: {
        total: number;
        count: number;
    };
    monthlyEarnings: MonthlyEarning[];
    filters: {
        start_date: string | null;
        end_date: string | null;
        period: string;
    };
}

export default function Earnings({
    orders,
    stats,
    allTimeStats,
    pendingEarnings,
    monthlyEarnings,
    filters,
}: Props) {
    const [period, setPeriod] = useState(filters.period || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [isExporting, setIsExporting] = useState(false);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 0,
        }).format(value) + ' Kz';
    };

    const handleFilter = () => {
        const params: Record<string, string> = {};

        if (startDate && endDate) {
            params.start_date = startDate;
            params.end_date = endDate;
        } else if (period !== 'all') {
            params.period = period;
        }

        router.get(route('provider.earnings'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePeriodChange = (value: string | null) => {
        if (!value) return;
        setPeriod(value);
        setStartDate('');
        setEndDate('');

        router.get(route('provider.earnings'), { period: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExportPdf = () => {
        setIsExporting(true);

        const params = new URLSearchParams();
        if (startDate && endDate) {
            params.append('start_date', startDate);
            params.append('end_date', endDate);
        } else if (period !== 'all') {
            params.append('period', period);
        }

        window.location.href = route('provider.earnings.export') + '?' + params.toString();

        setTimeout(() => setIsExporting(false), 2000);
    };

    const handlePageChange = (page: number) => {
        const params: Record<string, string | number> = { page };
        if (startDate && endDate) {
            params.start_date = startDate;
            params.end_date = endDate;
        } else if (period !== 'all') {
            params.period = period;
        }
        router.get(route('provider.earnings'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const maxMonthlyEarning = Math.max(...monthlyEarnings.map(m => m.total), 1);

    return (
        <AuthenticatedLayout
            header={
                <Group justify="space-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Histórico de Ganhos
                    </h2>
                    <Button
                        leftSection={<IconFileTypePdf size={18} />}
                        variant="light"
                        color="red"
                        onClick={handleExportPdf}
                        loading={isExporting}
                    >
                        Exportar PDF
                    </Button>
                </Group>
            }
        >
            <Head title="Histórico de Ganhos" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* All Time Stats */}
                    <Paper p="lg" radius="lg" mb="xl" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}>
                        <Group justify="space-between" align="center">
                            <div>
                                <Text c="white" size="sm" style={{ opacity: 0.8 }}>
                                    Ganhos Totais (Todos os Tempos)
                                </Text>
                                <Title order={1} c="white" style={{ fontSize: '2.5rem' }}>
                                    {formatCurrency(allTimeStats.total_earnings)}
                                </Title>
                                <Text c="white" size="sm" style={{ opacity: 0.8 }}>
                                    {allTimeStats.total_orders} servicos concluidos
                                </Text>
                            </div>
                            <ThemeIcon size={80} radius="xl" variant="white" color="violet">
                                <IconCash size={40} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    {/* Pending Earnings Alert */}
                    {pendingEarnings.count > 0 && (
                        <Paper p="md" mb="xl" bg="orange.0" radius="lg" style={{ border: '1px solid var(--mantine-color-orange-3)' }}>
                            <Group justify="space-between" align="center">
                                <Group>
                                    <ThemeIcon size="lg" variant="light" color="orange">
                                        <IconReceipt size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text fw={600} c="orange.8">
                                            Ganhos Pendentes de Confirmacao
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            {pendingEarnings.count} pedido(s) entregue(s) aguardando confirmacao do cliente
                                        </Text>
                                    </div>
                                </Group>
                                <div style={{ textAlign: 'right' }}>
                                    <Text fw={700} size="xl" c="orange.8">
                                        {formatCurrency(pendingEarnings.total)}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Serao creditados apos confirmacao
                                    </Text>
                                </div>
                            </Group>
                        </Paper>
                    )}

                    {/* Filters */}
                    <Card shadow="sm" padding="lg" radius="lg" withBorder mb="xl">
                        <Group justify="space-between" mb="md">
                            <Group gap="xs">
                                <ThemeIcon size="md" variant="light" color="blue">
                                    <IconFilter size={16} />
                                </ThemeIcon>
                                <Text fw={600}>Filtrar por Período</Text>
                            </Group>
                            <Button
                                variant="subtle"
                                size="xs"
                                leftSection={<IconRefresh size={14} />}
                                onClick={() => {
                                    setPeriod('all');
                                    setStartDate('');
                                    setEndDate('');
                                    router.get(route('provider.earnings'));
                                }}
                            >
                                Limpar Filtros
                            </Button>
                        </Group>

                        <Group grow>
                            <Select
                                label="Período Rápido"
                                placeholder="Selecione"
                                value={period}
                                onChange={handlePeriodChange}
                                data={[
                                    { value: 'all', label: 'Todos os tempos' },
                                    { value: 'today', label: 'Hoje' },
                                    { value: 'week', label: 'Esta Semana' },
                                    { value: 'month', label: 'Este Mês' },
                                    { value: 'year', label: 'Este Ano' },
                                ]}
                                leftSection={<IconCalendar size={16} />}
                            />
                            <TextInput
                                label="Data Início"
                                placeholder="AAAA-MM-DD"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <TextInput
                                label="Data Fim"
                                placeholder="AAAA-MM-DD"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                            <Stack justify="flex-end">
                                <Button
                                    onClick={handleFilter}
                                    disabled={!startDate || !endDate}
                                    leftSection={<IconFilter size={16} />}
                                >
                                    Aplicar
                                </Button>
                            </Stack>
                        </Group>
                    </Card>

                    {/* Period Stats */}
                    <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
                        <Paper p="lg" radius="lg" shadow="sm" withBorder>
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                                    Ganhos no Período
                                </Text>
                                <ThemeIcon size="lg" variant="light" color="green">
                                    <IconCash size={20} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl">
                                {formatCurrency(stats.total_earnings)}
                            </Text>
                        </Paper>

                        <Paper p="lg" radius="lg" shadow="sm" withBorder>
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                                    Pedidos Concluídos
                                </Text>
                                <ThemeIcon size="lg" variant="light" color="blue">
                                    <IconReceipt size={20} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl">
                                {stats.total_orders}
                            </Text>
                        </Paper>

                        <Paper p="lg" radius="lg" shadow="sm" withBorder>
                            <Group justify="space-between" mb="xs">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                                    Média por Pedido
                                </Text>
                                <ThemeIcon size="lg" variant="light" color="violet">
                                    <IconTrendingUp size={20} />
                                </ThemeIcon>
                            </Group>
                            <Text fw={700} size="xl">
                                {formatCurrency(stats.average_order_value)}
                            </Text>
                        </Paper>
                    </SimpleGrid>

                    {/* Monthly Chart */}
                    {monthlyEarnings.length > 0 && (
                        <Card shadow="sm" padding="lg" radius="lg" withBorder mb="xl">
                            <Group mb="lg">
                                <ThemeIcon size="md" variant="light" color="blue">
                                    <IconChartBar size={16} />
                                </ThemeIcon>
                                <Text fw={600}>Ganhos Mensais (Últimos 12 Meses)</Text>
                            </Group>
                            <Stack gap="sm">
                                {monthlyEarnings.map((item) => (
                                    <Group key={item.month} gap="sm">
                                        <Text size="sm" w={60} c="dimmed">
                                            {item.month}
                                        </Text>
                                        <Progress
                                            value={(item.total / maxMonthlyEarning) * 100}
                                            size="xl"
                                            radius="xl"
                                            color="violet"
                                            style={{ flex: 1 }}
                                        />
                                        <Text size="sm" fw={500} w={100} ta="right">
                                            {formatCurrency(item.total)}
                                        </Text>
                                        <Badge size="sm" variant="light">
                                            {item.orders} pedidos
                                        </Badge>
                                    </Group>
                                ))}
                            </Stack>
                        </Card>
                    )}

                    {/* Orders Table */}
                    <Card shadow="sm" padding="lg" radius="lg" withBorder>
                        <Group justify="space-between" mb="lg">
                            <Text fw={600}>Histórico de Pedidos</Text>
                            <Badge size="lg" variant="light">
                                {orders.total} pedidos
                            </Badge>
                        </Group>

                        {orders.data.length === 0 ? (
                            <Paper p="xl" bg="gray.0" radius="md" ta="center">
                                <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                    <IconReceipt size={30} />
                                </ThemeIcon>
                                <Text c="dimmed" size="lg">
                                    Nenhum pedido concluído encontrado.
                                </Text>
                                <Text size="sm" c="dimmed" mt="xs">
                                    Os pedidos concluídos aparecerão aqui.
                                </Text>
                            </Paper>
                        ) : (
                            <>
                                <Table highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Referência</Table.Th>
                                            <Table.Th>Serviço</Table.Th>
                                            <Table.Th>Cliente</Table.Th>
                                            <Table.Th>Data</Table.Th>
                                            <Table.Th ta="right">Valor</Table.Th>
                                            <Table.Th></Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {orders.data.map((order) => (
                                            <Table.Tr key={order.id}>
                                                <Table.Td>
                                                    <Badge variant="light">#{order.reference}</Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text fw={500} lineClamp={1}>
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
                                                            : '-'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Text fw={600} c="green">
                                                        {formatCurrency(order.agreed_price)}
                                                    </Text>
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

                                {orders.last_page > 1 && (
                                    <Group justify="center" mt="xl">
                                        <Pagination
                                            total={orders.last_page}
                                            value={orders.current_page}
                                            onChange={handlePageChange}
                                            radius="xl"
                                            withEdges
                                        />
                                    </Group>
                                )}
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
