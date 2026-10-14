import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Group,
    Stack,
    Button,
    Paper,
    Avatar,
    Textarea,
    Badge,
    ActionIcon,
    Switch,
    Alert,
    Divider,
    ThemeIcon,
    Title,
    Box,
    Select,
    Image,
    SimpleGrid,
    Radio,
} from '@mantine/core';
import {
    IconStar,
    IconArrowLeft,
    IconEyeOff,
    IconInfoCircle,
    IconUser,
    IconCheck,
    IconBriefcase,
    IconCalendar,
} from '@tabler/icons-react';
import { useState } from 'react';

interface Provider {
    id: number;
    display_name: string;
    description: string | null;
    avatar: string | null;
    rating: number;
    total_reviews: number;
}

interface Service {
    id: number;
    name: string;
    description: string | null;
    price: string;
    image: string | null;
}

interface CompletedOrder {
    id: number;
    reference: string;
    service_id: number;
    service_name: string;
    completed_at: string | null;
}

interface Props {
    provider: Provider;
    services: Service[];
    completedOrders: CompletedOrder[];
}

export default function CreateForProvider({ provider, services, completedOrders }: Props) {
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
        completedOrders.length > 0 ? completedOrders[0].service_id : (services.length > 0 ? services[0].id : null)
    );
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
        completedOrders.length > 0 ? completedOrders[0].id : null
    );

    const form = useForm({
        provider_id: provider.id,
        service_id: selectedServiceId,
        order_id: selectedOrderId,
        rating: 0,
        comment: '',
        is_anonymous: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.setData('service_id', selectedServiceId);
        form.setData('order_id', selectedOrderId);
        form.post(route('reviews.store-provider'));
    };

    const getRatingLabel = (rating: number): string => {
        const labels: { [key: number]: string } = {
            1: 'Muito Mau',
            2: 'Mau',
            3: 'Razoavel',
            4: 'Bom',
            5: 'Excelente',
        };
        return labels[rating] || 'Selecione uma avaliacao';
    };

    const getRatingColor = (rating: number): string => {
        if (rating >= 4) return 'green';
        if (rating >= 3) return 'yellow';
        if (rating >= 2) return 'orange';
        if (rating >= 1) return 'red';
        return 'gray';
    };

    const canSubmit = form.data.rating > 0 && selectedServiceId !== null;

    const renderStars = (size: number = 40) => (
        <Group gap="xs" justify="center">
            {[1, 2, 3, 4, 5].map((star) => (
                <ActionIcon
                    key={star}
                    variant="transparent"
                    size={size + 12}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => form.setData('rating', star)}
                    style={{ transition: 'transform 0.15s ease' }}
                    className="hover:scale-110"
                >
                    <IconStar
                        size={size}
                        fill={(hoverRating || form.data.rating) >= star ? '#fab005' : 'none'}
                        stroke={1.5}
                        color={(hoverRating || form.data.rating) >= star ? '#fab005' : '#dee2e6'}
                    />
                </ActionIcon>
            ))}
        </Group>
    );

    const handleOrderSelect = (orderId: number) => {
        setSelectedOrderId(orderId);
        const order = completedOrders.find(o => o.id === orderId);
        if (order) {
            setSelectedServiceId(order.service_id);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <Group>
                    <Link href={route('providers.show', provider.id)}>
                        <IconArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Avaliar Prestador
                    </h2>
                </Group>
            }
        >
            <Head title={`Avaliar ${provider.display_name}`} />

            <div className="py-8">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {/* Provider Info */}
                    <Card shadow="sm" padding="lg" radius="lg" withBorder mb="xl">
                        <Group gap="lg" align="flex-start">
                            <Avatar
                                src={provider.avatar}
                                color="violet"
                                radius="xl"
                                size={70}
                            >
                                {provider.display_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text fw={700} size="xl">{provider.display_name}</Text>
                                {provider.description && (
                                    <Text size="sm" c="dimmed" lineClamp={2} mb="xs">
                                        {provider.description}
                                    </Text>
                                )}
                                <Group gap="md">
                                    <Badge variant="light" color="yellow" leftSection={<IconStar size={12} />}>
                                        {provider.rating.toFixed(1)}
                                    </Badge>
                                    <Text size="sm" c="dimmed">
                                        {provider.total_reviews} avaliacoes
                                    </Text>
                                </Group>
                            </div>
                        </Group>
                    </Card>

                    <form onSubmit={handleSubmit}>
                        <Stack gap="xl">
                            {/* Select Order or Service */}
                            {completedOrders.length > 0 ? (
                                <Card shadow="sm" padding="lg" radius="lg" withBorder>
                                    <Stack gap="md">
                                        <Group gap="xs">
                                            <ThemeIcon size="sm" variant="light" color="green">
                                                <IconCheck size={14} />
                                            </ThemeIcon>
                                            <Text fw={600}>Selecione o servico que contratou</Text>
                                        </Group>
                                        <Text size="sm" c="dimmed">
                                            A sua avaliacao sera marcada como "Compra Verificada"
                                        </Text>

                                        <Radio.Group
                                            value={selectedOrderId?.toString() || ''}
                                            onChange={(value) => handleOrderSelect(parseInt(value))}
                                        >
                                            <Stack gap="sm">
                                                {completedOrders.map((order) => (
                                                    <Paper
                                                        key={order.id}
                                                        p="md"
                                                        withBorder
                                                        radius="md"
                                                        className={`cursor-pointer transition-all ${selectedOrderId === order.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}`}
                                                        onClick={() => handleOrderSelect(order.id)}
                                                    >
                                                        <Group justify="space-between">
                                                            <Group gap="sm">
                                                                <Radio value={order.id.toString()} />
                                                                <div>
                                                                    <Text fw={500}>{order.service_name}</Text>
                                                                    <Group gap="xs">
                                                                        <Badge size="xs" variant="light">
                                                                            #{order.reference}
                                                                        </Badge>
                                                                        {order.completed_at && (
                                                                            <Text size="xs" c="dimmed">
                                                                                <IconCalendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                                                {order.completed_at}
                                                                            </Text>
                                                                        )}
                                                                    </Group>
                                                                </div>
                                                            </Group>
                                                            <Badge color="green" variant="filled" size="xs">
                                                                Verificado
                                                            </Badge>
                                                        </Group>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </Radio.Group>
                                    </Stack>
                                </Card>
                            ) : services.length > 0 ? (
                                <Card shadow="sm" padding="lg" radius="lg" withBorder>
                                    <Stack gap="md">
                                        <Group gap="xs">
                                            <ThemeIcon size="sm" variant="light" color="blue">
                                                <IconBriefcase size={14} />
                                            </ThemeIcon>
                                            <Text fw={600}>Selecione um servico para avaliar</Text>
                                        </Group>

                                        <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
                                            Nao encontramos pedidos concluidos. A sua avaliacao nao sera marcada como verificada.
                                        </Alert>

                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                            {services.map((service) => (
                                                <Paper
                                                    key={service.id}
                                                    p="md"
                                                    withBorder
                                                    radius="md"
                                                    className={`cursor-pointer transition-all ${selectedServiceId === service.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}`}
                                                    onClick={() => {
                                                        setSelectedServiceId(service.id);
                                                        setSelectedOrderId(null);
                                                    }}
                                                >
                                                    <Group gap="sm" align="flex-start">
                                                        <Radio
                                                            checked={selectedServiceId === service.id}
                                                            onChange={() => {
                                                                setSelectedServiceId(service.id);
                                                                setSelectedOrderId(null);
                                                            }}
                                                        />
                                                        {service.image && (
                                                            <Image
                                                                src={service.image}
                                                                width={60}
                                                                height={60}
                                                                radius="md"
                                                                alt={service.name}
                                                            />
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                            <Text fw={500} size="sm" lineClamp={1}>
                                                                {service.name}
                                                            </Text>
                                                            <Text size="xs" c="blue" fw={500}>
                                                                {service.price}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                </Paper>
                                            ))}
                                        </SimpleGrid>
                                    </Stack>
                                </Card>
                            ) : (
                                <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
                                    Este prestador nao tem servicos publicados para avaliar.
                                </Alert>
                            )}

                            {/* Rating */}
                            <Card shadow="sm" padding="xl" radius="lg" withBorder>
                                <Stack gap="xl">
                                    <Box ta="center">
                                        <ThemeIcon size={60} radius="xl" variant="light" color="violet" mx="auto" mb="md">
                                            <IconUser size={30} />
                                        </ThemeIcon>
                                        <Title order={3} mb="xs">Como avalia o prestador?</Title>
                                        <Text c="dimmed" size="sm">
                                            Avalie o atendimento e profissionalismo de "{provider.display_name}"
                                        </Text>
                                    </Box>

                                    <Paper p="lg" bg="gray.0" radius="md">
                                        <Stack align="center" gap="md">
                                            {renderStars()}
                                            <Badge
                                                size="lg"
                                                variant="light"
                                                color={getRatingColor(hoverRating || form.data.rating)}
                                            >
                                                {getRatingLabel(hoverRating || form.data.rating)}
                                            </Badge>
                                        </Stack>
                                    </Paper>

                                    <Textarea
                                        label="Comentario (opcional)"
                                        placeholder="Como foi a sua experiencia com este prestador? A comunicacao foi boa? Foi pontual e profissional?"
                                        minRows={4}
                                        maxLength={1000}
                                        value={form.data.comment}
                                        onChange={(e) => form.setData('comment', e.target.value)}
                                    />
                                </Stack>
                            </Card>

                            {/* Anonymous Option */}
                            <Card shadow="sm" padding="lg" radius="lg" withBorder>
                                <Group justify="space-between" align="flex-start">
                                    <div style={{ flex: 1 }}>
                                        <Group gap="xs" mb={4}>
                                            <IconEyeOff size={18} className="text-gray-600" />
                                            <Text fw={500} size="sm">Avaliacao Anonima</Text>
                                        </Group>
                                        <Text size="xs" c="dimmed">
                                            O seu nome nao sera visivel. A avaliacao aparecera como "Utilizador Anonimo".
                                        </Text>
                                    </div>
                                    <Switch
                                        checked={form.data.is_anonymous}
                                        onChange={(e) => form.setData('is_anonymous', e.currentTarget.checked)}
                                        color="blue"
                                    />
                                </Group>
                            </Card>

                            {/* Submit */}
                            <Group justify="space-between">
                                <Button
                                    variant="light"
                                    component={Link}
                                    href={route('providers.show', provider.id)}
                                    leftSection={<IconArrowLeft size={16} />}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    loading={form.processing}
                                    disabled={!canSubmit}
                                    color="green"
                                    leftSection={<IconCheck size={18} />}
                                >
                                    Publicar Avaliacao
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
