import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Container,
    Title,
    Text,
    Card,
    Group,
    Avatar,
    Badge,
    SimpleGrid,
    TextInput,
    Select,
    Paper,
    Stack,
    Box,
    Button,
    Pagination,
    ThemeIcon,
    Tooltip,
    Transition,
    Divider,
    Center,
    Loader,
    rem,
} from '@mantine/core';
import { useDebouncedValue, useIntersection } from '@mantine/hooks';
import {
    IconSearch,
    IconStar,
    IconStarFilled,
    IconShieldCheck,
    IconBriefcase,
    IconUsers,
    IconFilter,
    IconArrowRight,
    IconSparkles,
    IconCategory,
    IconSortDescending,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    services_count: number;
}

interface ProviderCategory {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
}

interface Provider {
    id: number;
    display_name: string;
    description: string | null;
    avatar: string | null;
    is_verified: boolean;
    is_featured: boolean;
    rating: number;
    total_reviews: number;
    completed_services: number;
    services_count: number;
    categories: ProviderCategory[];
    member_since: string;
}

interface PaginatedProviders {
    data: Provider[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    providers: PaginatedProviders;
    categories: Category[];
    filters: {
        category: string | null;
        search: string | null;
        sort: string;
    };
}

function ProviderCard({ provider, index }: { provider: Provider; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { ref, entry } = useIntersection({
        root: null,
        threshold: 0.1,
    });

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (entry?.isIntersecting) {
            const timer = setTimeout(() => setVisible(true), index * 50);
            return () => clearTimeout(timer);
        }
    }, [entry?.isIntersecting, index]);

    return (
        <div ref={ref}>
            <Transition mounted={visible} transition="slide-up" duration={400}>
                {(styles) => (
                    <Card
                        ref={cardRef}
                        shadow="sm"
                        padding="lg"
                        radius="lg"
                        withBorder
                        style={{
                            ...styles,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        className="hover:shadow-lg hover:-translate-y-1"
                        component={Link}
                        href={route('providers.show', provider.id)}
                    >
                        {provider.is_featured && (
                            <Badge
                                variant="gradient"
                                gradient={{ from: 'yellow', to: 'orange', deg: 90 }}
                                leftSection={<IconSparkles size={12} />}
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                }}
                            >
                                Destaque
                            </Badge>
                        )}

                        <Group wrap="nowrap" gap="md">
                            <Avatar
                                src={provider.avatar}
                                size={80}
                                radius="xl"
                                color="blue"
                                variant="gradient"
                                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                            >
                                {provider.display_name.charAt(0).toUpperCase()}
                            </Avatar>

                            <Box style={{ flex: 1, minWidth: 0 }}>
                                <Group gap={8} wrap="nowrap">
                                    <Text fw={600} size="lg" truncate>
                                        {provider.display_name}
                                    </Text>
                                    {provider.is_verified && (
                                        <Tooltip label="Prestador Verificado">
                                            <ThemeIcon
                                                size="sm"
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                            >
                                                <IconShieldCheck size={12} />
                                            </ThemeIcon>
                                        </Tooltip>
                                    )}
                                </Group>

                                <Group gap={4} mt={4}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Box key={star} style={{ color: star <= Math.round(provider.rating) ? '#fab005' : '#dee2e6' }}>
                                            {star <= Math.round(provider.rating) ? (
                                                <IconStarFilled size={14} />
                                            ) : (
                                                <IconStar size={14} />
                                            )}
                                        </Box>
                                    ))}
                                    <Text size="sm" c="dimmed" ml={4}>
                                        {provider.rating > 0 ? provider.rating.toFixed(1) : 'N/A'} ({provider.total_reviews} avaliações)
                                    </Text>
                                </Group>

                                <Text size="sm" c="dimmed" mt={4}>
                                    Membro desde {provider.member_since}
                                </Text>
                            </Box>
                        </Group>

                        {provider.description && (
                            <Text size="sm" c="dimmed" mt="md" lineClamp={2}>
                                {provider.description}
                            </Text>
                        )}

                        {provider.categories.length > 0 && (
                            <Group gap={6} mt="md">
                                {provider.categories.slice(0, 3).map((category) => (
                                    <Badge
                                        key={category.id}
                                        variant="light"
                                        color="blue"
                                        size="sm"
                                        radius="sm"
                                    >
                                        {category.name}
                                    </Badge>
                                ))}
                                {provider.categories.length > 3 && (
                                    <Badge variant="light" color="gray" size="sm" radius="sm">
                                        +{provider.categories.length - 3}
                                    </Badge>
                                )}
                            </Group>
                        )}

                        <Divider my="md" />

                        <Group justify="space-between">
                            <Group gap="xl">
                                <Box ta="center">
                                    <Text fw={600} size="lg" c="blue">
                                        {provider.services_count}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Serviços
                                    </Text>
                                </Box>
                                <Box ta="center">
                                    <Text fw={600} size="lg" c="green">
                                        {provider.completed_services}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Concluídos
                                    </Text>
                                </Box>
                            </Group>

                            <Button
                                variant="light"
                                size="sm"
                                radius="xl"
                                rightSection={<IconArrowRight size={14} />}
                            >
                                Ver Perfil
                            </Button>
                        </Group>
                    </Card>
                )}
            </Transition>
        </div>
    );
}

export default function ProvidersIndex({ providers, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [debouncedSearch] = useDebouncedValue(search, 500);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            handleFilter({ search: debouncedSearch || undefined });
        }
    }, [debouncedSearch]);

    const handleFilter = (newFilters: Record<string, string | undefined>) => {
        setLoading(true);
        router.get(
            route('providers.index'),
            {
                ...filters,
                ...newFilters,
                page: undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            }
        );
    };

    const handlePageChange = (page: number) => {
        setLoading(true);
        router.get(
            route('providers.index'),
            { ...filters, page },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoading(false),
            }
        );
    };

    const sortOptions = [
        { value: 'rating', label: 'Melhor Avaliação' },
        { value: 'reviews', label: 'Mais Avaliações' },
        { value: 'services', label: 'Mais Serviços' },
        { value: 'recent', label: 'Mais Recente' },
    ];

    const categoryOptions = [
        { value: '', label: 'Todas as Categorias' },
        ...categories.map((cat) => ({
            value: cat.slug,
            label: `${cat.name} (${cat.services_count})`,
        })),
    ];

    return (
        <PublicLayout>
            <Head title="Prestadores de Serviços" />

            {/* Hero Section */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-cyan-5) 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                py={60}
            >
                {/* Background Pattern */}
                <Box
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.1,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
                    <Stack align="center" gap="md">
                        <Group gap={8}>
                            <ThemeIcon size={48} radius="xl" variant="white" color="blue">
                                <IconUsers size={28} />
                            </ThemeIcon>
                        </Group>
                        <Title order={1} ta="center" size="h1">
                            Prestadores de Serviços
                        </Title>
                        <Text size="lg" ta="center" maw={600} style={{ opacity: 0.9 }}>
                            Encontre profissionais qualificados e verificados para todas as suas necessidades.
                            Filtre por categoria e escolha o melhor prestador para você.
                        </Text>

                        {/* Stats */}
                        <Group gap={40} mt="lg">
                            <Box ta="center">
                                <Text size="xl" fw={700}>
                                    {providers.total}+
                                </Text>
                                <Text size="sm" style={{ opacity: 0.8 }}>
                                    Prestadores
                                </Text>
                            </Box>
                            <Box ta="center">
                                <Text size="xl" fw={700}>
                                    {categories.length}
                                </Text>
                                <Text size="sm" style={{ opacity: 0.8 }}>
                                    Categorias
                                </Text>
                            </Box>
                        </Group>
                    </Stack>
                </Container>
            </Box>

            <Container size="xl" py="xl">
                {/* Filters */}
                <Paper shadow="sm" radius="lg" p="lg" mb="xl" withBorder>
                    <Group gap="md" wrap="wrap">
                        <TextInput
                            placeholder="Pesquisar prestadores..."
                            leftSection={<IconSearch size={18} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1, minWidth: 200 }}
                            radius="md"
                            size="md"
                        />

                        <Select
                            placeholder="Categoria"
                            leftSection={<IconCategory size={18} />}
                            data={categoryOptions}
                            value={filters.category || ''}
                            onChange={(value) => handleFilter({ category: value || undefined })}
                            clearable
                            radius="md"
                            size="md"
                            style={{ minWidth: 200 }}
                        />

                        <Select
                            placeholder="Ordenar por"
                            leftSection={<IconSortDescending size={18} />}
                            data={sortOptions}
                            value={filters.sort}
                            onChange={(value) => handleFilter({ sort: value || 'rating' })}
                            radius="md"
                            size="md"
                            style={{ minWidth: 180 }}
                        />
                    </Group>

                    {/* Active Filters */}
                    {(filters.category || filters.search) && (
                        <Group gap="xs" mt="md">
                            <Text size="sm" c="dimmed">
                                Filtros ativos:
                            </Text>
                            {filters.category && (
                                <Badge
                                    variant="light"
                                    color="blue"
                                    rightSection={
                                        <Box
                                            component="span"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleFilter({ category: undefined })}
                                        >
                                            ×
                                        </Box>
                                    }
                                >
                                    {categories.find((c) => c.slug === filters.category)?.name}
                                </Badge>
                            )}
                            {filters.search && (
                                <Badge
                                    variant="light"
                                    color="gray"
                                    rightSection={
                                        <Box
                                            component="span"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                setSearch('');
                                                handleFilter({ search: undefined });
                                            }}
                                        >
                                            ×
                                        </Box>
                                    }
                                >
                                    "{filters.search}"
                                </Badge>
                            )}
                            <Button
                                variant="subtle"
                                size="xs"
                                color="red"
                                onClick={() => {
                                    setSearch('');
                                    router.get(route('providers.index'));
                                }}
                            >
                                Limpar todos
                            </Button>
                        </Group>
                    )}
                </Paper>

                {/* Results Info */}
                <Group justify="space-between" mb="lg">
                    <Text c="dimmed">
                        {providers.total} prestador{providers.total !== 1 ? 'es' : ''} encontrado{providers.total !== 1 ? 's' : ''}
                    </Text>
                </Group>

                {/* Loading State */}
                {loading && (
                    <Center py={60}>
                        <Loader size="lg" />
                    </Center>
                )}

                {/* Providers Grid */}
                {!loading && providers.data.length > 0 ? (
                    <>
                        <SimpleGrid
                            cols={{ base: 1, sm: 2, lg: 3 }}
                            spacing="lg"
                        >
                            {providers.data.map((provider, index) => (
                                <ProviderCard key={provider.id} provider={provider} index={index} />
                            ))}
                        </SimpleGrid>

                        {/* Pagination */}
                        {providers.last_page > 1 && (
                            <Center mt={40}>
                                <Pagination
                                    value={providers.current_page}
                                    onChange={handlePageChange}
                                    total={providers.last_page}
                                    radius="md"
                                    withEdges
                                />
                            </Center>
                        )}
                    </>
                ) : (
                    !loading && (
                        <Paper p={60} radius="lg" withBorder ta="center">
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconUsers size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="sm">
                                Nenhum prestador encontrado
                            </Title>
                            <Text c="dimmed" mb="lg">
                                Tente ajustar os filtros ou pesquisar por outro termo.
                            </Text>
                            <Button
                                variant="light"
                                onClick={() => {
                                    setSearch('');
                                    router.get(route('providers.index'));
                                }}
                            >
                                Limpar filtros
                            </Button>
                        </Paper>
                    )
                )}

                {/* Category Quick Links */}
                {categories.length > 0 && (
                    <Box mt={60}>
                        <Title order={3} mb="lg">
                            Explorar por Categoria
                        </Title>
                        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="md">
                            {categories.map((category) => (
                                <Paper
                                    key={category.id}
                                    p="md"
                                    radius="lg"
                                    withBorder
                                    component={Link}
                                    href={route('providers.index', { category: category.slug })}
                                    style={{
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                    }}
                                    className="hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <Stack align="center" gap="xs">
                                        <ThemeIcon
                                            size={48}
                                            radius="xl"
                                            variant="light"
                                            color="blue"
                                        >
                                            <IconCategory size={24} />
                                        </ThemeIcon>
                                        <Text fw={500} ta="center" size="sm">
                                            {category.name}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {category.services_count} serviços
                                        </Text>
                                    </Stack>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    </Box>
                )}
            </Container>
        </PublicLayout>
    );
}
