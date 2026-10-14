import { Head, Link } from '@inertiajs/react';
import {
    Container,
    Card,
    Text,
    Group,
    Stack,
    Badge,
    Avatar,
    Grid,
    Progress,
    Divider,
    Paper,
    SimpleGrid,
    ThemeIcon,
    Pagination,
    Button,
    Box,
    Image,
    Tooltip,
    Transition,
    RingProgress,
    Title,
    rem,
    Tabs,
    Spoiler,
    Skeleton,
} from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useState, useRef, useEffect } from 'react';
import {
    IconStar,
    IconStarFilled,
    IconCheck,
    IconCalendar,
    IconBriefcase,
    IconMessageCircle,
    IconShieldCheck,
    IconUser,
    IconClock,
    IconMapPin,
    IconPhone,
    IconBrandWhatsapp,
    IconMail,
    IconTrendingUp,
    IconAward,
    IconHeart,
    IconEye,
    IconChevronRight,
    IconSparkles,
    IconUserCircle,
} from '@tabler/icons-react';
import PublicLayout from '@/Layouts/PublicLayout';

interface Provider {
    id: number;
    display_name: string;
    description: string | null;
    avatar: string | null;
    is_verified: boolean;
    rating: number;
    total_reviews: number;
    completed_services: number;
    member_since: string;
    years_active: number;
    working_hours: any;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    location?: string | null;
}

interface Service {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    image: string | null;
    rating: number;
    reviews_count: number;
    is_featured?: boolean;
}

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    reviewer_name: string;
    reviewer_avatar: string | null;
    is_verified: boolean;
    is_anonymous: boolean;
    service_name: string;
    provider_response: string | null;
    provider_responded_at: string | null;
    created_at: string;
    created_at_human: string;
}

interface Stats {
    total_reviews: number;
    average_rating: number;
    completed_services: number;
    published_services: number;
    verified_reviews: number;
    reviews_with_comments: number;
    response_rate: number;
}

interface RatingDistribution {
    distribution: { [key: number]: number };
    total: number;
    percentages: { [key: number]: number };
}

interface PaginatedReviews {
    data: Review[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    provider: Provider;
    services: Service[];
    stats: Stats;
    reviews: PaginatedReviews;
    ratingDistribution: RatingDistribution;
}

export default function PublicProfile({
    provider,
    services,
    stats,
    reviews,
    ratingDistribution,
}: Props) {
    const [activeTab, setActiveTab] = useState<string | null>('services');
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { ref: headerRef, entry: headerEntry } = useIntersection({
        threshold: 0.5,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const renderStars = (rating: number, size: number = 16) => {
        return (
            <Group gap={2}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStarFilled
                        key={star}
                        size={size}
                        style={{
                            color: star <= rating ? '#fab005' : '#dee2e6',
                            transition: 'transform 0.2s ease',
                        }}
                        className="hover:scale-110"
                    />
                ))}
            </Group>
        );
    };

    const formatWhatsAppLink = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        return `https://wa.me/${cleaned}`;
    };

    const getRatingLabel = (rating: number) => {
        if (rating >= 4.5) return 'Excelente';
        if (rating >= 4) return 'Muito Bom';
        if (rating >= 3.5) return 'Bom';
        if (rating >= 3) return 'Razoável';
        return 'Em desenvolvimento';
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4.5) return 'teal';
        if (rating >= 4) return 'green';
        if (rating >= 3.5) return 'lime';
        if (rating >= 3) return 'yellow';
        return 'orange';
    };

    return (
        <PublicLayout>
            <Head title={`${provider.display_name} - Perfil do Prestador`} />

            {/* Hero Section with Gradient Background */}
            <Box
                ref={headerRef}
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative Elements */}
                <Box
                    style={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                    }}
                />
                <Box
                    style={{
                        position: 'absolute',
                        bottom: -30,
                        left: '20%',
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                    }}
                />

                <Container size="lg" py={60}>
                    <Transition mounted={mounted} transition="fade-up" duration={500}>
                        {(styles) => (
                            <Group align="flex-start" wrap="wrap" gap="xl" style={styles}>
                                {/* Avatar with Ring Progress */}
                                <Box style={{ position: 'relative' }}>
                                    <RingProgress
                                        size={160}
                                        thickness={6}
                                        roundCaps
                                        sections={[
                                            { value: (stats.average_rating / 5) * 100, color: 'yellow' },
                                        ]}
                                        label={
                                            <Avatar
                                                src={provider.avatar}
                                                size={140}
                                                radius={140}
                                                mx="auto"
                                                color="white"
                                                style={{
                                                    border: '4px solid white',
                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                <Text size="3rem" c="violet">
                                                    {provider.display_name.charAt(0).toUpperCase()}
                                                </Text>
                                            </Avatar>
                                        }
                                    />
                                    {provider.is_verified && (
                                        <Tooltip label="Prestador Verificado" withArrow>
                                            <ThemeIcon
                                                size={40}
                                                radius="xl"
                                                color="green"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 10,
                                                    right: 10,
                                                    border: '3px solid white',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                <IconShieldCheck size={22} />
                                            </ThemeIcon>
                                        </Tooltip>
                                    )}
                                </Box>

                                {/* Provider Info */}
                                <Stack gap="xs" style={{ flex: 1, minWidth: 280 }}>
                                    <Group gap="md" align="center">
                                        <Title order={1} c="white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                            {provider.display_name}
                                        </Title>
                                    </Group>

                                    {/* Rating Badge */}
                                    <Group gap="md">
                                        <Paper
                                            px="md"
                                            py="xs"
                                            radius="xl"
                                            style={{
                                                background: 'rgba(255,255,255,0.95)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                        >
                                            <Group gap="xs">
                                                <IconStarFilled size={20} color="#fab005" />
                                                <Text fw={700} size="lg">
                                                    {stats.average_rating.toFixed(1)}
                                                </Text>
                                                <Divider orientation="vertical" />
                                                <Text size="sm" c="dimmed">
                                                    {stats.total_reviews} avaliações
                                                </Text>
                                            </Group>
                                        </Paper>
                                        <Badge
                                            size="lg"
                                            variant="white"
                                            color={getRatingColor(stats.average_rating)}
                                            leftSection={<IconAward size={14} />}
                                        >
                                            {getRatingLabel(stats.average_rating)}
                                        </Badge>
                                    </Group>

                                    {provider.description && (
                                        <Text c="white" size="md" maw={600} style={{ opacity: 0.9 }}>
                                            {provider.description}
                                        </Text>
                                    )}

                                    {/* Quick Stats */}
                                    <Group gap="xl" mt="md">
                                        <Tooltip label="Anos de experiência">
                                            <Group gap="xs" style={{ cursor: 'default' }}>
                                                <ThemeIcon size="md" variant="white" color="violet" radius="xl">
                                                    <IconCalendar size={16} />
                                                </ThemeIcon>
                                                <Text c="white" fw={500}>
                                                    Desde {provider.member_since}
                                                </Text>
                                            </Group>
                                        </Tooltip>
                                        <Tooltip label="Serviços concluídos">
                                            <Group gap="xs" style={{ cursor: 'default' }}>
                                                <ThemeIcon size="md" variant="white" color="violet" radius="xl">
                                                    <IconBriefcase size={16} />
                                                </ThemeIcon>
                                                <Text c="white" fw={500}>
                                                    {stats.completed_services} concluídos
                                                </Text>
                                            </Group>
                                        </Tooltip>
                                        <Tooltip label="Taxa de resposta">
                                            <Group gap="xs" style={{ cursor: 'default' }}>
                                                <ThemeIcon size="md" variant="white" color="violet" radius="xl">
                                                    <IconMessageCircle size={16} />
                                                </ThemeIcon>
                                                <Text c="white" fw={500}>
                                                    {stats.response_rate}% resposta
                                                </Text>
                                            </Group>
                                        </Tooltip>
                                    </Group>

                                    {/* Contact Buttons */}
                                    <Group mt="md">
                                        {provider.whatsapp && (
                                            <Button
                                                component="a"
                                                href={formatWhatsAppLink(provider.whatsapp)}
                                                target="_blank"
                                                leftSection={<IconBrandWhatsapp size={18} />}
                                                color="green"
                                                variant="white"
                                                radius="xl"
                                                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                            >
                                                WhatsApp
                                            </Button>
                                        )}
                                        {provider.phone && (
                                            <Button
                                                component="a"
                                                href={`tel:${provider.phone}`}
                                                leftSection={<IconPhone size={18} />}
                                                variant="white"
                                                color="violet"
                                                radius="xl"
                                                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                            >
                                                Ligar
                                            </Button>
                                        )}
                                        <Button
                                            component={Link}
                                            href={route('reviews.create-provider', provider.id)}
                                            leftSection={<IconStar size={18} />}
                                            variant="white"
                                            color="yellow"
                                            radius="xl"
                                            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                        >
                                            Avaliar Prestador
                                        </Button>
                                    </Group>
                                </Stack>
                            </Group>
                        )}
                    </Transition>
                </Container>
            </Box>

            {/* Stats Cards */}
            <Container size="lg" mt={-30} mb="xl" ref={containerRef}>
                <Transition mounted={mounted} transition="slide-up" duration={600} timingFunction="ease">
                    {(styles) => (
                        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" style={styles}>
                            <Paper
                                p="lg"
                                radius="lg"
                                shadow="md"
                                style={{
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                                className="hover:shadow-lg hover:-translate-y-1"
                            >
                                <Group justify="space-between" align="flex-start">
                                    <div>
                                        <Text c="dimmed" size="xs" tt="uppercase" fw={600}>
                                            Avaliação
                                        </Text>
                                        <Text fw={700} size="xl">
                                            {stats.average_rating.toFixed(1)}
                                        </Text>
                                    </div>
                                    <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                                        <IconStarFilled size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Progress value={(stats.average_rating / 5) * 100} color="yellow" size="sm" mt="md" radius="xl" />
                            </Paper>

                            <Paper
                                p="lg"
                                radius="lg"
                                shadow="md"
                                style={{
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                                className="hover:shadow-lg hover:-translate-y-1"
                            >
                                <Group justify="space-between" align="flex-start">
                                    <div>
                                        <Text c="dimmed" size="xs" tt="uppercase" fw={600}>
                                            Avaliações
                                        </Text>
                                        <Text fw={700} size="xl">
                                            {stats.total_reviews}
                                        </Text>
                                    </div>
                                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                                        <IconMessageCircle size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text size="xs" c="dimmed" mt="md">
                                    {stats.verified_reviews} verificadas
                                </Text>
                            </Paper>

                            <Paper
                                p="lg"
                                radius="lg"
                                shadow="md"
                                style={{
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                                className="hover:shadow-lg hover:-translate-y-1"
                            >
                                <Group justify="space-between" align="flex-start">
                                    <div>
                                        <Text c="dimmed" size="xs" tt="uppercase" fw={600}>
                                            Concluídos
                                        </Text>
                                        <Text fw={700} size="xl">
                                            {stats.completed_services}
                                        </Text>
                                    </div>
                                    <ThemeIcon size="lg" radius="md" variant="light" color="green">
                                        <IconCheck size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text size="xs" c="dimmed" mt="md">
                                    serviços entregues
                                </Text>
                            </Paper>

                            <Paper
                                p="lg"
                                radius="lg"
                                shadow="md"
                                style={{
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                                className="hover:shadow-lg hover:-translate-y-1"
                            >
                                <Group justify="space-between" align="flex-start">
                                    <div>
                                        <Text c="dimmed" size="xs" tt="uppercase" fw={600}>
                                            Resposta
                                        </Text>
                                        <Text fw={700} size="xl">
                                            {stats.response_rate}%
                                        </Text>
                                    </div>
                                    <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                                        <IconTrendingUp size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Progress value={stats.response_rate} color="violet" size="sm" mt="md" radius="xl" />
                            </Paper>
                        </SimpleGrid>
                    )}
                </Transition>
            </Container>

            {/* Main Content with Tabs */}
            <Container size="lg" pb="xl">
                <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="xl">
                    <Tabs.List mb="xl" style={{ background: '#f8f9fa', padding: 8, borderRadius: 50 }}>
                        <Tabs.Tab
                            value="services"
                            leftSection={<IconBriefcase size={16} />}
                            style={{ borderRadius: 50 }}
                        >
                            Serviços ({services.length})
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="reviews"
                            leftSection={<IconStar size={16} />}
                            style={{ borderRadius: 50 }}
                        >
                            Avaliações ({reviews.total})
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="about"
                            leftSection={<IconUserCircle size={16} />}
                            style={{ borderRadius: 50 }}
                        >
                            Sobre
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Services Tab */}
                    <Tabs.Panel value="services">
                        {services.length === 0 ? (
                            <Paper p="xl" ta="center" bg="gray.0" radius="lg">
                                <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                    <IconBriefcase size={30} />
                                </ThemeIcon>
                                <Text c="dimmed" size="lg">
                                    Este prestador ainda não publicou serviços.
                                </Text>
                            </Paper>
                        ) : (
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                                {services.map((service, index) => (
                                    <Transition
                                        key={service.id}
                                        mounted={mounted}
                                        transition="fade-up"
                                        duration={400}
                                        timingFunction="ease"
                                    >
                                        {(styles) => (
                                            <Card
                                                component={Link}
                                                href={route('services.show', service.id)}
                                                shadow="sm"
                                                padding={0}
                                                radius="lg"
                                                withBorder
                                                style={{
                                                    ...styles,
                                                    transitionDelay: `${index * 100}ms`,
                                                    overflow: 'hidden',
                                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                }}
                                                className="hover:shadow-xl hover:-translate-y-2 no-underline"
                                            >
                                                <Box pos="relative">
                                                    <Image
                                                        src={service.image || '/images/placeholder-service.jpg'}
                                                        height={160}
                                                        alt={service.name}
                                                        fallbackSrc="https://placehold.co/400x200?text=Serviço"
                                                    />
                                                    {service.is_featured && (
                                                        <Badge
                                                            pos="absolute"
                                                            top={12}
                                                            left={12}
                                                            variant="filled"
                                                            color="yellow"
                                                            leftSection={<IconSparkles size={12} />}
                                                        >
                                                            Destaque
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        pos="absolute"
                                                        top={12}
                                                        right={12}
                                                        variant="filled"
                                                        color="dark"
                                                        style={{ backdropFilter: 'blur(4px)' }}
                                                    >
                                                        {service.price}
                                                    </Badge>
                                                </Box>

                                                <Stack gap="xs" p="md">
                                                    <Text fw={600} lineClamp={1} size="lg">
                                                        {service.name}
                                                    </Text>
                                                    {service.description && (
                                                        <Text size="sm" c="dimmed" lineClamp={2}>
                                                            {service.description}
                                                        </Text>
                                                    )}
                                                    <Group justify="space-between" mt="xs">
                                                        <Group gap={4}>
                                                            <IconStarFilled size={16} color="#fab005" />
                                                            <Text fw={600}>{service.rating.toFixed(1)}</Text>
                                                            <Text size="sm" c="dimmed">
                                                                ({service.reviews_count})
                                                            </Text>
                                                        </Group>
                                                        <Button
                                                            variant="light"
                                                            size="xs"
                                                            radius="xl"
                                                            rightSection={<IconChevronRight size={14} />}
                                                        >
                                                            Ver
                                                        </Button>
                                                    </Group>
                                                </Stack>
                                            </Card>
                                        )}
                                    </Transition>
                                ))}
                            </SimpleGrid>
                        )}
                    </Tabs.Panel>

                    {/* Reviews Tab */}
                    <Tabs.Panel value="reviews">
                        <Grid gutter="xl">
                            {/* Rating Distribution */}
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Card shadow="sm" padding="lg" radius="lg" withBorder h="100%">
                                    <Stack align="center" mb="lg">
                                        <Text size="4rem" fw={700} lh={1} c="dark">
                                            {stats.average_rating.toFixed(1)}
                                        </Text>
                                        {renderStars(Math.round(stats.average_rating), 28)}
                                        <Text size="sm" c="dimmed">
                                            Baseado em {stats.total_reviews} avaliações
                                        </Text>
                                    </Stack>

                                    <Stack gap="sm">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const percentage = ratingDistribution.percentages[rating] || 0;
                                            const count = ratingDistribution.distribution[rating] || 0;
                                            return (
                                                <Tooltip key={rating} label={`${count} avaliações`} withArrow>
                                                    <Group gap="xs" style={{ cursor: 'default' }}>
                                                        <Text size="sm" w={16} fw={500}>{rating}</Text>
                                                        <IconStarFilled size={14} color="#fab005" />
                                                        <Progress
                                                            value={percentage}
                                                            size="lg"
                                                            color="yellow"
                                                            radius="xl"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <Text size="sm" c="dimmed" w={35} ta="right">
                                                            {percentage.toFixed(0)}%
                                                        </Text>
                                                    </Group>
                                                </Tooltip>
                                            );
                                        })}
                                    </Stack>

                                    <Divider my="lg" />

                                    <SimpleGrid cols={2} spacing="md">
                                        <Paper p="md" bg="green.0" radius="md" ta="center">
                                            <Text size="xl" fw={700} c="green">
                                                {stats.verified_reviews}
                                            </Text>
                                            <Text size="xs" c="dimmed">Verificadas</Text>
                                        </Paper>
                                        <Paper p="md" bg="blue.0" radius="md" ta="center">
                                            <Text size="xl" fw={700} c="blue">
                                                {stats.reviews_with_comments}
                                            </Text>
                                            <Text size="xs" c="dimmed">Com comentário</Text>
                                        </Paper>
                                    </SimpleGrid>
                                </Card>
                            </Grid.Col>

                            {/* Reviews List */}
                            <Grid.Col span={{ base: 12, md: 8 }}>
                                {reviews.data.length === 0 ? (
                                    <Paper p="xl" ta="center" bg="gray.0" radius="lg">
                                        <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                            <IconStar size={30} />
                                        </ThemeIcon>
                                        <Text c="dimmed" size="lg">
                                            Este prestador ainda não tem avaliações.
                                        </Text>
                                        <Text size="sm" c="dimmed" mt="xs">
                                            Seja o primeiro a avaliar após contratar um serviço!
                                        </Text>
                                    </Paper>
                                ) : (
                                    <Stack gap="md">
                                        {reviews.data.map((review, index) => (
                                            <Transition
                                                key={review.id}
                                                mounted={mounted}
                                                transition="fade-left"
                                                duration={400}
                                            >
                                                {(styles) => (
                                                    <Paper
                                                        p="lg"
                                                        radius="lg"
                                                        withBorder
                                                        style={{
                                                            ...styles,
                                                            transitionDelay: `${index * 50}ms`,
                                                            transition: 'box-shadow 0.2s ease',
                                                        }}
                                                        className="hover:shadow-md"
                                                    >
                                                        <Group justify="space-between" mb="md" wrap="nowrap">
                                                            <Group gap="sm" wrap="nowrap">
                                                                <Avatar
                                                                    src={review.reviewer_avatar}
                                                                    size={50}
                                                                    radius="xl"
                                                                    color="blue"
                                                                >
                                                                    {review.is_anonymous ? (
                                                                        <IconUser size={24} />
                                                                    ) : (
                                                                        review.reviewer_name.charAt(0).toUpperCase()
                                                                    )}
                                                                </Avatar>
                                                                <div>
                                                                    <Group gap="xs">
                                                                        <Text fw={600}>
                                                                            {review.reviewer_name}
                                                                        </Text>
                                                                        {review.is_verified && (
                                                                            <Tooltip label="Compra Verificada">
                                                                                <Badge
                                                                                    size="xs"
                                                                                    color="green"
                                                                                    variant="filled"
                                                                                    leftSection={<IconCheck size={10} />}
                                                                                >
                                                                                    Verificado
                                                                                </Badge>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Group>
                                                                    <Text size="xs" c="dimmed">
                                                                        {review.service_name} • {review.created_at_human}
                                                                    </Text>
                                                                </div>
                                                            </Group>
                                                            <Stack gap={4} align="flex-end">
                                                                {renderStars(review.rating, 18)}
                                                            </Stack>
                                                        </Group>

                                                        {review.comment && (
                                                            <Spoiler maxHeight={80} showLabel="Ver mais" hideLabel="Ver menos">
                                                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                                    {review.comment}
                                                                </Text>
                                                            </Spoiler>
                                                        )}

                                                        {review.provider_response && (
                                                            <Paper p="md" bg="violet.0" radius="md" mt="md">
                                                                <Group gap="xs" mb="xs">
                                                                    <Avatar size="sm" color="violet" radius="xl">
                                                                        {provider.display_name.charAt(0)}
                                                                    </Avatar>
                                                                    <Text size="sm" fw={600} c="violet">
                                                                        Resposta de {provider.display_name}
                                                                    </Text>
                                                                    {review.provider_responded_at && (
                                                                        <Text size="xs" c="dimmed">
                                                                            • {review.provider_responded_at}
                                                                        </Text>
                                                                    )}
                                                                </Group>
                                                                <Text size="sm">{review.provider_response}</Text>
                                                            </Paper>
                                                        )}
                                                    </Paper>
                                                )}
                                            </Transition>
                                        ))}

                                        {reviews.last_page > 1 && (
                                            <Group justify="center" mt="xl">
                                                <Pagination
                                                    total={reviews.last_page}
                                                    value={reviews.current_page}
                                                    onChange={(page) => {
                                                        window.location.href = `${window.location.pathname}?page=${page}`;
                                                    }}
                                                    radius="xl"
                                                    withEdges
                                                />
                                            </Group>
                                        )}
                                    </Stack>
                                )}
                            </Grid.Col>
                        </Grid>
                    </Tabs.Panel>

                    {/* About Tab */}
                    <Tabs.Panel value="about">
                        <Grid gutter="xl">
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Card shadow="sm" padding="lg" radius="lg" withBorder h="100%">
                                    <Group mb="lg">
                                        <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                                            <IconUserCircle size={20} />
                                        </ThemeIcon>
                                        <Text fw={600} size="lg">Sobre o Prestador</Text>
                                    </Group>

                                    {provider.description ? (
                                        <Text style={{ whiteSpace: 'pre-wrap' }}>
                                            {provider.description}
                                        </Text>
                                    ) : (
                                        <Text c="dimmed" ta="center" py="xl">
                                            Este prestador ainda não adicionou uma descrição.
                                        </Text>
                                    )}

                                    <Divider my="lg" />

                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <IconCalendar size={18} className="text-gray-500" />
                                                <Text size="sm">Membro desde</Text>
                                            </Group>
                                            <Text fw={600}>{provider.member_since}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <IconClock size={18} className="text-gray-500" />
                                                <Text size="sm">Anos de experiência</Text>
                                            </Group>
                                            <Text fw={600}>{provider.years_active} anos</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <IconBriefcase size={18} className="text-gray-500" />
                                                <Text size="sm">Serviços publicados</Text>
                                            </Group>
                                            <Text fw={600}>{stats.published_services}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <IconCheck size={18} className="text-gray-500" />
                                                <Text size="sm">Serviços concluídos</Text>
                                            </Group>
                                            <Text fw={600}>{stats.completed_services}</Text>
                                        </Group>
                                    </Stack>
                                </Card>
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Card shadow="sm" padding="lg" radius="lg" withBorder h="100%">
                                    <Group mb="lg">
                                        <ThemeIcon size="lg" radius="md" variant="light" color="green">
                                            <IconPhone size={20} />
                                        </ThemeIcon>
                                        <Text fw={600} size="lg">Contacto</Text>
                                    </Group>

                                    <Stack gap="lg">
                                        {provider.location && (
                                            <Group gap="md">
                                                <ThemeIcon size="xl" radius="md" variant="light" color="gray">
                                                    <IconMapPin size={22} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text size="xs" c="dimmed">Localização</Text>
                                                    <Text fw={500}>{provider.location}</Text>
                                                </div>
                                            </Group>
                                        )}

                                        {provider.phone && (
                                            <Group gap="md">
                                                <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                                    <IconPhone size={22} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text size="xs" c="dimmed">Telefone</Text>
                                                    <Text
                                                        fw={500}
                                                        component="a"
                                                        href={`tel:${provider.phone}`}
                                                        className="text-blue-600 no-underline hover:underline"
                                                    >
                                                        {provider.phone}
                                                    </Text>
                                                </div>
                                            </Group>
                                        )}

                                        {provider.whatsapp && (
                                            <Group gap="md">
                                                <ThemeIcon size="xl" radius="md" variant="light" color="green">
                                                    <IconBrandWhatsapp size={22} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text size="xs" c="dimmed">WhatsApp</Text>
                                                    <Text
                                                        fw={500}
                                                        component="a"
                                                        href={formatWhatsAppLink(provider.whatsapp)}
                                                        target="_blank"
                                                        className="text-green-600 no-underline hover:underline"
                                                    >
                                                        Enviar mensagem
                                                    </Text>
                                                </div>
                                            </Group>
                                        )}

                                        {provider.email && (
                                            <Group gap="md">
                                                <ThemeIcon size="xl" radius="md" variant="light" color="violet">
                                                    <IconMail size={22} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text size="xs" c="dimmed">Email</Text>
                                                    <Text
                                                        fw={500}
                                                        component="a"
                                                        href={`mailto:${provider.email}`}
                                                        className="text-violet-600 no-underline hover:underline"
                                                    >
                                                        {provider.email}
                                                    </Text>
                                                </div>
                                            </Group>
                                        )}

                                        {!provider.location && !provider.phone && !provider.whatsapp && !provider.email && (
                                            <Text c="dimmed" ta="center" py="xl">
                                                Informações de contacto não disponíveis.
                                            </Text>
                                        )}
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        </Grid>
                    </Tabs.Panel>
                </Tabs>
            </Container>
        </PublicLayout>
    );
}
