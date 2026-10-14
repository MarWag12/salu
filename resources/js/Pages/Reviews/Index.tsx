import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    Paper,
    Avatar,
    ActionIcon,
    Tooltip,
    Pagination,
    ThemeIcon,
    Transition,
    Alert,
    Divider,
} from '@mantine/core';
import {
    IconStar,
    IconEdit,
    IconTrash,
    IconMessage,
    IconCalendar,
    IconShieldCheck,
    IconAlertCircle,
    IconStarFilled,
    IconEyeOff,
} from '@tabler/icons-react';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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
    service_provider: ServiceProvider;
}

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    provider_response: string | null;
    is_verified: boolean;
    is_anonymous?: boolean;
    created_at: string;
    service: Service;
}

interface PaginatedReviews {
    data: Review[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    reviews: PaginatedReviews;
    auth: {
        user: User;
    };
}

export default function Index({ reviews, auth }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateShort = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
        });
    };

    const canEdit = (review: Review): boolean => {
        const createdAt = new Date(review.created_at);
        const daysDiff = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
    };

    const getDaysRemaining = (review: Review): number => {
        const createdAt = new Date(review.created_at);
        const daysDiff = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, 7 - daysDiff);
    };

    const handleDelete = (reviewId: number) => {
        if (confirm('Tem a certeza que deseja eliminar esta avaliação?')) {
            router.delete(route('reviews.destroy', reviewId));
        }
    };

    const handlePageChange = (page: number) => {
        router.get(route('reviews.index'), { page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const renderStars = (rating: number) => {
        return (
            <Group gap={2}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStar
                        key={star}
                        size={18}
                        fill={star <= rating ? 'currentColor' : 'none'}
                        className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </Group>
        );
    };

    const getRatingLabel = (rating: number): string => {
        const labels: { [key: number]: string } = {
            1: 'Muito Mau',
            2: 'Mau',
            3: 'Razoável',
            4: 'Bom',
            5: 'Excelente',
        };
        return labels[rating] || '';
    };

    const getRatingColor = (rating: number): string => {
        if (rating >= 4) return 'green';
        if (rating === 3) return 'yellow';
        return 'red';
    };

    return (
        <AuthenticatedLayout
            header={
                <Group justify="space-between">
                    <div>
                        <Text size="xl" fw={700} className="text-gray-800">
                            Minhas Avaliações
                        </Text>
                        <Text size="sm" c="dimmed">
                            Gerencie as avaliações que fez aos serviços
                        </Text>
                    </div>
                    <Badge color="blue" variant="light" size="lg">
                        {reviews.total} avaliação(ões)
                    </Badge>
                </Group>
            }
        >
            <Head title="Minhas Avaliações" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <Transition mounted={mounted} transition="fade" duration={400}>
                        {(styles) => (
                            <Card style={styles} shadow="sm" padding="lg" radius="md" withBorder>
                                {reviews.data.length === 0 ? (
                                    <Stack align="center" py="xl" gap="lg">
                                        <ThemeIcon size={80} color="gray" variant="light" radius="xl">
                                            <IconStarFilled size={40} />
                                        </ThemeIcon>
                                        <Stack align="center" gap="xs">
                                            <Text size="lg" fw={500}>Nenhuma avaliação ainda</Text>
                                            <Text c="dimmed" ta="center" maw={400}>
                                                Ainda não fez nenhuma avaliação.
                                                Avalie os serviços que utilizou para ajudar outros utilizadores.
                                            </Text>
                                        </Stack>
                                        <Button
                                            component={Link}
                                            href={route('services.index')}
                                            variant="light"
                                            leftSection={<IconStar size={16} />}
                                        >
                                            Explorar Serviços
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Stack gap="md">
                                        {reviews.data.map((review, index) => (
                                            <Transition
                                                key={review.id}
                                                mounted={mounted}
                                                transition="slide-up"
                                                duration={300 + index * 50}
                                            >
                                                {(transitionStyles) => (
                                                    <Paper
                                                        style={transitionStyles}
                                                        p="md"
                                                        withBorder
                                                        radius="md"
                                                        className="hover:shadow-md transition-all duration-200"
                                                    >
                                                        {/* Header */}
                                                        <Group justify="space-between" mb="sm">
                                                            <Group gap="sm">
                                                                <Avatar
                                                                    color="blue"
                                                                    radius="xl"
                                                                    size="lg"
                                                                    className="shadow-sm"
                                                                >
                                                                    {review.service.name.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                                <div>
                                                                    <Group gap="xs">
                                                                        <Text fw={600} size="md">
                                                                            {review.service.name}
                                                                        </Text>
                                                                        {review.is_verified && (
                                                                            <Tooltip label="Compra Verificada">
                                                                                <Badge
                                                                                    color="green"
                                                                                    variant="light"
                                                                                    size="sm"
                                                                                    leftSection={<IconShieldCheck size={12} />}
                                                                                >
                                                                                    Verificado
                                                                                </Badge>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Group>
                                                                    <Text size="sm" c="dimmed">
                                                                        {review.service.service_provider.trading_name ||
                                                                            review.service.service_provider.company_name ||
                                                                            review.service.service_provider.user.name}
                                                                    </Text>
                                                                </div>
                                                            </Group>

                                                            {/* Actions */}
                                                            <Group gap="xs">
                                                                {canEdit(review) && (
                                                                    <Tooltip label={`Pode editar por mais ${getDaysRemaining(review)} dias`}>
                                                                        <ActionIcon
                                                                            component={Link}
                                                                            href={route('reviews.edit', review.id)}
                                                                            variant="light"
                                                                            color="blue"
                                                                            size="lg"
                                                                            radius="md"
                                                                        >
                                                                            <IconEdit size={18} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                )}
                                                                <Tooltip label="Eliminar avaliação">
                                                                    <ActionIcon
                                                                        variant="light"
                                                                        color="red"
                                                                        size="lg"
                                                                        radius="md"
                                                                        onClick={() => handleDelete(review.id)}
                                                                    >
                                                                        <IconTrash size={18} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            </Group>
                                                        </Group>

                                                        {/* Rating */}
                                                        <Group gap="md" mb="sm">
                                                            {renderStars(review.rating)}
                                                            <Badge
                                                                color={getRatingColor(review.rating)}
                                                                variant="light"
                                                                size="sm"
                                                            >
                                                                {getRatingLabel(review.rating)}
                                                            </Badge>
                                                            <Group gap={4}>
                                                                <IconCalendar size={14} className="text-gray-400" />
                                                                <Text size="xs" c="dimmed">
                                                                    {formatDateShort(review.created_at)}
                                                                </Text>
                                                            </Group>
                                                            {review.is_anonymous && (
                                                                <Tooltip label="Esta avaliação é anónima">
                                                                    <Badge
                                                                        color="gray"
                                                                        variant="light"
                                                                        size="sm"
                                                                        leftSection={<IconEyeOff size={12} />}
                                                                    >
                                                                        Anónima
                                                                    </Badge>
                                                                </Tooltip>
                                                            )}
                                                        </Group>

                                                        {/* Comment */}
                                                        {review.comment && (
                                                            <Paper p="sm" bg="gray.0" radius="sm" mb="sm">
                                                                <Text size="sm" style={{ lineHeight: 1.6 }}>
                                                                    "{review.comment}"
                                                                </Text>
                                                            </Paper>
                                                        )}

                                                        {/* Provider Response */}
                                                        {review.provider_response && (
                                                            <Paper p="sm" bg="blue.0" radius="sm" mt="sm">
                                                                <Group gap="xs" mb="xs">
                                                                    <ThemeIcon size="sm" color="blue" variant="light" radius="xl">
                                                                        <IconMessage size={12} />
                                                                    </ThemeIcon>
                                                                    <Text size="xs" fw={600} c="blue.7">
                                                                        Resposta do Prestador
                                                                    </Text>
                                                                </Group>
                                                                <Text size="sm" c="blue.9" style={{ lineHeight: 1.6 }}>
                                                                    {review.provider_response}
                                                                </Text>
                                                            </Paper>
                                                        )}

                                                        {/* Edit Warning */}
                                                        {canEdit(review) && getDaysRemaining(review) <= 2 && (
                                                            <Alert
                                                                icon={<IconAlertCircle size={16} />}
                                                                color="yellow"
                                                                variant="light"
                                                                mt="sm"
                                                                radius="sm"
                                                            >
                                                                <Text size="xs">
                                                                    Pode editar esta avaliação por mais {getDaysRemaining(review)} dia(s).
                                                                </Text>
                                                            </Alert>
                                                        )}
                                                    </Paper>
                                                )}
                                            </Transition>
                                        ))}
                                    </Stack>
                                )}

                                {reviews.last_page > 1 && (
                                    <>
                                        <Divider my="lg" />
                                        <Group justify="center">
                                            <Pagination
                                                value={reviews.current_page}
                                                total={reviews.last_page}
                                                onChange={handlePageChange}
                                                withEdges
                                            />
                                        </Group>
                                    </>
                                )}
                            </Card>
                        )}
                    </Transition>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
