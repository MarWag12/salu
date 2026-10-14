import { Head, Link } from '@inertiajs/react';
import {
    Container,
    Title,
    Text,
    Button,
    Card,
    Group,
    Badge,
    SimpleGrid,
    Image,
    Stack,
    Box,
    ThemeIcon,
    Paper,
    Flex,
    TextInput,
    rem,
    Transition,
    Avatar,
    Tooltip,
    Overlay,
} from '@mantine/core';
import {
    IconSearch,
    IconStar,
    IconUsers,
    IconCategory,
    IconBriefcase,
    IconArrowRight,
    IconSparkles,
    IconShieldCheck,
    IconClock,
    IconHeart,
} from '@tabler/icons-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useState, useEffect } from 'react';

interface Service {
    id: number;
    title: string;
    slug: string;
    description: string;
    price: number;
    price_type: string;
    category: string | null;
    provider: string | null;
    image: string | null;
    rating: number;
    reviews_count: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    services_count: number;
}

interface Stats {
    total_services: number;
    total_providers: number;
    total_categories: number;
}

interface Props {
    featuredServices: Service[];
    recentServices: Service[];
    categories: Category[];
    stats: Stats;
}

const formatPrice = (price: number, priceType: string) => {
    const formatted = new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        minimumFractionDigits: 0,
    }).format(price);

    switch (priceType) {
        case 'hourly':
            return `${formatted}/hora`;
        case 'daily':
            return `${formatted}/dia`;
        case 'project':
            return `A partir de ${formatted}`;
        default:
            return formatted;
    }
};

function ServiceCard({ service, featured = false }: { service: Service; featured?: boolean }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            shadow={isHovered ? 'xl' : 'sm'}
            padding="lg"
            radius="lg"
            withBorder
            component={Link}
            href={route('services.show', service.slug)}
            className="no-underline"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                borderColor: isHovered ? 'var(--mantine-color-blue-4)' : undefined,
            }}
        >
            <Card.Section pos="relative" style={{ overflow: 'hidden' }}>
                <Image
                    src={service.image || '/images/placeholder-service.jpg'}
                    height={180}
                    alt={service.title}
                    fallbackSrc="https://placehold.co/400x200?text=Serviço"
                    style={{
                        transition: 'transform 0.5s ease',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    }}
                />
                {featured && (
                    <Badge
                        pos="absolute"
                        top={12}
                        left={12}
                        variant="gradient"
                        gradient={{ from: 'yellow', to: 'orange', deg: 90 }}
                        leftSection={<IconSparkles size={12} />}
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    >
                        Destaque
                    </Badge>
                )}
                <Box
                    pos="absolute"
                    top={12}
                    right={12}
                    style={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                    }}
                >
                    <Tooltip label="Guardar">
                        <ThemeIcon
                            variant="white"
                            size="lg"
                            radius="xl"
                            style={{ cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                        >
                            <IconHeart size={18} />
                        </ThemeIcon>
                    </Tooltip>
                </Box>
                {isHovered && (
                    <Overlay
                        gradient="linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 50%)"
                        opacity={1}
                        zIndex={1}
                    />
                )}
            </Card.Section>

            <Stack gap="xs" mt="md">
                {service.category && (
                    <Badge variant="light" color="blue" size="sm" radius="sm">
                        {service.category}
                    </Badge>
                )}

                <Text fw={600} size="lg" lineClamp={2} style={{ lineHeight: 1.3 }}>
                    {service.title}
                </Text>

                <Text size="sm" c="dimmed" lineClamp={2}>
                    {service.description}
                </Text>

                <Group gap={8} mt={4}>
                    <Group gap={4}>
                        <IconStar size={16} fill="var(--mantine-color-yellow-5)" color="var(--mantine-color-yellow-5)" />
                        <Text size="sm" fw={600}>
                            {Number(service.rating).toFixed(1)}
                        </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                        ({service.reviews_count} avaliações)
                    </Text>
                </Group>

                <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Box>
                        <Text size="xs" c="dimmed">A partir de</Text>
                        <Text fw={700} size="xl" c="blue" style={{ lineHeight: 1.2 }}>
                            {formatPrice(service.price, service.price_type)}
                        </Text>
                    </Box>
                    <Avatar color="blue" radius="xl" size="sm">
                        {service.provider?.charAt(0).toUpperCase() || 'P'}
                    </Avatar>
                </Group>
            </Stack>
        </Card>
    );
}

function CategoryCard({ category }: { category: Category }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            shadow={isHovered ? 'lg' : 'sm'}
            padding="xl"
            radius="lg"
            withBorder
            component={Link}
            href={route('services.index', { category: category.slug })}
            className="no-underline text-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                background: isHovered ? 'linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-cyan-0) 100%)' : undefined,
            }}
        >
            <ThemeIcon
                size={70}
                radius="xl"
                variant={isHovered ? 'gradient' : 'light'}
                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                color="blue"
                mx="auto"
                style={{
                    transition: 'all 0.3s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
            >
                <IconCategory size={32} />
            </ThemeIcon>
            <Text fw={600} size="lg" mt="lg">
                {category.name}
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
                {category.services_count} {category.services_count === 1 ? 'serviço' : 'serviços'}
            </Text>
        </Card>
    );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <Paper
            p="xl"
            radius="lg"
            style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
            }}
        >
            <Group gap="md">
                <ThemeIcon size={50} radius="xl" variant="white" color="blue">
                    {icon}
                </ThemeIcon>
                <Box>
                    <Text size="2rem" fw={800} c="white" style={{ lineHeight: 1 }}>
                        {value}
                    </Text>
                    <Text size="sm" c="rgba(255,255,255,0.8)">
                        {label}
                    </Text>
                </Box>
            </Group>
        </Paper>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <Group align="flex-start" gap="md">
            <ThemeIcon size={50} radius="md" variant="light" color="blue">
                {icon}
            </ThemeIcon>
            <Box>
                <Text fw={600} size="lg">{title}</Text>
                <Text size="sm" c="dimmed" mt={4}>{description}</Text>
            </Box>
        </Group>
    );
}

export default function Home({ featuredServices, recentServices, categories, stats }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = route('services.index', { search: searchQuery });
        }
    };

    return (
        <PublicLayout>
            <Head title="Salu - Marketplace de Serviços de Angola" />

            {/* Hero Section */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #1a365d 0%, #2563eb 50%, #0891b2 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    marginTop: '-1rem',
                    marginLeft: '-1rem',
                    marginRight: '-1rem',
                }}
            >
                {/* Background Pattern */}
                <Box
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        opacity: 0.5,
                    }}
                />

                <Container size="xl" py={80} style={{ position: 'relative', zIndex: 1 }}>
                    <Transition mounted={mounted} transition="fade-up" duration={600}>
                        {(styles) => (
                            <Stack align="center" gap="xl" style={styles}>
                                <Badge
                                    size="lg"
                                    variant="gradient"
                                    gradient={{ from: 'yellow', to: 'orange' }}
                                    leftSection={<IconSparkles size={14} />}
                                >
                                    O maior marketplace de serviços de Angola
                                </Badge>

                                <Title
                                    order={1}
                                    ta="center"
                                    c="white"
                                    style={{
                                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                                        fontWeight: 900,
                                        lineHeight: 1.2,
                                        maxWidth: 800,
                                    }}
                                >
                                    Encontre os Melhores{' '}
                                    <Text
                                        component="span"
                                        inherit
                                        variant="gradient"
                                        gradient={{ from: 'cyan', to: 'yellow', deg: 90 }}
                                    >
                                        Profissionais
                                    </Text>{' '}
                                    para o Seu Projecto
                                </Title>

                                <Text
                                    size="xl"
                                    ta="center"
                                    c="rgba(255,255,255,0.9)"
                                    maw={600}
                                    style={{ lineHeight: 1.6 }}
                                >
                                    De reparações domésticas a serviços empresariais, conectamos-lo aos melhores profissionais verificados em Angola.
                                </Text>

                                <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 650 }}>
                                    <Paper
                                        radius="xl"
                                        p={6}
                                        shadow="xl"
                                        style={{
                                            background: 'white',
                                        }}
                                    >
                                        <Flex gap="xs" align="center">
                                            <TextInput
                                                placeholder="O que procura? Ex: Electricista, Designer..."
                                                leftSection={<IconSearch size={22} color="var(--mantine-color-gray-5)" />}
                                                size="xl"
                                                radius="xl"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{ flex: 1 }}
                                                styles={{
                                                    input: {
                                                        border: 'none',
                                                        fontSize: rem(16),
                                                    },
                                                }}
                                            />
                                            <Button
                                                type="submit"
                                                size="xl"
                                                radius="xl"
                                                px={32}
                                                variant="gradient"
                                                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                            >
                                                Pesquisar
                                            </Button>
                                        </Flex>
                                    </Paper>
                                </form>

                                {/* Quick Links */}
                                <Group gap="xs" mt="md">
                                    <Text size="sm" c="rgba(255,255,255,0.7)">Popular:</Text>
                                    {['Electricista', 'Canalizador', 'Designer', 'Programador'].map((term) => (
                                        <Badge
                                            key={term}
                                            variant="outline"
                                            color="white"
                                            size="lg"
                                            radius="xl"
                                            component={Link}
                                            href={route('services.index', { search: term })}
                                            style={{ cursor: 'pointer', borderColor: 'rgba(255,255,255,0.4)' }}
                                        >
                                            {term}
                                        </Badge>
                                    ))}
                                </Group>

                                {/* Stats */}
                                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mt={40} w="100%" maw={800}>
                                    <StatCard
                                        icon={<IconBriefcase size={24} />}
                                        value={`${stats.total_services}+`}
                                        label="Serviços Disponíveis"
                                    />
                                    <StatCard
                                        icon={<IconUsers size={24} />}
                                        value={`${stats.total_providers}+`}
                                        label="Profissionais Verificados"
                                    />
                                    <StatCard
                                        icon={<IconCategory size={24} />}
                                        value={`${stats.total_categories}`}
                                        label="Categorias"
                                    />
                                </SimpleGrid>
                            </Stack>
                        )}
                    </Transition>
                </Container>

                {/* Wave Divider */}
                <Box
                    style={{
                        position: 'absolute',
                        bottom: -2,
                        left: 0,
                        right: 0,
                    }}
                >
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                            fill="var(--mantine-color-gray-0)"
                        />
                    </svg>
                </Box>
            </Box>

            {/* Main Content */}
            <Box bg="gray.0">
                <Container size="xl" py={60}>
                    {/* Featured Services */}
                    {featuredServices.length > 0 && (
                        <Transition mounted={mounted} transition="fade-up" duration={600} timingFunction="ease">
                            {(styles) => (
                                <Box mb={80} style={styles}>
                                    <Group justify="space-between" mb="xl">
                                        <Box>
                                            <Group gap="xs" mb={4}>
                                                <IconSparkles size={24} color="var(--mantine-color-yellow-6)" />
                                                <Title order={2}>Serviços em Destaque</Title>
                                            </Group>
                                            <Text c="dimmed">Os melhores serviços seleccionados para si</Text>
                                        </Box>
                                        <Button
                                            component={Link}
                                            href={route('services.index', { featured: 1 })}
                                            variant="subtle"
                                            rightSection={<IconArrowRight size={16} />}
                                            size="md"
                                        >
                                            Ver todos
                                        </Button>
                                    </Group>
                                    <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing="xl">
                                        {featuredServices.map((service) => (
                                            <ServiceCard key={service.id} service={service} featured />
                                        ))}
                                    </SimpleGrid>
                                </Box>
                            )}
                        </Transition>
                    )}

                    {/* Categories */}
                    {categories.length > 0 && (
                        <Box mb={80}>
                            <Group justify="space-between" mb="xl">
                                <Box>
                                    <Title order={2}>Explore por Categoria</Title>
                                    <Text c="dimmed">Encontre exactamente o que procura</Text>
                                </Box>
                                <Button
                                    component={Link}
                                    href={route('services.index')}
                                    variant="subtle"
                                    rightSection={<IconArrowRight size={16} />}
                                    size="md"
                                >
                                    Ver todas
                                </Button>
                            </Group>
                            <SimpleGrid cols={{ base: 2, xs: 2, sm: 3, md: 4 }} spacing="lg">
                                {categories.map((category) => (
                                    <CategoryCard key={category.id} category={category} />
                                ))}
                            </SimpleGrid>
                        </Box>
                    )}

                    {/* Why Choose Us */}
                    <Paper radius="xl" p={{ base: 'xl', md: 50 }} mb={80} withBorder>
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={50}>
                            <Box>
                                <Badge variant="light" color="blue" size="lg" mb="md">
                                    Porquê escolher o Salu?
                                </Badge>
                                <Title order={2} mb="md">
                                    A plataforma que conecta{' '}
                                    <Text component="span" c="blue" inherit>
                                        talentos
                                    </Text>{' '}
                                    a{' '}
                                    <Text component="span" c="cyan" inherit>
                                        oportunidades
                                    </Text>
                                </Title>
                                <Text c="dimmed" size="lg" mb="xl">
                                    Somos o marketplace de serviços líder em Angola, oferecendo uma plataforma segura e confiável para conectar profissionais qualificados a clientes.
                                </Text>
                                <Button
                                    component={Link}
                                    href={route('register')}
                                    size="lg"
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan' }}
                                    rightSection={<IconArrowRight size={18} />}
                                >
                                    Comece Agora
                                </Button>
                            </Box>
                            <Stack gap="xl">
                                <FeatureItem
                                    icon={<IconShieldCheck size={24} />}
                                    title="Profissionais Verificados"
                                    description="Todos os prestadores passam por um processo de verificação rigoroso para garantir qualidade."
                                />
                                <FeatureItem
                                    icon={<IconClock size={24} />}
                                    title="Resposta Rápida"
                                    description="Receba propostas dos melhores profissionais em minutos, não em dias."
                                />
                                <FeatureItem
                                    icon={<IconStar size={24} />}
                                    title="Avaliações Reais"
                                    description="Veja avaliações e comentários de clientes reais antes de contratar."
                                />
                            </Stack>
                        </SimpleGrid>
                    </Paper>

                    {/* Recent Services */}
                    {recentServices.length > 0 && (
                        <Box mb={80}>
                            <Group justify="space-between" mb="xl">
                                <Box>
                                    <Group gap="xs" mb={4}>
                                        <IconClock size={24} color="var(--mantine-color-blue-6)" />
                                        <Title order={2}>Adicionados Recentemente</Title>
                                    </Group>
                                    <Text c="dimmed">Descubra os novos serviços disponíveis</Text>
                                </Box>
                                <Button
                                    component={Link}
                                    href={route('services.index')}
                                    variant="subtle"
                                    rightSection={<IconArrowRight size={16} />}
                                    size="md"
                                >
                                    Ver todos
                                </Button>
                            </Group>
                            <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }} spacing="xl">
                                {recentServices.slice(0, 8).map((service) => (
                                    <ServiceCard key={service.id} service={service} />
                                ))}
                            </SimpleGrid>
                        </Box>
                    )}

                    {/* CTA Section */}
                    <Paper
                        radius="xl"
                        p={{ base: 'xl', md: 50 }}
                        style={{
                            background: 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                        />
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" style={{ position: 'relative', zIndex: 1 }}>
                            <Stack>
                                <ThemeIcon size={70} radius="xl" variant="white" color="blue">
                                    <IconBriefcase size={35} />
                                </ThemeIcon>
                                <Title order={2} c="white">É um Profissional?</Title>
                                <Text c="rgba(255,255,255,0.9)" size="lg">
                                    Junte-se a centenas de prestadores de serviços e alcance mais clientes em toda Angola. Aumente a sua visibilidade e cresça o seu negócio.
                                </Text>
                                <Button
                                    component={Link}
                                    href={route('register')}
                                    variant="white"
                                    size="lg"
                                    rightSection={<IconArrowRight size={18} />}
                                    mt="md"
                                >
                                    Registar como Prestador
                                </Button>
                            </Stack>
                            <Stack>
                                <ThemeIcon size={70} radius="xl" variant="gradient" gradient={{ from: 'cyan', to: 'teal' }}>
                                    <IconUsers size={35} />
                                </ThemeIcon>
                                <Title order={2} c="white">Procura Serviços?</Title>
                                <Text c="rgba(255,255,255,0.9)" size="lg">
                                    Encontre profissionais verificados para qualquer tipo de serviço que precise. Compare preços, veja avaliações e contrate com confiança.
                                </Text>
                                <Button
                                    component={Link}
                                    href={route('services.index')}
                                    variant="outline"
                                    color="white"
                                    size="lg"
                                    rightSection={<IconArrowRight size={18} />}
                                    mt="md"
                                >
                                    Explorar Serviços
                                </Button>
                            </Stack>
                        </SimpleGrid>
                    </Paper>
                </Container>
            </Box>
        </PublicLayout>
    );
}
