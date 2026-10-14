import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Container,
    Card,
    Text,
    Group,
    Stack,
    Badge,
    Image,
    Button,
    SimpleGrid,
    ThemeIcon,
    Paper,
    ActionIcon,
    Tooltip,
    Center,
    Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconHeart,
    IconHeartFilled,
    IconStar,
    IconStarFilled,
    IconMapPin,
    IconTrash,
    IconEye,
    IconShoppingCart,
    IconSparkles,
    IconShieldCheck,
} from '@tabler/icons-react';

interface Category {
    id: number;
    name: string;
}

interface Provider {
    id: number;
    name: string;
    is_verified: boolean;
}

interface Service {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    formatted_price: string;
    cover_url: string | null;
    is_featured: boolean;
    is_published: boolean;
    location: string | null;
    rating: number;
    reviews_count: number;
    category: Category;
    provider: Provider;
}

interface WishlistItem {
    id: number;
    added_at: string;
    added_at_human: string;
    service: Service;
}

interface PaginatedWishlist {
    data: WishlistItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    wishlistItems: PaginatedWishlist;
}

export default function Wishlist({ wishlistItems }: Props) {
    const handleRemove = (serviceId: number, serviceName: string) => {
        router.delete(route('wishlist.destroy', serviceId), {
            preserveScroll: true,
            onSuccess: () => {
                notifications.show({
                    title: 'Removido',
                    message: `"${serviceName}" foi removido da sua lista de desejos.`,
                    color: 'blue',
                });
            },
        });
    };

    const renderStars = (rating: number) => {
        return (
            <Group gap={2}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Box key={star} style={{ color: star <= Math.round(rating) ? '#fab005' : '#dee2e6' }}>
                        {star <= Math.round(rating) ? (
                            <IconStarFilled size={12} />
                        ) : (
                            <IconStar size={12} />
                        )}
                    </Box>
                ))}
            </Group>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <Group>
                    <IconHeartFilled size={24} className="text-red-500" />
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Minha Lista de Desejos
                    </h2>
                    {wishlistItems.total > 0 && (
                        <Badge color="red" variant="filled" size="lg">
                            {wishlistItems.total}
                        </Badge>
                    )}
                </Group>
            }
        >
            <Head title="Lista de Desejos" />

            <div className="py-12">
                <Container size="xl">
                    {wishlistItems.data.length === 0 ? (
                        <Paper p={60} radius="lg" withBorder ta="center">
                            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mx="auto" mb="lg">
                                <IconHeart size={40} />
                            </ThemeIcon>
                            <Text size="xl" fw={600} mb="sm">
                                A sua lista de desejos está vazia
                            </Text>
                            <Text c="dimmed" mb="xl" maw={400} mx="auto">
                                Explore os serviços disponíveis e adicione os que mais gostar à sua lista de desejos.
                            </Text>
                            <Button
                                component={Link}
                                href={route('services.index')}
                                size="lg"
                                leftSection={<IconEye size={20} />}
                            >
                                Explorar Serviços
                            </Button>
                        </Paper>
                    ) : (
                        <>
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
                                {wishlistItems.data.map((item) => (
                                    <Card
                                        key={item.id}
                                        shadow="sm"
                                        padding="lg"
                                        radius="md"
                                        withBorder
                                        style={{
                                            transition: 'all 0.2s ease',
                                            opacity: item.service.is_published ? 1 : 0.6,
                                        }}
                                        className="hover:shadow-lg"
                                    >
                                        <Card.Section pos="relative">
                                            <Link href={route('services.show', item.service.id)}>
                                                <Image
                                                    src={item.service.cover_url || '/images/placeholder-service.jpg'}
                                                    height={160}
                                                    alt={item.service.name}
                                                    fallbackSrc="https://placehold.co/400x200?text=Serviço"
                                                />
                                            </Link>
                                            {item.service.is_featured && (
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
                                            {!item.service.is_published && (
                                                <Badge
                                                    pos="absolute"
                                                    top={8}
                                                    left={8}
                                                    variant="filled"
                                                    color="red"
                                                >
                                                    Indisponível
                                                </Badge>
                                            )}
                                            <Tooltip label="Remover dos desejos">
                                                <ActionIcon
                                                    variant="filled"
                                                    color="red"
                                                    pos="absolute"
                                                    top={8}
                                                    right={8}
                                                    size="lg"
                                                    radius="xl"
                                                    onClick={() => handleRemove(item.service.id, item.service.name)}
                                                >
                                                    <IconHeartFilled size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Card.Section>

                                        <Stack gap="xs" mt="md">
                                            <Badge variant="light" color="blue" size="sm" w="fit-content">
                                                {item.service.category.name}
                                            </Badge>

                                            <Link
                                                href={route('services.show', item.service.id)}
                                                className="no-underline"
                                            >
                                                <Text fw={600} lineClamp={2} className="hover:text-blue-600">
                                                    {item.service.name}
                                                </Text>
                                            </Link>

                                            <Group gap="xs">
                                                <Text size="sm" c="dimmed">
                                                    {item.service.provider.name}
                                                </Text>
                                                {item.service.provider.is_verified && (
                                                    <Tooltip label="Prestador Verificado">
                                                        <ThemeIcon size="xs" radius="xl" color="blue" variant="filled">
                                                            <IconShieldCheck size={10} />
                                                        </ThemeIcon>
                                                    </Tooltip>
                                                )}
                                            </Group>

                                            <Group gap="xs">
                                                {renderStars(item.service.rating)}
                                                <Text size="xs" c="dimmed">
                                                    {item.service.rating > 0 ? item.service.rating.toFixed(1) : 'N/A'}
                                                    {item.service.reviews_count > 0 && ` (${item.service.reviews_count})`}
                                                </Text>
                                            </Group>

                                            {item.service.location && (
                                                <Group gap={4}>
                                                    <IconMapPin size={14} color="gray" />
                                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                                        {item.service.location}
                                                    </Text>
                                                </Group>
                                            )}

                                            <Group justify="space-between" mt="xs">
                                                <Text fw={700} c="blue" size="lg">
                                                    {item.service.formatted_price} AOA
                                                </Text>
                                            </Group>

                                            <Text size="xs" c="dimmed">
                                                Adicionado {item.added_at_human}
                                            </Text>

                                            <Group grow mt="xs">
                                                <Button
                                                    component={Link}
                                                    href={route('services.show', item.service.id)}
                                                    variant="light"
                                                    size="sm"
                                                    leftSection={<IconEye size={16} />}
                                                    disabled={!item.service.is_published}
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    color="red"
                                                    size="sm"
                                                    leftSection={<IconTrash size={16} />}
                                                    onClick={() => handleRemove(item.service.id, item.service.name)}
                                                >
                                                    Remover
                                                </Button>
                                            </Group>
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>

                            {wishlistItems.last_page > 1 && (
                                <Center mt="xl">
                                    <Group>
                                        {wishlistItems.current_page > 1 && (
                                            <Button
                                                variant="light"
                                                component={Link}
                                                href={route('wishlist.index', { page: wishlistItems.current_page - 1 })}
                                            >
                                                Anterior
                                            </Button>
                                        )}
                                        <Text size="sm" c="dimmed">
                                            Página {wishlistItems.current_page} de {wishlistItems.last_page}
                                        </Text>
                                        {wishlistItems.current_page < wishlistItems.last_page && (
                                            <Button
                                                variant="light"
                                                component={Link}
                                                href={route('wishlist.index', { page: wishlistItems.current_page + 1 })}
                                            >
                                                Próxima
                                            </Button>
                                        )}
                                    </Group>
                                </Center>
                            )}
                        </>
                    )}
                </Container>
            </div>
        </AuthenticatedLayout>
    );
}
