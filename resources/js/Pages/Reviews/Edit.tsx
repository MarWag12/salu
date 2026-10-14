import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Group,
    Stack,
    Button,
    Avatar,
    Textarea,
    ActionIcon,
    Alert,
    Switch,
} from '@mantine/core';
import { IconStar, IconArrowLeft, IconAlertCircle, IconEyeOff, IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';

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
    description: string;
    price: number;
    service_provider: ServiceProvider;
}

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    is_anonymous: boolean;
    created_at: string;
    service: Service;
}

interface Props {
    review: Review;
    auth: {
        user: User;
    };
}

export default function Edit({ review, auth }: Props) {
    const [hoverRating, setHoverRating] = useState(0);

    const form = useForm({
        rating: review.rating,
        comment: review.comment || '',
        is_anonymous: review.is_anonymous || false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.patch(route('reviews.update', review.id));
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 0,
        }).format(value);
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

    const getDaysRemaining = (): number => {
        const createdAt = new Date(review.created_at);
        const daysPassed = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, 7 - daysPassed);
    };

    return (
        <AuthenticatedLayout
            header={
                <Group>
                    <Link href={route('reviews.index')}>
                        <IconArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Editar Avaliação
                    </h2>
                </Group>
            }
        >
            <Head title="Editar Avaliação" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    {/* Time Warning */}
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        color="yellow"
                        mb="lg"
                    >
                        Pode editar esta avaliação durante mais {getDaysRemaining()} dias.
                        Após este período, a avaliação não poderá ser alterada.
                    </Alert>

                    {/* Service Info */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                        <Group gap="md">
                            <Avatar color="blue" radius="xl" size="xl">
                                {review.service.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text fw={600} size="lg">{review.service.name}</Text>
                                <Text size="sm" c="dimmed">
                                    {review.service.service_provider.trading_name ||
                                        review.service.service_provider.company_name ||
                                        review.service.service_provider.user.name}
                                </Text>
                                <Text size="sm" c="blue" fw={500}>
                                    {formatCurrency(review.service.price)}
                                </Text>
                            </div>
                        </Group>
                    </Card>

                    {/* Edit Form */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <form onSubmit={handleSubmit}>
                            <Stack gap="lg">
                                {/* Rating */}
                                <div>
                                    <Text fw={500} mb="sm">A sua avaliação</Text>
                                    <Stack align="center" gap="xs">
                                        <Group gap="xs">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <ActionIcon
                                                    key={star}
                                                    variant="transparent"
                                                    size="xl"
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => form.setData('rating', star)}
                                                >
                                                    <IconStar
                                                        size={36}
                                                        fill={(hoverRating || form.data.rating) >= star ? 'currentColor' : 'none'}
                                                        className={
                                                            (hoverRating || form.data.rating) >= star
                                                                ? 'text-yellow-400'
                                                                : 'text-gray-300'
                                                        }
                                                    />
                                                </ActionIcon>
                                            ))}
                                        </Group>
                                        {(hoverRating || form.data.rating) > 0 && (
                                            <Text size="sm" c="dimmed">
                                                {getRatingLabel(hoverRating || form.data.rating)}
                                            </Text>
                                        )}
                                    </Stack>
                                    {form.errors.rating && (
                                        <Text size="xs" c="red" ta="center" mt="xs">
                                            {form.errors.rating}
                                        </Text>
                                    )}
                                </div>

                                {/* Comment */}
                                <Textarea
                                    label="Comentário (opcional)"
                                    placeholder="Partilhe a sua experiência com este serviço..."
                                    minRows={4}
                                    maxLength={2000}
                                    value={form.data.comment}
                                    onChange={(e) => form.setData('comment', e.target.value)}
                                    error={form.errors.comment}
                                />

                                {/* Anonymous Option */}
                                <Card withBorder p="md" radius="md" bg="gray.0">
                                    <Group justify="space-between" align="flex-start">
                                        <div style={{ flex: 1 }}>
                                            <Group gap="xs" mb={4}>
                                                <IconEyeOff size={18} className="text-gray-600" />
                                                <Text fw={500} size="sm">Avaliação Anónima</Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                O seu nome não será visível para outros utilizadores.
                                                A avaliação aparecerá como "Utilizador Anónimo".
                                            </Text>
                                        </div>
                                        <Switch
                                            checked={form.data.is_anonymous}
                                            onChange={(e) => form.setData('is_anonymous', e.currentTarget.checked)}
                                            color="blue"
                                        />
                                    </Group>
                                </Card>

                                {form.data.is_anonymous && (
                                    <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                                        A sua avaliação será publicada anonimamente.
                                    </Alert>
                                )}

                                {/* Actions */}
                                <Group justify="flex-end">
                                    <Button
                                        component={Link}
                                        href={route('reviews.index')}
                                        variant="light"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={form.processing}
                                        disabled={form.data.rating === 0}
                                    >
                                        Guardar Alterações
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
