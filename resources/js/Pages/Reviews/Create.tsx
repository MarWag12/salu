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
    Stepper,
    Transition,
} from '@mantine/core';
import {
    IconStar,
    IconArrowLeft,
    IconEyeOff,
    IconInfoCircle,
    IconBriefcase,
    IconUser,
    IconCheck,
    IconStarFilled,
} from '@tabler/icons-react';
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
    display_name: string;
    user: User;
}

interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    service_provider: ServiceProvider;
}

interface Order {
    id: number;
    reference: string;
}

interface Props {
    service: Service;
    order: Order | null;
    auth: {
        user: User;
    };
}

export default function Create({ service, order, auth }: Props) {
    const [step, setStep] = useState(0);
    const [hoverServiceRating, setHoverServiceRating] = useState(0);
    const [hoverProviderRating, setHoverProviderRating] = useState(0);

    const form = useForm({
        service_id: service.id,
        order_id: order?.id || null,
        // Service rating
        service_rating: 0,
        service_comment: '',
        // Provider rating
        provider_rating: 0,
        provider_comment: '',
        // Common
        is_anonymous: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('reviews.store'));
    };

    const formatCurrency = (value: number | null | undefined): string => {
        if (value === null || value === undefined || isNaN(value)) {
            return 'Preço a combinar';
        }
        return new Intl.NumberFormat('pt-AO', {
            style: 'decimal',
            minimumFractionDigits: 0,
        }).format(value) + ' Kz';
    };

    const getRatingLabel = (rating: number): string => {
        const labels: { [key: number]: string } = {
            1: 'Muito Mau',
            2: 'Mau',
            3: 'Razoável',
            4: 'Bom',
            5: 'Excelente',
        };
        return labels[rating] || 'Selecione uma avaliação';
    };

    const getRatingColor = (rating: number): string => {
        if (rating >= 4) return 'green';
        if (rating >= 3) return 'yellow';
        if (rating >= 2) return 'orange';
        if (rating >= 1) return 'red';
        return 'gray';
    };

    const providerName = service.service_provider.display_name ||
        service.service_provider.trading_name ||
        service.service_provider.company_name ||
        service.service_provider.user.name;

    const canProceedToStep2 = form.data.service_rating > 0;
    const canSubmit = form.data.service_rating > 0 && form.data.provider_rating > 0;

    const renderStars = (
        currentRating: number,
        hoverRating: number,
        setHover: (value: number) => void,
        setRating: (value: number) => void,
        size: number = 40
    ) => (
        <Group gap="xs" justify="center">
            {[1, 2, 3, 4, 5].map((star) => (
                <ActionIcon
                    key={star}
                    variant="transparent"
                    size={size + 12}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    style={{ transition: 'transform 0.15s ease' }}
                    className="hover:scale-110"
                >
                    <IconStar
                        size={size}
                        fill={(hoverRating || currentRating) >= star ? '#fab005' : 'none'}
                        stroke={1.5}
                        color={(hoverRating || currentRating) >= star ? '#fab005' : '#dee2e6'}
                    />
                </ActionIcon>
            ))}
        </Group>
    );

    return (
        <AuthenticatedLayout
            header={
                <Group>
                    <Link href={order ? route('orders.show', order.id) : route('services.show', service.id)}>
                        <IconArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Avaliar Serviço e Prestador
                    </h2>
                </Group>
            }
        >
            <Head title="Avaliar Serviço e Prestador" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {/* Service & Provider Info */}
                    <Card shadow="sm" padding="lg" radius="lg" withBorder mb="xl">
                        <Group gap="lg" align="flex-start">
                            <Avatar color="blue" radius="xl" size={70}>
                                {service.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Group gap="sm" mb="xs">
                                    <Text fw={700} size="xl">{service.name}</Text>
                                    {order && (
                                        <Badge color="green" variant="filled" leftSection={<IconCheck size={12} />}>
                                            Compra Verificada
                                        </Badge>
                                    )}
                                </Group>
                                <Text size="sm" c="dimmed" mb="xs">
                                    Prestador: <Text span fw={500}>{providerName}</Text>
                                </Text>
                                <Text size="md" c="blue" fw={600}>
                                    {formatCurrency(service.price)}
                                </Text>
                            </div>
                        </Group>
                    </Card>

                    {/* Stepper */}
                    <Stepper
                        active={step}
                        onStepClick={setStep}
                        mb="xl"
                        color="blue"
                        styles={{
                            step: { padding: 0 },
                            stepIcon: { borderWidth: 2 },
                        }}
                    >
                        <Stepper.Step
                            label="Avaliar Serviço"
                            description="Como foi o serviço?"
                            icon={<IconBriefcase size={18} />}
                            completedIcon={<IconCheck size={18} />}
                        />
                        <Stepper.Step
                            label="Avaliar Prestador"
                            description="Como foi o prestador?"
                            icon={<IconUser size={18} />}
                            completedIcon={<IconCheck size={18} />}
                        />
                        <Stepper.Step
                            label="Finalizar"
                            description="Confirmar avaliação"
                            icon={<IconStarFilled size={18} />}
                            completedIcon={<IconCheck size={18} />}
                        />
                    </Stepper>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Service Rating */}
                        <Transition mounted={step === 0} transition="fade" duration={300}>
                            {(styles) => (
                                <Card shadow="sm" padding="xl" radius="lg" withBorder style={styles}>
                                    <Stack gap="xl">
                                        <Box ta="center">
                                            <ThemeIcon size={60} radius="xl" variant="light" color="blue" mx="auto" mb="md">
                                                <IconBriefcase size={30} />
                                            </ThemeIcon>
                                            <Title order={3} mb="xs">Como avalia o serviço?</Title>
                                            <Text c="dimmed" size="sm">
                                                Avalie a qualidade do serviço "{service.name}"
                                            </Text>
                                        </Box>

                                        <Paper p="lg" bg="gray.0" radius="md">
                                            <Stack align="center" gap="md">
                                                {renderStars(
                                                    form.data.service_rating,
                                                    hoverServiceRating,
                                                    setHoverServiceRating,
                                                    (value) => form.setData('service_rating', value)
                                                )}
                                                <Badge
                                                    size="lg"
                                                    variant="light"
                                                    color={getRatingColor(hoverServiceRating || form.data.service_rating)}
                                                >
                                                    {getRatingLabel(hoverServiceRating || form.data.service_rating)}
                                                </Badge>
                                            </Stack>
                                        </Paper>

                                        <Textarea
                                            label="Comentário sobre o serviço (opcional)"
                                            placeholder="O que achou do serviço prestado? A qualidade correspondeu às expectativas?"
                                            minRows={3}
                                            maxLength={1000}
                                            value={form.data.service_comment}
                                            onChange={(e) => form.setData('service_comment', e.target.value)}
                                        />

                                        <Group justify="flex-end">
                                            <Button
                                                onClick={() => setStep(1)}
                                                disabled={!canProceedToStep2}
                                                rightSection={<IconArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
                                            >
                                                Continuar
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Card>
                            )}
                        </Transition>

                        {/* Step 2: Provider Rating */}
                        <Transition mounted={step === 1} transition="fade" duration={300}>
                            {(styles) => (
                                <Card shadow="sm" padding="xl" radius="lg" withBorder style={styles}>
                                    <Stack gap="xl">
                                        <Box ta="center">
                                            <ThemeIcon size={60} radius="xl" variant="light" color="violet" mx="auto" mb="md">
                                                <IconUser size={30} />
                                            </ThemeIcon>
                                            <Title order={3} mb="xs">Como avalia o prestador?</Title>
                                            <Text c="dimmed" size="sm">
                                                Avalie o atendimento e profissionalismo de "{providerName}"
                                            </Text>
                                        </Box>

                                        <Paper p="lg" bg="gray.0" radius="md">
                                            <Stack align="center" gap="md">
                                                {renderStars(
                                                    form.data.provider_rating,
                                                    hoverProviderRating,
                                                    setHoverProviderRating,
                                                    (value) => form.setData('provider_rating', value)
                                                )}
                                                <Badge
                                                    size="lg"
                                                    variant="light"
                                                    color={getRatingColor(hoverProviderRating || form.data.provider_rating)}
                                                >
                                                    {getRatingLabel(hoverProviderRating || form.data.provider_rating)}
                                                </Badge>
                                            </Stack>
                                        </Paper>

                                        <Textarea
                                            label="Comentário sobre o prestador (opcional)"
                                            placeholder="Como foi a comunicação? O prestador foi pontual e profissional?"
                                            minRows={3}
                                            maxLength={1000}
                                            value={form.data.provider_comment}
                                            onChange={(e) => form.setData('provider_comment', e.target.value)}
                                        />

                                        <Group justify="space-between">
                                            <Button variant="light" onClick={() => setStep(0)} leftSection={<IconArrowLeft size={16} />}>
                                                Voltar
                                            </Button>
                                            <Button
                                                onClick={() => setStep(2)}
                                                disabled={form.data.provider_rating === 0}
                                                rightSection={<IconArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
                                            >
                                                Continuar
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Card>
                            )}
                        </Transition>

                        {/* Step 3: Confirmation */}
                        <Transition mounted={step === 2} transition="fade" duration={300}>
                            {(styles) => (
                                <Card shadow="sm" padding="xl" radius="lg" withBorder style={styles}>
                                    <Stack gap="xl">
                                        <Box ta="center">
                                            <ThemeIcon size={60} radius="xl" variant="light" color="green" mx="auto" mb="md">
                                                <IconStarFilled size={30} />
                                            </ThemeIcon>
                                            <Title order={3} mb="xs">Confirmar Avaliações</Title>
                                            <Text c="dimmed" size="sm">
                                                Reveja as suas avaliações antes de publicar
                                            </Text>
                                        </Box>

                                        {/* Summary Cards */}
                                        <Group grow>
                                            <Paper p="md" withBorder radius="md">
                                                <Group justify="space-between" mb="xs">
                                                    <Text fw={500} size="sm">Serviço</Text>
                                                    <Badge color={getRatingColor(form.data.service_rating)} variant="filled">
                                                        {form.data.service_rating}/5
                                                    </Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed" lineClamp={2}>
                                                    {form.data.service_comment || 'Sem comentário'}
                                                </Text>
                                            </Paper>
                                            <Paper p="md" withBorder radius="md">
                                                <Group justify="space-between" mb="xs">
                                                    <Text fw={500} size="sm">Prestador</Text>
                                                    <Badge color={getRatingColor(form.data.provider_rating)} variant="filled">
                                                        {form.data.provider_rating}/5
                                                    </Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed" lineClamp={2}>
                                                    {form.data.provider_comment || 'Sem comentário'}
                                                </Text>
                                            </Paper>
                                        </Group>

                                        <Divider />

                                        {/* Anonymous Option */}
                                        <Card withBorder p="md" radius="md" bg="gray.0">
                                            <Group justify="space-between" align="flex-start">
                                                <div style={{ flex: 1 }}>
                                                    <Group gap="xs" mb={4}>
                                                        <IconEyeOff size={18} className="text-gray-600" />
                                                        <Text fw={500} size="sm">Avaliação Anónima</Text>
                                                    </Group>
                                                    <Text size="xs" c="dimmed">
                                                        O seu nome não será visível. A avaliação aparecerá como "Utilizador Anónimo".
                                                    </Text>
                                                </div>
                                                <Switch
                                                    checked={form.data.is_anonymous}
                                                    onChange={(e) => form.setData('is_anonymous', e.currentTarget.checked)}
                                                    color="blue"
                                                />
                                            </Group>
                                        </Card>

                                        {form.data.is_anonymous ? (
                                            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                                                As suas avaliações serão publicadas anonimamente.
                                                {order && ' Continuarão marcadas como "Compra Verificada".'}
                                            </Alert>
                                        ) : (
                                            <Text size="xs" c="dimmed" ta="center">
                                                As suas avaliações serão publicadas com o seu nome.
                                                {order && ' Serão marcadas como "Compra Verificada".'}
                                            </Text>
                                        )}

                                        <Group justify="space-between">
                                            <Button variant="light" onClick={() => setStep(1)} leftSection={<IconArrowLeft size={16} />}>
                                                Voltar
                                            </Button>
                                            <Button
                                                type="submit"
                                                loading={form.processing}
                                                disabled={!canSubmit}
                                                color="green"
                                                leftSection={<IconCheck size={18} />}
                                            >
                                                Publicar Avaliações
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Card>
                            )}
                        </Transition>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
