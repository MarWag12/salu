import { Head, Link, router } from '@inertiajs/react';
import {
    Container,
    TextInput,
    Select,
    Card,
    Group,
    Badge,
    Text,
    SimpleGrid,
    Image,
    Stack,
    Paper,
    Checkbox,
    NumberInput,
    Button,
    Pagination,
    Drawer,
    ActionIcon,
    Box,
    Flex,
    Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch,
    IconStar,
    IconMapPin,
    IconFilter,
    IconX,
    IconSparkles,
    IconTag,
    IconClock,
    IconAdjustments,
} from '@tabler/icons-react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import ServicePricingBadge from '@/Components/ServicePricingBadge';

interface Category {
    id: number;
    name: string;
    slug: string;
    services_count: number;
}

interface Provider {
    name: string;
    rating: number | null;
}

interface ServiceCategory {
    id: number;
    name: string;
}

interface Service {
    id: number;
    name: string;
    description: string;
    category: ServiceCategory;
    provider: Provider;
    price_type: 'fixed' | 'hourly' | 'variable';
    price_min: number;
    price_max?: number;
    formatted_price: string;
    location: string | null;
    is_featured: boolean;
    cover_url: string | null;
    view_count: number;
}

interface SortOption {
    value: string;
    label: string;
}

interface PaginatedServices {
    data: Service[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface Filters {
    q?: string;
    search?: string;
    category?: string;
    category_id?: string;
    price_type?: string;
    price_min?: string;
    price_max?: string;
    location?: string;
    sort?: string;
    featured?: string;
}

interface Props {
    services: PaginatedServices;
    categories: Category[];
    filters: Filters;
    sortOptions: SortOption[];
}

function ServiceCard({ service }: { service: Service }) {
    return (
        <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            component={Link}
            href={route('services.show', service.id)}
            className="hover:shadow-lg transition-shadow no-underline"
        >
            <Card.Section pos="relative">
                <Image
                    src={service.cover_url || '/images/placeholder-service.jpg'}
                    height={160}
                    alt={service.name}
                    fallbackSrc="https://placehold.co/400x200?text=Serviço"
                />
                {service.is_featured && (
                    <Badge
                        pos="absolute"
                        top={8}
                        left={8}
                        variant="filled"
                        color="yellow"
                        leftSection={<IconSparkles size={12} />}
                    >
                        Destaque
                    </Badge>
                )}
            </Card.Section>

            <Stack gap="xs" mt="md">
                <Group justify="space-between" align="flex-start">
                    <Badge variant="light" color="blue" size="sm">
                        {service.category.name}
                    </Badge>
                    <ServicePricingBadge
                        priceType={service.price_type}
                        priceMin={service.price_min}
                        priceMax={service.price_max}
                        size="sm"
                        variant="light"
                    />
                </Group>

                <Text fw={600} lineClamp={2}>
                    {service.name}
                </Text>

                <Text size="sm" c="dimmed" lineClamp={2}>
                    {service.description}
                </Text>

                <Group justify="space-between" mt="xs">
                    <Group gap="xs">
                        <Text size="sm" c="dimmed">
                            {service.provider.name}
                        </Text>
                        {service.provider.rating && (
                            <Group gap={4}>
                                <IconStar size={14} fill="gold" color="gold" />
                                <Text size="sm" fw={500}>
                                    {Number(service.provider.rating).toFixed(1)}
                                </Text>
                            </Group>
                        )}
                    </Group>
                    {service.location && (
                        <Group gap={4}>
                            <IconMapPin size={12} color="gray" />
                            <Text size="xs" c="dimmed">
                                {service.location}
                            </Text>
                        </Group>
                    )}
                </Group>
            </Stack>
        </Card>
    );
}

function FiltersSidebar({
    categories,
    filters,
    onFilterChange,
    onClearFilters,
}: {
    categories: Category[];
    filters: Filters;
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
}) {
    const hasActiveFilters = filters.category_id || filters.price_type || filters.price_min || filters.price_max || filters.location;

    return (
        <Stack gap="lg">
            {/* Categories */}
            <Paper p="md" withBorder>
                <Text fw={600} mb="md">
                    Categorias
                </Text>
                <Stack gap="xs">
                    <Button
                        variant={!filters.category_id ? 'light' : 'subtle'}
                        color={!filters.category_id ? 'blue' : 'gray'}
                        size="sm"
                        fullWidth
                        justify="space-between"
                        onClick={() => onFilterChange('category_id', '')}
                    >
                        Todas as Categorias
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={filters.category_id === String(category.id) ? 'light' : 'subtle'}
                            color={filters.category_id === String(category.id) ? 'blue' : 'gray'}
                            size="sm"
                            fullWidth
                            justify="space-between"
                            onClick={() => onFilterChange('category_id', String(category.id))}
                            rightSection={
                                <Badge size="sm" variant="light" color="gray">
                                    {category.services_count}
                                </Badge>
                            }
                        >
                            {category.name}
                        </Button>
                    ))}
                </Stack>
            </Paper>

            {/* Price Type Filter */}
            <Paper p="md" withBorder>
                <Text fw={600} mb="md">
                    Tipo de Preço
                </Text>
                <Stack gap="xs">
                    <Button
                        variant={!filters.price_type ? 'light' : 'subtle'}
                        color={!filters.price_type ? 'primary.4' : 'gray'}
                        size="sm"
                        fullWidth
                        justify="flex-start"
                        onClick={() => onFilterChange('price_type', '')}
                    >
                        Todos os Tipos
                    </Button>
                    <Button
                        variant={filters.price_type === 'fixed' ? 'light' : 'subtle'}
                        color={filters.price_type === 'fixed' ? 'blue' : 'gray'}
                        size="sm"
                        fullWidth
                        justify="flex-start"
                        leftSection={<IconTag size={16} />}
                        onClick={() => onFilterChange('price_type', 'fixed')}
                    >
                        Preço Fixo
                    </Button>
                    <Button
                        variant={filters.price_type === 'hourly' ? 'light' : 'subtle'}
                        color={filters.price_type === 'hourly' ? 'orange' : 'gray'}
                        size="sm"
                        fullWidth
                        justify="flex-start"
                        leftSection={<IconClock size={16} />}
                        onClick={() => onFilterChange('price_type', 'hourly')}
                    >
                        Por Hora
                    </Button>
                    <Button
                        variant={filters.price_type === 'variable' ? 'light' : 'subtle'}
                        color={filters.price_type === 'variable' ? 'green' : 'gray'}
                        size="sm"
                        fullWidth
                        justify="flex-start"
                        leftSection={<IconAdjustments size={16} />}
                        onClick={() => onFilterChange('price_type', 'variable')}
                    >
                        Preço Variável
                    </Button>
                </Stack>
            </Paper>

            {/* Price Filter */}
            <Paper p="md" withBorder>
                <Text fw={600} mb="md">
                    Preço (AOA)
                </Text>
                <Stack gap="sm">
                    <NumberInput
                        placeholder="Mínimo"
                        value={filters.price_min ? Number(filters.price_min) : ''}
                        onChange={(value) => onFilterChange('price_min', value ? String(value) : '')}
                        min={0}
                        thousandSeparator=" "
                    />
                    <NumberInput
                        placeholder="Máximo"
                        value={filters.price_max ? Number(filters.price_max) : ''}
                        onChange={(value) => onFilterChange('price_max', value ? String(value) : '')}
                        min={0}
                        thousandSeparator=" "
                    />
                </Stack>
            </Paper>

            {/* Location Filter */}
            <Paper p="md" withBorder>
                <Text fw={600} mb="md">
                    Localização
                </Text>
                <TextInput
                    placeholder="Cidade ou região..."
                    value={filters.location || ''}
                    onChange={(e) => onFilterChange('location', e.target.value)}
                    leftSection={<IconMapPin size={16} />}
                />
            </Paper>

            {hasActiveFilters && (
                <Button
                    variant="outline"
                    color="gray"
                    fullWidth
                    leftSection={<IconX size={16} />}
                    onClick={onClearFilters}
                >
                    Limpar Filtros
                </Button>
            )}
        </Stack>
    );
}

export default function Index({ services, categories, filters, sortOptions }: Props) {
    const [search, setSearch] = useState(filters.q || filters.search || '');
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('services.index'), { ...filters, q: search }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('services.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true }
        );
    };

    const clearFilters = () => {
        router.get(route('services.index'));
    };

    const handlePageChange = (page: number) => {
        router.get(
            route('services.index'),
            { ...filters, page },
            { preserveState: true }
        );
    };

    return (
        <PublicLayout>
            <Head title="Explorar Serviços" />

            {/* Search Bar */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #228be6 0%, #15aabf 100%)',
                    marginTop: '-1rem',
                    marginLeft: '-1rem',
                    marginRight: '-1rem',
                    padding: '2rem 1rem',
                }}
            >
                <Container size="lg">
                    <form onSubmit={handleSearch}>
                        <Flex gap="sm">
                            <TextInput
                                placeholder="Pesquisar serviços..."
                                leftSection={<IconSearch size={20} />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                size="lg"
                                radius="xl"
                                style={{ flex: 1 }}
                                styles={{
                                    input: {
                                        backgroundColor: 'white',
                                    },
                                }}
                            />
                            <Button type="submit" size="lg" radius="xl" variant="white" color="blue">
                                Pesquisar
                            </Button>
                        </Flex>
                    </form>
                </Container>
            </Box>

            <Container size="xl" py="xl">
                <Flex gap="xl">
                    {/* Sidebar Filters - Desktop */}
                    <Box w={280} visibleFrom="md">
                        <FiltersSidebar
                            categories={categories}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={clearFilters}
                        />
                    </Box>

                    {/* Main Content */}
                    <Box style={{ flex: 1 }}>
                        {/* Results Header */}
                        <Group justify="space-between" mb="lg">
                            <Text c="dimmed">
                                {services.total} serviço{services.total !== 1 ? 's' : ''} encontrado{services.total !== 1 ? 's' : ''}
                            </Text>
                            <Group gap="sm">
                                <ActionIcon
                                    variant="light"
                                    size="lg"
                                    hiddenFrom="md"
                                    onClick={openDrawer}
                                >
                                    <IconFilter size={20} />
                                </ActionIcon>
                                <Select
                                    value={filters.sort || 'featured'}
                                    onChange={(value) => handleFilterChange('sort', value || 'featured')}
                                    data={sortOptions}
                                    w={180}
                                />
                            </Group>
                        </Group>

                        {/* Services Grid */}
                        {services.data.length === 0 ? (
                            <Paper p="xl" ta="center" withBorder>
                                <IconSearch size={48} color="gray" style={{ opacity: 0.5 }} />
                                <Text fw={600} mt="md">
                                    Nenhum serviço encontrado
                                </Text>
                                <Text c="dimmed" size="sm">
                                    Tente ajustar os filtros de pesquisa.
                                </Text>
                                <Button variant="light" mt="lg" onClick={clearFilters}>
                                    Limpar Filtros
                                </Button>
                            </Paper>
                        ) : (
                            <>
                                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                                    {services.data.map((service) => (
                                        <ServiceCard key={service.id} service={service} />
                                    ))}
                                </SimpleGrid>

                                {/* Pagination */}
                                {services.last_page > 1 && (
                                    <Group justify="center" mt="xl">
                                        <Pagination
                                            total={services.last_page}
                                            value={services.current_page}
                                            onChange={handlePageChange}
                                        />
                                    </Group>
                                )}
                            </>
                        )}
                    </Box>
                </Flex>
            </Container>

            {/* Mobile Filters Drawer */}
            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                title="Filtros"
                position="right"
                size="sm"
            >
                <FiltersSidebar
                    categories={categories}
                    filters={filters}
                    onFilterChange={(key, value) => {
                        handleFilterChange(key, value);
                        closeDrawer();
                    }}
                    onClearFilters={() => {
                        clearFilters();
                        closeDrawer();
                    }}
                />
            </Drawer>
        </PublicLayout>
    );
}
