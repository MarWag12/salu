import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import SaluScoreBadge from '@/Components/SaluScoreBadge';
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
    RingProgress,
    Tooltip,
    Alert,
    Transition,
    Center,
    Box,
    Divider,
    ActionIcon,
    Indicator,
    rem,
} from '@mantine/core';
import {
    IconBriefcase,
    IconCheck,
    IconClock,
    IconStar,
    IconTrendingUp,
    IconAlertCircle,
    IconArrowRight,
    IconShieldCheck,
    IconFileCheck,
    IconX,
    IconReload,
    IconChevronRight,
    IconEye,
    IconMessage,
    IconUsers,
    IconSparkles,
    IconCurrencyDollar,
    IconStarFilled,
    IconFlame,
    IconTruck,
    IconAward,
    IconBulb,
    IconRocket,
    IconTarget,
    IconWallet,
    IconChartBar,
    IconBell,
    IconSettings,
    IconArrowUpRight,
    IconArrowDownRight,
    IconGift,
    IconInfoCircle,
    IconWaveSine,
    IconPlus,
    IconCalendar,
    IconMessageCircle,
    IconHeart,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';

interface Provider {
    id: number;
    display_name: string;
    is_verified: boolean;
    rating: number | null;
    total_reviews: number;
    completed_services: number;
    // Salu Score fields
    salu_score: number;
    salu_badge: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
    salu_badge_label: string;
}

interface Stats {
    total_services: number;
    published_services: number;
    pending_services: number;
    featured_services: number;
    total_orders?: number;
    pending_orders?: number;
    in_progress_orders?: number;
    completed_orders?: number;
    total_revenue?: number;
}

interface RecentOrder {
    id: number;
    reference: string;
    service_name: string;
    client_name: string;
    status: string;
    status_label: string;
    status_color: string;
    agreed_price: number;
    created_at: string;
}

interface Props {
    provider: Provider | null;
    stats: Stats;
    kyc_status: string | null;
    has_approved_kyc: boolean;
    recent_orders?: RecentOrder[];
    pending_reviews_count?: number;
}

// Componente de Card de Estatísticas Animado
function StatCard({
    title,
    value,
    icon: Icon,
    gradient,
    subtitle,
    trend,
    delay = 0,
    onClick,
}: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    gradient: { from: string; to: string; deg: number };
    subtitle?: string;
    trend?: { value: number; positive: boolean };
    delay?: number;
    onClick?: () => void;
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
                    onClick={onClick}
                >
                    {/* Background Gradient on Hover */}
                    <Box
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: `linear-gradient(${gradient.deg}deg, ${gradient.from}15, ${gradient.to}15)`,
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
                            gradient={gradient}
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

// Componente de Dica
function TipCard({ tip, icon: Icon, gradient }: {
    tip: string;
    icon: React.ComponentType<any>;
    gradient: string;
}) {
    return (
        <Paper
            p="md"
            radius="lg"
            className="relative overflow-hidden"
            style={{ background: gradient }}
        >
            <Group gap="md" wrap="nowrap">
                <ThemeIcon size={44} radius="xl" variant="white" color="indigo">
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

    const isUrgent = order.status === 'pending';

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
                    className={`group transition-all duration-300 hover:translate-x-1 ${
                        isUrgent
                            ? 'border-yellow-300 bg-yellow-50 hover:border-yellow-400 hover:shadow-md'
                            : 'hover:border-indigo-300 hover:shadow-md'
                    }`}
                >
                    <Group justify="space-between" wrap="nowrap">
                        <Group gap="md" wrap="nowrap">
                            <Indicator
                                color="yellow"
                                size={10}
                                processing
                                disabled={!isUrgent}
                            >
                                <Avatar
                                    size="lg"
                                    radius="xl"
                                    variant="gradient"
                                    gradient={isUrgent
                                        ? { from: 'yellow', to: 'orange', deg: 135 }
                                        : { from: 'indigo', to: 'cyan', deg: 135 }
                                    }
                                    className="transform transition-transform group-hover:scale-110"
                                >
                                    {order.client_name.charAt(0).toUpperCase()}
                                </Avatar>
                            </Indicator>
                            <div>
                                <Text size="sm" fw={600} lineClamp={1} className="group-hover:text-indigo-600 transition-colors">
                                    {order.service_name}
                                </Text>
                                <Group gap="xs" mt={2}>
                                    <Text size="xs" c="dimmed">
                                        {order.client_name}
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
                            <Text size="sm" fw={700} c="indigo">
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
    provider,
    stats,
    kyc_status,
    has_approved_kyc,
    recent_orders = [],
    pending_reviews_count = 0,
}: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getKycStatusInfo = (status: string | null) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Em Análise',
                    color: 'yellow',
                    icon: IconClock,
                    description: 'A sua verificação está a ser analisada pela nossa equipa.',
                    progress: 50,
                };
            case 'approved':
                return {
                    label: 'Verificado',
                    color: 'green',
                    icon: IconShieldCheck,
                    description: 'Parabéns! A sua identidade foi verificada com sucesso.',
                    progress: 100,
                };
            case 'rejected':
                return {
                    label: 'Reprovado',
                    color: 'red',
                    icon: IconX,
                    description: 'A verificação foi rejeitada. Verifique os motivos e tente novamente.',
                    progress: 0,
                };
            case 'resubmit':
                return {
                    label: 'Reenviar',
                    color: 'blue',
                    icon: IconReload,
                    description: 'É necessário reenviar os documentos para continuar.',
                    progress: 25,
                };
            default:
                return {
                    label: 'Não Iniciado',
                    color: 'gray',
                    icon: IconFileCheck,
                    description: 'Inicie a verificação de identidade para publicar serviços.',
                    progress: 0,
                };
        }
    };

    const kycInfo = getKycStatusInfo(kyc_status);
    const KycIcon = kycInfo.icon;

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const tips = [
        'Responda rapidamente às mensagens para aumentar a taxa de conversão.',
        'Adicione fotos de qualidade aos seus serviços para atrair mais clientes.',
        'Mantenha os preços competitivos e actualizados.',
        'Peça avaliações aos clientes satisfeitos para melhorar o seu perfil.',
        'Destaque os seus melhores serviços para obter mais visibilidade.',
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    const orderCompletionRate = (stats.total_orders ?? 0) > 0
        ? Math.round(((stats.completed_orders ?? 0) / (stats.total_orders ?? 1)) * 100)
        : 0;

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
                                    <Group gap="sm">
                                        <Text
                                            size="xl"
                                            fw={800}
                                            variant="gradient"
                                            gradient={{ from: 'indigo', to: 'cyan', deg: 90 }}
                                        >
                                            {provider?.display_name || 'Prestador'}
                                        </Text>
                                        {provider?.is_verified && (
                                            <Tooltip label="Perfil Verificado" position="right">
                                                <ThemeIcon size="sm" radius="xl" color="green" variant="filled">
                                                    <IconShieldCheck size={12} />
                                                </ThemeIcon>
                                            </Tooltip>
                                        )}
                                    </Group>
                                </div>
                                <Group gap="xs">
                                    <Tooltip label="Criar Serviço" position="bottom">
                                        <ActionIcon
                                            component={Link}
                                            href={route('provider.services.create')}
                                            variant="gradient"
                                            gradient={{ from: 'indigo', to: 'cyan' }}
                                            size="lg"
                                            radius="xl"
                                            disabled={!has_approved_kyc}
                                        >
                                            <IconPlus size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Notificações" position="bottom">
                                        <Indicator
                                            color="red"
                                            size={8}
                                            disabled={(stats.pending_orders ?? 0) === 0}
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
                                    <Tooltip label="Definições" position="bottom">
                                        <ActionIcon
                                            component={Link}
                                            href={route('provider.profile.edit')}
                                            variant="light"
                                            size="lg"
                                            radius="xl"
                                        >
                                            <IconSettings size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                        </div>
                    )}
                </Transition>
            }
        >
            <Head title="Dashboard - Prestador" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* KYC Alert */}
                    {!has_approved_kyc && (
                        <Transition mounted={mounted} transition="slide-down" duration={400}>
                            {(styles) => (
                                <Paper
                                    style={styles}
                                    p="lg"
                                    radius="lg"
                                    mb="xl"
                                    className="relative overflow-hidden border-2 border-yellow-300"
                                    bg="yellow.0"
                                >
                                    <Group justify="space-between" align="center" wrap="nowrap">
                                        <Group gap="md" wrap="nowrap">
                                            <ThemeIcon size={50} radius="xl" color="yellow" variant="light">
                                                <IconAlertCircle size={26} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700} size="lg" c="yellow.9">
                                                    Verificação KYC Necessária
                                                </Text>
                                                <Text size="sm" c="yellow.8">
                                                    Complete a verificação para publicar serviços e receber pagamentos.
                                                </Text>
                                            </div>
                                        </Group>
                                        <Button
                                            component={Link}
                                            href={route('provider.profile.edit')}
                                            variant="gradient"
                                            gradient={{ from: 'yellow', to: 'orange' }}
                                            rightSection={<IconArrowRight size={16} />}
                                        >
                                            {kyc_status === null ? 'Iniciar' : 'Ver Estado'}
                                        </Button>
                                    </Group>
                                    <IconShieldCheck
                                        size={100}
                                        className="absolute -right-4 -bottom-4 opacity-10 text-yellow-600"
                                    />
                                </Paper>
                            )}
                        </Transition>
                    )}

                    {/* Tip Card */}
                    <Transition mounted={mounted && has_approved_kyc} transition="fade" duration={600}>
                        {(styles) => (
                            <Box style={styles} mb="xl">
                                <TipCard
                                    tip={randomTip}
                                    icon={IconBulb}
                                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                />
                            </Box>
                        )}
                    </Transition>

                    {/* Stats Grid */}
                    <SimpleGrid cols={{ base: 2, md: 4 }} mb="xl">
                        <StatCard
                            title="Total Serviços"
                            value={stats.total_services}
                            icon={IconBriefcase}
                            gradient={{ from: '#667eea', to: '#764ba2', deg: 135 }}
                            subtitle={`${stats.published_services} publicados`}
                            delay={0}
                        />
                        <StatCard
                            title="Pedidos"
                            value={stats.total_orders ?? 0}
                            icon={IconTarget}
                            gradient={{ from: '#f093fb', to: '#f5576c', deg: 135 }}
                            subtitle={stats.pending_orders ? `${stats.pending_orders} pendente(s)` : 'Nenhum pendente'}
                            delay={100}
                        />
                        <StatCard
                            title="Concluídos"
                            value={stats.completed_orders ?? 0}
                            icon={IconAward}
                            gradient={{ from: '#4facfe', to: '#00f2fe', deg: 135 }}
                            subtitle={`${orderCompletionRate}% taxa de sucesso`}
                            delay={200}
                        />
                        <StatCard
                            title="Receita Total"
                            value={formatCurrency(stats.total_revenue ?? 0)}
                            icon={IconWallet}
                            gradient={{ from: '#43e97b', to: '#38f9d7', deg: 135 }}
                            delay={300}
                        />
                    </SimpleGrid>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Provider Profile Card */}
                            <Transition mounted={mounted} transition="slide-up" duration={500}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group justify="space-between" mb="lg">
                                            <Group gap="xs">
                                                <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                                                    <IconUsers size={18} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={700} size="lg">O Meu Perfil</Text>
                                                    <Text size="xs" c="dimmed">Informações e estatísticas</Text>
                                                </div>
                                            </Group>
                                            <Button
                                                component={Link}
                                                href={route('provider.profile.edit')}
                                                variant="subtle"
                                                size="sm"
                                                rightSection={<IconChevronRight size={14} />}
                                            >
                                                Editar
                                            </Button>
                                        </Group>

                                        {provider ? (
                                            <Group gap="xl" align="flex-start">
                                                <Box className="relative">
                                                    <Avatar
                                                        size={100}
                                                        radius="xl"
                                                        variant="gradient"
                                                        gradient={{ from: 'indigo', to: 'cyan', deg: 135 }}
                                                        className="ring-4 ring-white shadow-lg"
                                                    >
                                                        {provider.display_name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    {provider.is_verified && (
                                                        <ThemeIcon
                                                            size="md"
                                                            radius="xl"
                                                            color="green"
                                                            variant="filled"
                                                            className="absolute -bottom-1 -right-1 ring-2 ring-white"
                                                        >
                                                            <IconShieldCheck size={14} />
                                                        </ThemeIcon>
                                                    )}
                                                </Box>
                                                <div style={{ flex: 1 }}>
                                                    <Group gap="xs" mb="xs">
                                                        <Text fw={700} size="xl">{provider.display_name}</Text>
                                                        {provider.salu_score > 0 && (
                                                            <SaluScoreBadge
                                                                score={provider.salu_score}
                                                                badge={provider.salu_badge}
                                                                size="md"
                                                                showLabel
                                                            />
                                                        )}
                                                    </Group>

                                                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg" mt="md">
                                                        {[
                                                            {
                                                                icon: IconAward,
                                                                label: 'Salu Score',
                                                                value: provider.salu_score || 0,
                                                                color: provider.salu_badge === 'platinum' ? 'purple' :
                                                                       provider.salu_badge === 'gold' ? 'yellow' :
                                                                       provider.salu_badge === 'silver' ? 'gray' : 'orange',
                                                                badge: provider.salu_badge_label || 'Bronze',
                                                            },
                                                            {
                                                                icon: IconStarFilled,
                                                                label: 'Avaliação',
                                                                value: provider.rating ? `${Number(provider.rating).toFixed(1)}` : 'N/A',
                                                                color: 'yellow',
                                                            },
                                                            {
                                                                icon: IconMessageCircle,
                                                                label: 'Avaliações',
                                                                value: provider.total_reviews,
                                                                color: 'blue',
                                                            },
                                                            {
                                                                icon: IconCheck,
                                                                label: 'Concluídos',
                                                                value: provider.completed_services,
                                                                color: 'green',
                                                            },
                                                        ].map((item) => (
                                                            <Paper
                                                                key={item.label}
                                                                p="sm"
                                                                radius="lg"
                                                                withBorder
                                                                className="text-center hover:shadow-md transition-shadow"
                                                            >
                                                                <ThemeIcon
                                                                    size="md"
                                                                    radius="xl"
                                                                    color={item.color}
                                                                    variant="light"
                                                                    mx="auto"
                                                                    mb="xs"
                                                                >
                                                                    <item.icon size={14} />
                                                                </ThemeIcon>
                                                                <Text fw={800} size="xl">{item.value}</Text>
                                                                <Text size="xs" c="dimmed">{item.label}</Text>
                                                                {item.badge && (
                                                                    <Badge size="xs" color={item.color} variant="light" mt="xs">
                                                                        {item.badge}
                                                                    </Badge>
                                                                )}
                                                            </Paper>
                                                        ))}
                                                    </SimpleGrid>
                                                </div>
                                            </Group>
                                        ) : (
                                            <Paper
                                                p="xl"
                                                radius="lg"
                                                className="text-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                                }}
                                            >
                                                <ThemeIcon size={64} radius="xl" variant="light" color="gray" mb="md" mx="auto">
                                                    <IconUsers size={32} />
                                                </ThemeIcon>
                                                <Text fw={600} mb="xs">Complete o seu perfil</Text>
                                                <Text c="dimmed" size="sm" mb="md">
                                                    Adicione informações para começar a oferecer serviços
                                                </Text>
                                                <Button
                                                    component={Link}
                                                    href={route('provider.profile.edit')}
                                                    variant="gradient"
                                                    gradient={{ from: 'indigo', to: 'cyan' }}
                                                >
                                                    Completar Perfil
                                                </Button>
                                            </Paper>
                                        )}
                                    </Card>
                                )}
                            </Transition>

                            {/* Recent Orders */}
                            <Transition mounted={mounted} transition="slide-up" duration={600}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group justify="space-between" mb="lg">
                                            <Group gap="xs">
                                                <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'pink', to: 'grape' }}>
                                                    <IconTarget size={18} />
                                                </ThemeIcon>
                                                <div>
                                                    <Group gap="xs">
                                                        <Text fw={700} size="lg">Pedidos Recentes</Text>
                                                        {(stats.pending_orders ?? 0) > 0 && (
                                                            <Badge color="yellow" size="lg" variant="filled" className="animate-pulse">
                                                                {stats.pending_orders} novo(s)
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                    <Text size="xs" c="dimmed">Gerencie os seus pedidos</Text>
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

                                        {recent_orders.length === 0 ? (
                                            <Paper
                                                p="xl"
                                                radius="lg"
                                                className="text-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                                }}
                                            >
                                                <ThemeIcon size={64} radius="xl" variant="light" color="gray" mb="md" mx="auto">
                                                    <IconBriefcase size={32} />
                                                </ThemeIcon>
                                                <Text fw={600} mb="xs">Nenhum pedido ainda</Text>
                                                <Text c="dimmed" size="sm" mb="md">
                                                    Publique serviços para começar a receber pedidos
                                                </Text>
                                                <Button
                                                    component={Link}
                                                    href={route('provider.services.create')}
                                                    variant="gradient"
                                                    gradient={{ from: 'indigo', to: 'cyan' }}
                                                    leftSection={<IconPlus size={16} />}
                                                    disabled={!has_approved_kyc}
                                                >
                                                    Criar Serviço
                                                </Button>
                                            </Paper>
                                        ) : (
                                            <Stack gap="sm">
                                                {recent_orders.slice(0, 5).map((order, index) => (
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
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* KYC Status Card */}
                            <Transition mounted={mounted} transition="slide-left" duration={500}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group gap="xs" mb="lg">
                                            <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: kycInfo.color, to: kycInfo.color, deg: 135 }}>
                                                <IconShieldCheck size={18} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700} size="lg">Verificação KYC</Text>
                                                <Text size="xs" c="dimmed">Estado da sua conta</Text>
                                            </div>
                                        </Group>

                                        <Center mb="md">
                                            <RingProgress
                                                size={140}
                                                thickness={14}
                                                roundCaps
                                                sections={[{ value: kycInfo.progress, color: kycInfo.color }]}
                                                label={
                                                    <Center>
                                                        <ThemeIcon
                                                            color={kycInfo.color}
                                                            variant="light"
                                                            radius="xl"
                                                            size={60}
                                                        >
                                                            <KycIcon size={30} />
                                                        </ThemeIcon>
                                                    </Center>
                                                }
                                            />
                                        </Center>

                                        <Stack align="center" gap="xs">
                                            <Badge color={kycInfo.color} variant="light" size="lg">
                                                {kycInfo.label}
                                            </Badge>
                                            <Text size="sm" c="dimmed" ta="center">
                                                {kycInfo.description}
                                            </Text>
                                        </Stack>

                                        {!has_approved_kyc && kyc_status !== 'pending' && (
                                            <Button
                                                component={Link}
                                                href={route('provider.profile.edit')}
                                                fullWidth
                                                mt="md"
                                                variant="gradient"
                                                gradient={kyc_status === 'resubmit'
                                                    ? { from: 'blue', to: 'cyan' }
                                                    : { from: 'gray', to: 'dark' }
                                                }
                                            >
                                                {kyc_status === 'resubmit' ? 'Reenviar Documentos' : 'Iniciar Verificação'}
                                            </Button>
                                        )}
                                    </Card>
                                )}
                            </Transition>

                            {/* Quick Actions */}
                            <Transition mounted={mounted} transition="slide-left" duration={600}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group gap="xs" mb="lg">
                                            <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'teal', to: 'lime' }}>
                                                <IconRocket size={18} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700} size="lg">Acções Rápidas</Text>
                                                <Text size="xs" c="dimmed">O que pretende fazer?</Text>
                                            </div>
                                        </Group>
                                        <Stack gap="xs">
                                            {[
                                                { href: route('provider.services.create'), icon: IconPlus, label: 'Criar Serviço', color: 'indigo', gradient: { from: 'indigo', to: 'cyan' }, disabled: !has_approved_kyc },
                                                { href: route('provider.services.index'), icon: IconBriefcase, label: 'Meus Serviços', color: 'violet', gradient: { from: 'violet', to: 'grape' } },
                                                { href: route('orders.index'), icon: IconTarget, label: 'Pedidos', color: 'pink', gradient: { from: 'pink', to: 'red' }, badge: stats.pending_orders },
                                                { href: route('messages.index'), icon: IconMessage, label: 'Mensagens', color: 'teal', gradient: { from: 'teal', to: 'lime' } },
                                                { href: route('reviews.index'), icon: IconStar, label: 'Avaliações', color: 'yellow', gradient: { from: 'yellow', to: 'orange' }, badge: pending_reviews_count },
                                                { href: route('provider.earnings'), icon: IconWallet, label: 'Ganhos', color: 'green', gradient: { from: 'green', to: 'teal' } },
                                            ].map((action) => (
                                                <Button
                                                    key={action.label}
                                                    component={Link}
                                                    href={action.href}
                                                    variant="light"
                                                    color={action.color}
                                                    fullWidth
                                                    justify="flex-start"
                                                    disabled={action.disabled}
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
                                                        root: { height: rem(44) },
                                                        label: { flex: 1, textAlign: 'left' },
                                                    }}
                                                >
                                                    {action.label}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Card>
                                )}
                            </Transition>

                            {/* Services Overview */}
                            <Transition mounted={mounted} transition="slide-left" duration={700}>
                                {(styles) => (
                                    <Card style={styles} shadow="md" padding="lg" radius="lg" withBorder>
                                        <Group gap="xs" mb="lg">
                                            <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                                                <IconChartBar size={18} />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={700} size="lg">Serviços</Text>
                                                <Text size="xs" c="dimmed">Visão geral</Text>
                                            </div>
                                        </Group>

                                        <Stack gap="xs">
                                            {[
                                                { icon: IconCheck, label: 'Publicados', value: stats.published_services, color: 'green' },
                                                { icon: IconClock, label: 'Pendentes', value: stats.pending_services, color: 'yellow' },
                                                { icon: IconSparkles, label: 'Em Destaque', value: stats.featured_services, color: 'grape' },
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

                                        {stats.total_services > 0 && (
                                            <>
                                                <Divider my="md" />
                                                <div>
                                                    <Group justify="space-between" mb="xs">
                                                        <Text size="xs" c="dimmed">Taxa de publicação</Text>
                                                        <Text size="xs" fw={600}>
                                                            {Math.round((stats.published_services / stats.total_services) * 100)}%
                                                        </Text>
                                                    </Group>
                                                    <Progress
                                                        value={(stats.published_services / stats.total_services) * 100}
                                                        color="green"
                                                        size="lg"
                                                        radius="xl"
                                                        striped
                                                        animated
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </Card>
                                )}
                            </Transition>

                            {/* Performance Tips */}
                            {provider && (
                                <Transition mounted={mounted} transition="slide-left" duration={800}>
                                    {(styles) => (
                                        <Paper
                                            style={styles}
                                            p="lg"
                                            radius="lg"
                                            className="relative overflow-hidden"
                                            bg="linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)"
                                        >
                                            <Group gap="xs" mb="md">
                                                <ThemeIcon size="md" radius="xl" variant="white" color="violet">
                                                    <IconTrendingUp size={16} />
                                                </ThemeIcon>
                                                <Text fw={700} c="dark">Melhore o Desempenho</Text>
                                            </Group>

                                            <Stack gap="xs">
                                                {!provider.is_verified && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <IconShieldCheck size={14} className="text-violet-700 flex-shrink-0" />
                                                        <Text size="xs" c="dark">Verifique o perfil para mais confiança</Text>
                                                    </Group>
                                                )}
                                                {stats.published_services === 0 && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <IconBriefcase size={14} className="text-violet-700 flex-shrink-0" />
                                                        <Text size="xs" c="dark">Publique o primeiro serviço</Text>
                                                    </Group>
                                                )}
                                                {provider.total_reviews < 5 && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <IconStar size={14} className="text-violet-700 flex-shrink-0" />
                                                        <Text size="xs" c="dark">Incentive clientes a avaliar</Text>
                                                    </Group>
                                                )}
                                                {stats.featured_services === 0 && stats.published_services > 0 && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <IconSparkles size={14} className="text-violet-700 flex-shrink-0" />
                                                        <Text size="xs" c="dark">Destaque serviços para visibilidade</Text>
                                                    </Group>
                                                )}
                                            </Stack>
                                            <IconGift
                                                size={60}
                                                className="absolute -right-2 -bottom-2 opacity-10"
                                            />
                                        </Paper>
                                    )}
                                </Transition>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
