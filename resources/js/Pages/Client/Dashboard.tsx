import { Head, Link } from '@inertiajs/react';
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
    Avatar,
    Progress,
    ThemeIcon,
    ActionIcon,
    Tooltip,
    RingProgress,
    Transition,
    Box,
    Divider,
    Indicator,
    HoverCard,
    rem,
    useMantineTheme,
} from '@mantine/core';
import {
    IconClipboardList,
    IconStar,
    IconMessage,
    IconCurrencyDollar,
    IconEye,
    IconChevronRight,
    IconCheck,
    IconClock,
    IconTruck,
    IconShoppingCart,
    IconHeart,
    IconHeartFilled,
    IconSparkles,
    IconArrowUpRight,
    IconArrowDownRight,
    IconBulb,
    IconRocket,
    IconTrendingUp,
    IconSearch,
    IconBell,
    IconInfoCircle,
    IconStarFilled,
    IconMessageCircle,
    IconGift,
    IconTarget,
    IconAward,
    IconFlame,
    IconWaveSine,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface OrderStats {
    total: number;
    active: number;
    pending: number;
    in_progress: number;
    delivered: number;
    completed: number;
    total_spent: number;
}

interface RecentOrder {
    id: number;
    reference: string;
    service_name: string;
    provider_name: string;
    status: string;
    status_label: string;
    status_color: string;
    agreed_price: number;
    created_at: string;
}

interface ReviewStats {
    total: number;
    pending_for_completed: number;
}

interface OrderNeedingReview {
    id: number;
    service_id: number;
    service_name: string;
    provider_name: string;
    completed_at: string;
}

interface ConversationStats {
    total: number;
    unread: number;
}

interface RecentService {
    id: number;
    name: string;
    price: number;
    category: string | null;
    provider_name: string;
    rating: number;
    reviews_count: number;
}

interface WishlistStats {
    total: number;
}

interface WishlistItem {
    id: number;
    service_id: number;
    service_name: string;
    service_price: string;
    provider_name: string;
    cover_url: string | null;
    added_at: string;
}

interface Props {
    orderStats: OrderStats;
    recentOrders: RecentOrder[];
    reviewStats: ReviewStats;
    ordersNeedingReview: OrderNeedingReview[];
    conversationStats: ConversationStats;
    recentServices: RecentService[];
    wishlistStats: WishlistStats;
    wishlistItems: WishlistItem[];
    auth: {
        user: User;
    };
}

// Componente de Card com Estatísticas Animadas
function StatCard({
    title,
    value,
    icon: Icon,
    color,
    gradient,
    subtitle,
    trend,
    delay = 0,
}: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    gradient?: { from: string; to: string; deg: number };
    subtitle?: string;
    trend?: { value: number; positive: boolean };
    delay?: number;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <Transition mounted={mounted} transition="slide-up" duration={400}>
            {(styles) => (
                <Paper
                    style={styles}
                    shadow="md"
                    p="lg"
                    radius="lg"
                    className="relative overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                    {/* Background Gradient Effect */}
                    <Box
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: gradient
                                ? `linear-gradient(${gradient.deg}deg, ${gradient.from}15, ${gradient.to}15)`
                                : `var(--mantine-color-${color}-0)`,
                        }}
                    />

                    <Group justify="space-between" className="relative z-10">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
                                {title}
                            </Text>
                            <Group gap="xs" align="flex-end">
                                <Text fw={800} size="2rem" style={{ lineHeight: 1 }}>
                                    {value}
                                </Text>
                                {trend && (
                                    <Badge
                                        size="sm"
                                        variant="light"
                                        color={trend.positive ? 'teal' : 'red'}
                                        leftSection={
                                            trend.positive ? (
                                                <IconArrowUpRight size={12} />
                                            ) : (
                                                <IconArrowDownRight size={12} />
                                            )
                                        }
                                    >
                                        {trend.value}%
                                    </Badge>
                                )}
                            </Group>
                            {subtitle && (
                                <Text size="xs" c="dimmed" mt={4}>
                                    {subtitle}
                                </Text>
                            )}
                        </div>
                        <ThemeIcon
                            size={56}
                            radius="xl"
                            variant="gradient"
                            gradient={gradient || { from: color, to: color, deg: 135 }}
                            className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                        >
                            <Icon size={28} stroke={1.5} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            )}
        </Transition>
    );
}

// Componente de Dica do Dia
function TipCard({ tip, icon: Icon }: { tip: string; icon: React.ComponentType<any> }) {
    return (
        <Paper
            p="md"
            radius="lg"
            className="relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Group gap="md" wrap="nowrap">
                <ThemeIcon size={44} radius="xl" variant="white" color="violet">
                    <Icon size={22} />
                </ThemeIcon>
                <div>
                    <Text size="xs" c="white" opacity={0.8} fw={600} mb={2}>
                        DICA DO DIA
                    </Text>
                    <Text size="sm" c="white" fw={500}>
                        {tip}
                    </Text>
                </div>
            </Group>
            <IconSparkles
                size={80}
                className="absolute -right-4 -bottom-4 opacity-10 text-white"
            />
        </Paper>
    );
}

// Componente de Pedido com Animação
function OrderCard({ order, index, formatCurrency, formatDate }: {
    order: RecentOrder;
    index: number;
    formatCurrency: (value: number) => string;
    formatDate: (date: string) => string;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), index * 100);
        return () => clearTimeout(timer);
    }, [index]);

    const statusIcons: Record<string, React.ReactNode> = {
        pending: <IconClock size={14} />,
        accepted: <IconCheck size={14} />,
        in_progress: <IconFlame size={14} />,
        delivered: <IconTruck size={14} />,
        completed: <IconAward size={14} />,
    };

    return (
        <Transition mounted={mounted} transition="slide-right" duration={300}>
            {(styles) => (
                <Paper
                    style={styles}
                    p="md"
                    withBorder
                    radius="lg"
                    component={Link}
                    href={route('orders.show', order.id)}
                    className="group hover:border-blue-300 hover:shadow-md transition-all duration-300 hover:translate-x-1"
                >
                    <Group justify="space-between" wrap="nowrap">
                        <Group gap="md" wrap="nowrap">
                            <Avatar
                                size="lg"
                                radius="xl"
                                variant="gradient"
                                gradient={{ from: 'blue', to: 'cyan', deg: 135 }}
                                className="transform transition-transform group-hover:scale-110"
                            >
                                {order.service_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <Text size="sm" fw={600} lineClamp={1} className="group-hover:text-blue-600 transition-colors">
                                    {order.service_name}
                                </Text>
                                <Group gap="xs" mt={2}>
                                    <Text size="xs" c="dimmed">
                                        {order.provider_name}
                                    </Text>
                                    <Text size="xs" c="dimmed">•</Text>
                                    <Text size="xs" c="dimmed">
                                        {formatDate(order.created_at)}
                                    </Text>
                                </Group>
                            </div>
                        </Group>
                        <Stack gap={4} align="flex-end">
                            <Badge
                                color={order.status_color}
                                variant="light"
                                size="sm"
                                leftSection={statusIcons[order.status]}
                            >
                                {order.status_label}
                            </Badge>
                            <Text size="sm" fw={700} c="blue">
                                {formatCurrency(order.agreed_price)}
                            </Text>
                        </Stack>
                    </Group>
                </Paper>
            )}
        </Transition>
    );
}

export default function Dashboard({
    orderStats,
    recentOrders,
    reviewStats,
    ordersNeedingReview,
    conversationStats,
    recentServices,
    wishlistStats,
    wishlistItems,
    auth,
}: Props) {
    const theme = useMantineTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        });
    };

    const completionRate = orderStats.total > 0
        ? Math.round((orderStats.completed / orderStats.total) * 100)
        : 0;

    const tips = [
        'Avalie os serviços que concluiu para ajudar outros clientes a escolher melhor!',
        'Adicione serviços à sua lista de desejos para não os perder de vista.',
        'Comunique sempre pelo chat para manter um registo das conversas.',
        'Verifique as avaliações dos prestadores antes de fazer um pedido.',
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <AuthenticatedLayout
            header={
                <Transition mounted={mounted} transition="slide-down" duration={400}>
                    {(styles) => (
                        <div style={styles}>
                            <Group justify="space-between" align="flex-start">
                                <div>
                                    <Group gap="xs" mb={4}>
                                        <Text size="sm" c="dimmed">{getGreeting()}</Text>
                                        <IconWaveSine size={16} className="text-yellow-500" />
                                    </Group>
                                    <Text
                                        size="xl"
                                        fw={800}
                                        variant="gradient"
                                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                    >
                                        {auth.user.name}
                                    </Text>
                                </div>
                                <Group gap="xs">
                                    <Tooltip label="Pesquisar serviços" position="bottom">
                                        <ActionIcon
                                            component={Link}
                                            href={route('services.index')}
                                            variant="light"
                                            size="lg"
                                            radius="xl"
                                        >
                                            <IconSearch size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Notificações" position="bottom">
                                        <Indicator
                                            color="red"
                                            size={8}
                                            disabled={conversationStats.unread === 0}
                                        >
                                            <ActionIcon
                                                component={Link}
                                                href={route('notifications.index')}
                                                variant="light"
                                                size="lg"
                                                radius="xl"
                                            >
                                                <IconBell size={18} />
                                            </ActionIcon>
                                        </Indicator>
                                    </Tooltip>
                                </Group>
                            </Group>
                        </div>
                    )}
                </Transition>
            }
        >
            <Head title="Painel do Cliente" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Tip Card */}
                    <Transition mounted={mounted} transition="fade" duration={600}>
                        {(styles) => (
                            <Box style={styles} mb="xl">
                                <TipCard tip={randomTip} icon={IconBulb} />
                            </Box>
                        )}
                    </Transition>

                    {/* Stats Overview com Animações */}
                    <SimpleGrid cols={{ base: 2, md: 4 }} mb="xl">
                        <StatCard
                            title="Total Pedidos"
                            value={orderStats.total}
                            icon={IconClipboardList}
                            color="blue"
                            gradient={{ from: '#228be6', to: '#15aabf', deg: 135 }}
                            subtitle="Todos os pedidos"
                            delay={0}
                        />
                        <StatCard
                            title="Activos"
                            value={orderStats.active}
                            icon={IconRocket}
                            color="orange"
                            gradient={{ from: '#fd7e14', to: '#fab005', deg: 135 }}
                            subtitle="Em andamento"
                            delay={100}
                        />
                        <StatCard
                            title="Concluídos"
                            value={orderStats.completed}
                            icon={IconCheck}
                            color="green"
                            gradient={{ from: '#40c057', to: '#12b886', deg: 135 }}
                            subtitle={`${completionRate}% taxa`}
                            delay={200}
                        />
                        <StatCard
                            title="Total Gasto"
                            value={formatCurrency(orderStats.total_spent)}
                            icon={IconCurrencyDollar}
                            color="violet"
                            gradient={{ from: '#7950f2', to: '#be4bdb', deg: 135 }}
                            delay={300}
                        />
                    </SimpleGrid>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Recent Orders com Animações */}
                            <Transition mounted={mounted} transition="slide-up" duration={500}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group justify="space-between" mb="lg">
                                            <Group gap="xs">
                                                <ThemeIcon size="lg" radius="xl" variant="light" color="blue">
                                                    <IconClipboardList size={18} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={700} size="lg">Pedidos Recentes</Text>
                                                    <Text size="xs" c="dimmed">Os seus últimos pedidos de serviços</Text>
                                                </div>
                                            </Group>
                                            <Button
                                                component={Link}
                                                href={route('orders.index')}
                                                variant="subtle"
                                                size="sm"
                                                rightSection={<IconChevronRight size={14} />}
                                            >
                                                Ver Todos
                                            </Button>
                                        </Group>

                                        {recentOrders.length === 0 ? (
                                            <Paper
                                                p="xl"
                                                radius="lg"
                                                className="text-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                                }}
                                            >
                                                <ThemeIcon size={64} radius="xl" variant="light" color="gray" mb="md" mx="auto">
                                                    <IconShoppingCart size={32} />
                                                </ThemeIcon>
                                                <Text fw={600} mb="xs">Nenhum pedido ainda</Text>
                                                <Text c="dimmed" size="sm" mb="md">
                                                    Comece a explorar os serviços disponíveis
                                                </Text>
                                                <Button
                                                    component={Link}
                                                    href={route('services.index')}
                                                    variant="gradient"
                                                    gradient={{ from: 'blue', to: 'cyan' }}
                                                    leftSection={<IconSearch size={16} />}
                                                >
                                                    Explorar Serviços
                                                </Button>
                                            </Paper>
                                        ) : (
                                            <Stack gap="sm">
                                                {recentOrders.map((order, index) => (
                                                    <OrderCard
                                                        key={order.id}
                                                        order={order}
                                                        index={index}
                                                        formatCurrency={formatCurrency}
                                                        formatDate={formatDate}
                                                    />
                                                ))}
                                            </Stack>
                                        )}
                                    </Card>
                                )}
                            </Transition>

                            {/* Orders Awaiting Review */}
                            {ordersNeedingReview.length > 0 && (
                                <Transition mounted={mounted} transition="slide-up" duration={600}>
                                    {(styles) => (
                                        <Card
                                            style={styles}
                                            shadow="md"
                                            padding="lg"
                                            radius="lg"
                                            className="border-2 border-yellow-200"
                                            bg="yellow.0"
                                        >
                                            <Group justify="space-between" mb="md">
                                                <Group gap="xs">
                                                    <ThemeIcon size="lg" radius="xl" color="yellow" variant="filled">
                                                        <IconStar size={18} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Group gap="xs">
                                                            <Text fw={700} size="lg">Aguardam Avaliação</Text>
                                                            <Badge color="yellow" size="lg" variant="filled">
                                                                {reviewStats.pending_for_completed}
                                                            </Badge>
                                                        </Group>
                                                        <Text size="xs" c="dimmed">
                                                            A sua opinião ajuda outros clientes!
                                                        </Text>
                                                    </div>
                                                </Group>
                                            </Group>

                                            <Stack gap="sm">
                                                {ordersNeedingReview.map((order, index) => (
                                                    <Transition
                                                        key={order.id}
                                                        mounted={mounted}
                                                        transition="slide-right"
                                                        duration={300 + index * 100}
                                                    >
                                                        {(transitionStyles) => (
                                                            <Paper
                                                                style={transitionStyles}
                                                                p="md"
                                                                radius="lg"
                                                                withBorder
                                                                className="bg-white"
                                                            >
                                                                <Group justify="space-between">
                                                                    <Group gap="md">
                                                                        <Avatar
                                                                            size="md"
                                                                            radius="xl"
                                                                            color="yellow"
                                                                            variant="light"
                                                                        >
                                                                            <IconStarFilled size={18} />
                                                                        </Avatar>
                                                                        <div>
                                                                            <Text size="sm" fw={600}>{order.service_name}</Text>
                                                                            <Text size="xs" c="dimmed">{order.provider_name}</Text>
                                                                        </div>
                                                                    </Group>
                                                                    <Button
                                                                        component={Link}
                                                                        href={route('reviews.create', order.service_id)}
                                                                        size="sm"
                                                                        variant="gradient"
                                                                        gradient={{ from: 'yellow', to: 'orange' }}
                                                                        leftSection={<IconStar size={14} />}
                                                                    >
                                                                        Avaliar
                                                                    </Button>
                                                                </Group>
                                                            </Paper>
                                                        )}
                                                    </Transition>
                                                ))}
                                            </Stack>
                                        </Card>
                                    )}
                                </Transition>
                            )}

                            {/* Featured Services */}
                            <Transition mounted={mounted} transition="slide-up" duration={700}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group justify="space-between" mb="lg">
                                            <Group gap="xs">
                                                <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'pink', to: 'grape' }}>
                                                    <IconSparkles size={18} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={700} size="lg">Serviços em Destaque</Text>
                                                    <Text size="xs" c="dimmed">Recomendados para si</Text>
                                                </div>
                                            </Group>
                                            <Button
                                                component={Link}
                                                href={route('services.index')}
                                                variant="subtle"
                                                size="sm"
                                                rightSection={<IconChevronRight size={14} />}
                                            >
                                                Ver Todos
                                            </Button>
                                        </Group>

                                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                            {recentServices.map((service, index) => (
                                                <Transition
                                                    key={service.id}
                                                    mounted={mounted}
                                                    transition="pop"
                                                    duration={400 + index * 100}
                                                >
                                                    {(transitionStyles) => (
                                                        <Paper
                                                            style={transitionStyles}
                                                            p="md"
                                                            withBorder
                                                            radius="lg"
                                                            component={Link}
                                                            href={route('services.show', service.id)}
                                                            className="group hover:border-pink-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                                        >
                                                            <Group justify="space-between" mb="xs">
                                                                <Badge
                                                                    variant="light"
                                                                    size="sm"
                                                                    color="grape"
                                                                >
                                                                    {service.category || 'Geral'}
                                                                </Badge>
                                                                <Group gap={4}>
                                                                    <IconStarFilled size={14} className="text-yellow-400" />
                                                                    <Text size="xs" fw={600}>
                                                                        {service.rating?.toFixed(1) || 'N/A'}
                                                                    </Text>
                                                                    <Text size="xs" c="dimmed">
                                                                        ({service.reviews_count})
                                                                    </Text>
                                                                </Group>
                                                            </Group>
                                                            <Text size="sm" fw={600} lineClamp={1} mb={4} className="group-hover:text-pink-600 transition-colors">
                                                                {service.name}
                                                            </Text>
                                                            <Text size="xs" c="dimmed" mb="xs">{service.provider_name}</Text>
                                                            <Text size="lg" fw={800} variant="gradient" gradient={{ from: 'pink', to: 'grape' }}>
                                                                {formatCurrency(service.price)}
                                                            </Text>
                                                        </Paper>
                                                    )}
                                                </Transition>
                                            ))}
                                        </SimpleGrid>
                                    </Card>
                                )}
                            </Transition>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Actions com Design Moderno */}
                            <Transition mounted={mounted} transition="slide-left" duration={500}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group gap="xs" mb="lg">
                                            <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                                                <IconTarget size={18} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700} size="lg">Acções Rápidas</Text>
                                                <Text size="xs" c="dimmed">O que pretende fazer?</Text>
                                            </div>
                                        </Group>
                                        <Stack gap="xs">
                                            {[
                                                { href: route('services.index'), icon: IconSearch, label: 'Procurar Serviços', color: 'blue', gradient: { from: 'blue', to: 'cyan' } },
                                                { href: route('orders.index'), icon: IconClipboardList, label: 'Meus Pedidos', color: 'violet', gradient: { from: 'violet', to: 'grape' } },
                                                { href: route('messages.index'), icon: IconMessageCircle, label: 'Mensagens', color: 'teal', gradient: { from: 'teal', to: 'lime' }, badge: conversationStats.unread },
                                                { href: route('reviews.index'), icon: IconStar, label: 'Minhas Avaliações', color: 'yellow', gradient: { from: 'yellow', to: 'orange' } },
                                                { href: route('wishlist.index'), icon: IconHeart, label: 'Lista de Desejos', color: 'red', gradient: { from: 'red', to: 'pink' }, badge: wishlistStats.total },
                                            ].map((action, index) => (
                                                <Button
                                                    key={action.label}
                                                    component={Link}
                                                    href={action.href}
                                                    variant="light"
                                                    color={action.color}
                                                    fullWidth
                                                    justify="flex-start"
                                                    leftSection={
                                                        <ThemeIcon size="sm" radius="xl" variant="gradient" gradient={action.gradient}>
                                                            <action.icon size={14} />
                                                        </ThemeIcon>
                                                    }
                                                    rightSection={
                                                        action.badge && action.badge > 0 ? (
                                                            <Badge size="sm" color={action.color} variant="filled">
                                                                {action.badge}
                                                            </Badge>
                                                        ) : null
                                                    }
                                                    className="transition-all duration-300 hover:translate-x-1"
                                                    styles={{
                                                        root: {
                                                            height: rem(44),
                                                        },
                                                        label: {
                                                            flex: 1,
                                                            textAlign: 'left',
                                                        },
                                                    }}
                                                >
                                                    {action.label}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Card>
                                )}
                            </Transition>

                            {/* Order Status com Ring Progress */}
                            <Transition mounted={mounted} transition="slide-left" duration={600}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group gap="xs" mb="lg">
                                            <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'green', to: 'lime' }}>
                                                <IconTrendingUp size={18} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700} size="lg">Estado dos Pedidos</Text>
                                                <Text size="xs" c="dimmed">Visão geral</Text>
                                            </div>
                                        </Group>

                                        <Group justify="center" mb="md">
                                            <RingProgress
                                                size={140}
                                                thickness={12}
                                                roundCaps
                                                label={
                                                    <div className="text-center">
                                                        <Text size="xl" fw={800}>{completionRate}%</Text>
                                                        <Text size="xs" c="dimmed">Conclusão</Text>
                                                    </div>
                                                }
                                                sections={[
                                                    { value: completionRate, color: 'green' },
                                                    { value: orderStats.total > 0 ? (orderStats.active / orderStats.total) * 100 : 0, color: 'blue' },
                                                ]}
                                            />
                                        </Group>

                                        <Stack gap="xs">
                                            {[
                                                { icon: IconClock, label: 'Pendentes', value: orderStats.pending, color: 'yellow' },
                                                { icon: IconFlame, label: 'Em Progresso', value: orderStats.in_progress, color: 'blue' },
                                                { icon: IconTruck, label: 'Entregues', value: orderStats.delivered, color: 'teal' },
                                                { icon: IconCheck, label: 'Concluídos', value: orderStats.completed, color: 'green' },
                                            ].map((item) => (
                                                <Group key={item.label} justify="space-between">
                                                    <Group gap="xs">
                                                        <ThemeIcon size="sm" radius="xl" color={item.color} variant="light">
                                                            <item.icon size={12} />
                                                        </ThemeIcon>
                                                        <Text size="sm">{item.label}</Text>
                                                    </Group>
                                                    <Badge color={item.color} variant="light" size="lg">
                                                        {item.value}
                                                    </Badge>
                                                </Group>
                                            ))}
                                        </Stack>
                                    </Card>
                                )}
                            </Transition>

                            {/* Wishlist Preview */}
                            {wishlistItems.length > 0 && (
                                <Transition mounted={mounted} transition="slide-left" duration={700}>
                                    {(styles) => (
                                        <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                            <Group justify="space-between" mb="md">
                                                <Group gap="xs">
                                                    <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'red', to: 'pink' }}>
                                                        <IconHeartFilled size={18} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Text fw={700} size="lg">Lista de Desejos</Text>
                                                        <Text size="xs" c="dimmed">{wishlistStats.total} serviços guardados</Text>
                                                    </div>
                                                </Group>
                                                <Button
                                                    component={Link}
                                                    href={route('wishlist.index')}
                                                    variant="subtle"
                                                    size="xs"
                                                    color="red"
                                                    rightSection={<IconChevronRight size={14} />}
                                                >
                                                    Ver
                                                </Button>
                                            </Group>

                                            <Stack gap="sm">
                                                {wishlistItems.slice(0, 3).map((item, index) => (
                                                    <Transition
                                                        key={item.id}
                                                        mounted={mounted}
                                                        transition="pop"
                                                        duration={500 + index * 100}
                                                    >
                                                        {(transitionStyles) => (
                                                            <Paper
                                                                style={transitionStyles}
                                                                p="sm"
                                                                withBorder
                                                                radius="lg"
                                                                component={Link}
                                                                href={route('services.show', item.service_id)}
                                                                className="group hover:border-red-200 hover:bg-red-50 transition-all duration-300"
                                                            >
                                                                <Group gap="sm" wrap="nowrap">
                                                                    <Avatar
                                                                        src={item.cover_url}
                                                                        radius="lg"
                                                                        size="md"
                                                                        color="red"
                                                                        className="group-hover:scale-110 transition-transform"
                                                                    >
                                                                        {item.service_name.charAt(0).toUpperCase()}
                                                                    </Avatar>
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <Text size="sm" fw={600} lineClamp={1} className="group-hover:text-red-600 transition-colors">
                                                                            {item.service_name}
                                                                        </Text>
                                                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                                                            {item.provider_name}
                                                                        </Text>
                                                                    </div>
                                                                    <Text size="sm" fw={700} c="red">
                                                                        {item.service_price}
                                                                    </Text>
                                                                </Group>
                                                            </Paper>
                                                        )}
                                                    </Transition>
                                                ))}
                                            </Stack>
                                        </Card>
                                    )}
                                </Transition>
                            )}

                            {/* Help Card */}
                            <Transition mounted={mounted} transition="slide-left" duration={800}>
                                {(styles) => (
                                    <Paper
                                        style={styles}
                                        p="lg"
                                        radius="lg"
                                        className="relative overflow-hidden"
                                        bg="linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)"
                                    >
                                        <Group gap="md" wrap="nowrap">
                                            <ThemeIcon size={50} radius="xl" variant="white" color="violet">
                                                <IconInfoCircle size={24} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700} c="dark" mb={2}>Precisa de ajuda?</Text>
                                                <Text size="xs" c="dark" opacity={0.8}>
                                                    Contacte-nos se tiver dúvidas sobre como usar a plataforma.
                                                </Text>
                                            </div>
                                        </Group>
                                        <IconGift
                                            size={60}
                                            className="absolute -right-2 -bottom-2 opacity-10"
                                        />
                                    </Paper>
                                )}
                            </Transition>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
