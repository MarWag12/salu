import { Head, useForm } from '@inertiajs/react';
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
    SimpleGrid,
    Progress,
    Textarea,
    Modal,
    Pagination,
    Tabs,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconStar,
    IconMessage,
    IconMessageCircle,
    IconChartBar,
} from '@tabler/icons-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Service {
    id: number;
    name: string;
}

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    provider_response: string | null;
    provider_responded_at: string | null;
    is_verified: boolean;
    created_at: string;
    user: User;
    service: Service;
}

interface PaginatedReviews {
    data: Review[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Stats {
    total: number;
    average: number;
    distribution: { [key: number]: number };
    pending_responses: number;
}

interface Props {
    reviews: PaginatedReviews;
    stats: Stats;
    pendingResponses: Review[];
    auth: {
        user: User;
    };
}

export default function ProviderIndex({ reviews, stats, pendingResponses, auth }: Props) {
    const [responseOpened, { open: openResponse, close: closeResponse }] = useDisclosure(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    const responseForm = useForm({ response: '' });

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleOpenResponse = (review: Review) => {
        setSelectedReview(review);
        responseForm.reset();
        openResponse();
    };

    const handleSubmitResponse = () => {
        if (!selectedReview) return;

        responseForm.post(route('reviews.respond', selectedReview.id), {
            onSuccess: () => {
                closeResponse();
                setSelectedReview(null);
            },
        });
    };

    const handlePageChange = (page: number) => {
        router.get(route('reviews.index'), { page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const renderStars = (rating: number, size: number = 16) => {
        return (
            <Group gap={2}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStar
                        key={star}
                        size={size}
                        fill={star <= rating ? 'currentColor' : 'none'}
                        className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </Group>
        );
    };

    const getDistributionPercentage = (rating: number): number => {
        if (stats.total === 0) return 0;
        return Math.round((stats.distribution[rating] || 0) / stats.total * 100);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Avaliações Recebidas
                    {stats.pending_responses > 0 && (
                        <Badge color="red" size="lg" ml="sm">
                            {stats.pending_responses} aguardam resposta
                        </Badge>
                    )}
                </h2>
            }
        >
            <Head title="Avaliações Recebidas" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    {/* Stats Overview */}
                    <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
                        {/* Rating Summary */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Text fw={600} size="lg" mb="md">Resumo das Avaliações</Text>

                            <Group align="flex-start" gap="xl">
                                <Stack align="center" gap={4}>
                                    <Text fw={700} size="3xl">{stats.average.toFixed(1)}</Text>
                                    {renderStars(Math.round(stats.average), 20)}
                                    <Text size="sm" c="dimmed">{stats.total} avaliações</Text>
                                </Stack>

                                <Stack gap="xs" style={{ flex: 1 }}>
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <Group key={rating} gap="xs">
                                            <Text size="sm" w={20}>{rating}</Text>
                                            <IconStar size={12} className="text-yellow-400" fill="currentColor" />
                                            <Progress
                                                value={getDistributionPercentage(rating)}
                                                size="sm"
                                                style={{ flex: 1 }}
                                                color="yellow"
                                            />
                                            <Text size="xs" c="dimmed" w={40}>
                                                {stats.distribution[rating] || 0}
                                            </Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Group>
                        </Card>

                        {/* Pending Responses */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Text fw={600} size="lg">Aguardam Resposta</Text>
                                <Badge color="orange">{pendingResponses.length}</Badge>
                            </Group>

                            {pendingResponses.length === 0 ? (
                                <Stack align="center" py="md" gap="xs">
                                    <IconMessageCircle size={32} className="text-gray-400" />
                                    <Text size="sm" c="dimmed" ta="center">
                                        Todas as avaliações foram respondidas!
                                    </Text>
                                </Stack>
                            ) : (
                                <Stack gap="sm">
                                    {pendingResponses.slice(0, 3).map((review) => (
                                        <Paper key={review.id} p="sm" withBorder radius="sm">
                                            <Group justify="space-between">
                                                <Group gap="xs">
                                                    <Avatar size="sm" color="blue" radius="xl">
                                                        {review.user.name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <div>
                                                        <Text size="xs" fw={500}>{review.user.name}</Text>
                                                        <Text size="xs" c="dimmed">{review.service.name}</Text>
                                                    </div>
                                                </Group>
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    onClick={() => handleOpenResponse(review)}
                                                >
                                                    Responder
                                                </Button>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Card>
                    </SimpleGrid>

                    {/* All Reviews */}
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Text fw={600} size="lg" mb="md">Todas as Avaliações</Text>

                        {reviews.data.length === 0 ? (
                            <Stack align="center" py="xl" gap="md">
                                <IconStar size={48} className="text-gray-400" />
                                <Text c="dimmed" ta="center">
                                    Ainda não recebeu nenhuma avaliação.
                                    <br />
                                    As avaliações aparecerão aqui quando os clientes avaliarem os seus serviços.
                                </Text>
                            </Stack>
                        ) : (
                            <Stack gap="md">
                                {reviews.data.map((review) => (
                                    <Paper key={review.id} p="md" withBorder radius="md">
                                        <Group justify="space-between" mb="sm">
                                            <Group gap="sm">
                                                <Avatar color="blue" radius="xl" size="md">
                                                    {review.user.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <div>
                                                    <Group gap="xs">
                                                        <Text fw={500} size="sm">
                                                            {review.user.name}
                                                        </Text>
                                                        {review.is_verified && (
                                                            <Badge color="green" variant="light" size="xs">
                                                                Verificado
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                    <Text size="xs" c="dimmed">
                                                        {review.service.name} • {formatDate(review.created_at)}
                                                    </Text>
                                                </div>
                                            </Group>
                                            {!review.provider_response && (
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    leftSection={<IconMessage size={14} />}
                                                    onClick={() => handleOpenResponse(review)}
                                                >
                                                    Responder
                                                </Button>
                                            )}
                                        </Group>

                                        <Group gap="xs" mb="xs">
                                            {renderStars(review.rating)}
                                        </Group>

                                        {review.comment && (
                                            <Text size="sm" mb="sm">
                                                {review.comment}
                                            </Text>
                                        )}

                                        {review.provider_response && (
                                            <Paper p="sm" bg="blue.0" radius="sm" mt="sm">
                                                <Group gap="xs" mb="xs">
                                                    <IconMessage size={14} className="text-blue-500" />
                                                    <Text size="xs" fw={500} c="blue">
                                                        Sua Resposta
                                                    </Text>
                                                </Group>
                                                <Text size="sm">
                                                    {review.provider_response}
                                                </Text>
                                            </Paper>
                                        )}
                                    </Paper>
                                ))}
                            </Stack>
                        )}

                        {reviews.last_page > 1 && (
                            <Group justify="center" mt="md">
                                <Pagination
                                    value={reviews.current_page}
                                    total={reviews.last_page}
                                    onChange={handlePageChange}
                                />
                            </Group>
                        )}
                    </Card>
                </div>
            </div>

            {/* Response Modal */}
            <Modal
                opened={responseOpened}
                onClose={closeResponse}
                title="Responder à Avaliação"
                size="lg"
            >
                {selectedReview && (
                    <Stack>
                        <Paper p="md" withBorder radius="sm" bg="gray.0">
                            <Group gap="sm" mb="xs">
                                <Avatar size="sm" color="blue" radius="xl">
                                    {selectedReview.user.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{selectedReview.user.name}</Text>
                                    <Text size="xs" c="dimmed">{selectedReview.service.name}</Text>
                                </div>
                            </Group>
                            {renderStars(selectedReview.rating)}
                            {selectedReview.comment && (
                                <Text size="sm" mt="xs">
                                    "{selectedReview.comment}"
                                </Text>
                            )}
                        </Paper>

                        <Textarea
                            label="Sua resposta"
                            placeholder="Agradeça o feedback ou esclareça qualquer questão..."
                            required
                            minRows={4}
                            value={responseForm.data.response}
                            onChange={(e) => responseForm.setData('response', e.target.value)}
                            error={responseForm.errors.response}
                        />

                        <Text size="xs" c="dimmed">
                            A sua resposta será visível publicamente junto à avaliação.
                        </Text>

                        <Group justify="flex-end">
                            <Button variant="light" onClick={closeResponse}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmitResponse}
                                loading={responseForm.processing}
                            >
                                Publicar Resposta
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
