import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    SimpleGrid,
    Paper,
    Select,
    Pagination,
    Avatar,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import {
    IconClipboardList,
    IconEye,
    IconClock,
    IconCheck,
    IconX,
    IconTrendingUp,
    IconCurrencyDollar,
} from '@tabler/icons-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ServiceProvider {
    id: number;
    company_name: string;
    trading_name: string;
    user: User;
}

interface Service {
    id: number;
    name: string;
    price: number;
}

interface Order {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    status_color: string;
    agreed_price: number;
    service_fee: number;
    requirements: string | null;
    delivery_notes: string | null;
    created_at: string;
    accepted_at: string | null;
    started_at: string | null;
    delivered_at: string | null;
    completed_at: string | null;
    service: Service;
    client?: User;
    provider?: ServiceProvider;
}

interface PaginatedOrders {
    data: Order[];
    current_page: number;
    last_page: number;
    total: number;
}

interface StatusOption {
    value: string;
    label: string;
    color: string;
}

interface Stats {
    total: number;
    pending?: number;
    in_progress?: number;
    completed: number;
    cancelled?: number;
    disputed?: number;
    total_earnings?: number;
    active?: number;
    total_spent?: number;
}

interface Props {
    orders: PaginatedOrders;
    stats: Stats;
    currentStatus: string | null;
    statuses: StatusOption[];
    auth: {
        user: User & { type: string };
    };
}

export default function Index({ orders, stats, currentStatus, statuses, auth }: Props) {
    const isProvider = auth.user.type === 'provider';

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleStatusFilter = (value: string | null) => {
        router.get(route('orders.index'), { status: value || undefined }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get(route('orders.index'), {
            page,
            status: currentStatus || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {isProvider ? 'Meus Pedidos' : 'Minhas Encomendas'}
                </h2>
            }
        >
            <Head title={isProvider ? 'Meus Pedidos' : 'Minhas Encomendas'} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
                        <Paper shadow="sm" p="md" radius="md" withBorder>
                            <Group>
                                <IconClipboardList size={24} className="text-blue-500" />
                                <div>
                                    <Text size="xs" c="dimmed">Total</Text>
                                    <Text fw={700} size="xl">{stats.total}</Text>
                                </div>
                            </Group>
                        </Paper>

                        {isProvider ? (
                            <>
                                <Paper shadow="sm" p="md" radius="md" withBorder>
                                    <Group>
                                        <IconClock size={24} className="text-yellow-500" />
                                        <div>
                                            <Text size="xs" c="dimmed">Em Progresso</Text>
                                            <Text fw={700} size="xl">{stats.in_progress || 0}</Text>
                                        </div>
                                    </Group>
                                </Paper>

                                <Paper shadow="sm" p="md" radius="md" withBorder>
                                    <Group>
                                        <IconCheck size={24} className="text-green-500" />
                                        <div>
                                            <Text size="xs" c="dimmed">Concluídos</Text>
                                            <Text fw={700} size="xl">{stats.completed}</Text>
                                        </div>
                                    </Group>
                                </Paper>

                                <Paper shadow="sm" p="md" radius="md" withBorder>
                                    <Group>
                                        <IconCurrencyDollar size={24} className="text-emerald-500" />
                                        <div>
                                            <Text size="xs" c="dimmed">Ganhos</Text>
                                            <Text fw={700} size="lg">
                                                {formatCurrency(stats.total_earnings || 0)}
                                            </Text>
                                        </div>
                                    </Group>
                                </Paper>
                            </>
                        ) : (
                            <>
                                <Paper shadow="sm" p="md" radius="md" withBorder>
                                    <Group>
                                        <IconTrendingUp size={24} className="text-yellow-500" />
                                        <div>
                                            <Text size="xs" c="dimmed">Activos</Text>
                                            <Text fw={700} size="xl">{stats.active || 0}</Text>
                                        </div>
                                    </Group>
                                </Paper>

                                <Paper shadow="sm" p="md" radius="md" withBorder>
                                    <Group>
                                        <IconCheck size={24} className="text-green-500" />
                                        <div>
                                            <Text size="xs" c="dimmed">Concluídos</Text>
                                            <Text fw={700} size="xl">{stats.completed}</Text>
                                        </div>
                                    </Group>
                                </Paper>

                                <Paper shadow="sm" p="md" radius="md" withBorder>
                                    <Group>
                                        <IconCurrencyDollar size={24} className="text-emerald-500" />
                                        <div>
                                            <Text size="xs" c="dimmed">Total Gasto</Text>
                                            <Text fw={700} size="lg">
                                                {formatCurrency(stats.total_spent || 0)}
                                            </Text>
                                        </div>
                                    </Group>
                                </Paper>
                            </>
                        )}
                    </SimpleGrid>

                    {/* Filters */}
                    <Card shadow="sm" p="md" radius="md" withBorder mb="md">
                        <Group justify="space-between">
                            <Text fw={500}>Filtrar por estado</Text>
                            <Select
                                placeholder="Todos os estados"
                                data={statuses.map(s => ({ value: s.value, label: s.label }))}
                                value={currentStatus}
                                onChange={handleStatusFilter}
                                clearable
                                w={200}
                            />
                        </Group>
                    </Card>

                    {/* Orders List */}
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        {orders.data.length === 0 ? (
                            <Stack align="center" py="xl" gap="md">
                                <IconClipboardList size={48} className="text-gray-400" />
                                <Text c="dimmed" ta="center">
                                    {currentStatus
                                        ? 'Nenhum pedido encontrado com este estado.'
                                        : isProvider
                                            ? 'Ainda não tem pedidos.'
                                            : 'Ainda não fez nenhuma encomenda.'}
                                </Text>
                            </Stack>
                        ) : (
                            <Stack gap={0}>
                                {orders.data.map((order, index) => (
                                    <div
                                        key={order.id}
                                        className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                                    >
                                        <Group justify="space-between" wrap="nowrap">
                                            <Group gap="md" wrap="nowrap">
                                                <Avatar color="blue" radius="xl" size="md">
                                                    {order.service.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <Group gap="xs" mb={2}>
                                                        <Text fw={600} size="sm" lineClamp={1}>
                                                            {order.service.name}
                                                        </Text>
                                                        <Badge
                                                            color={order.status_color}
                                                            variant="light"
                                                            size="sm"
                                                        >
                                                            {order.status_label}
                                                        </Badge>
                                                    </Group>
                                                    <Text size="xs" c="dimmed">
                                                        Ref: {order.reference} •{' '}
                                                        {isProvider
                                                            ? `Cliente: ${order.client?.name}`
                                                            : `Prestador: ${order.provider?.user.name}`}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {formatDate(order.created_at)}
                                                    </Text>
                                                </div>
                                            </Group>
                                            <Group gap="sm" wrap="nowrap">
                                                <Text fw={600} size="sm">
                                                    {formatCurrency(order.agreed_price)}
                                                </Text>
                                                <Tooltip label="Ver detalhes">
                                                    <ActionIcon
                                                        component={Link}
                                                        href={route('orders.show', order.id)}
                                                        variant="light"
                                                        color="blue"
                                                    >
                                                        <IconEye size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Group>
                                    </div>
                                ))}
                            </Stack>
                        )}

                        {orders.last_page > 1 && (
                            <Group justify="center" mt="md">
                                <Pagination
                                    value={orders.current_page}
                                    total={orders.last_page}
                                    onChange={handlePageChange}
                                />
                            </Group>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
