import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import {
    Container,
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    Textarea,
    Paper,
    ThemeIcon,
    Divider,
    Timeline,
    Alert,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconSend,
    IconShoppingCart,
    IconClock,
    IconCheck,
    IconX,
    IconSearch,
    IconMessage,
    IconAlertTriangle,
    IconUser,
    IconBriefcase,
} from '@tabler/icons-react';

interface Dispute {
    id: number;
    order: {
        id: number;
        reference: string;
        service: {
            id: number;
            title: string;
        };
        agreed_price: number;
        currency: string;
    };
    client: {
        id: number;
        name: string;
    };
    provider: {
        id: number;
        user: {
            name: string;
        };
    };
    reason: string;
    description: string;
    status: string;
    resolution_notes: string | null;
    resolved_at: string | null;
    resolved_by: {
        name: string;
    } | null;
    refund_amount: number | null;
    provider_response: {
        text: string;
        evidence: string[];
    } | null;
    provider_responded_at: string | null;
    created_at: string;
}

interface Props {
    dispute: Dispute;
    isClient: boolean;
    isProvider: boolean;
    statuses: Record<string, string>;
    reasons: Record<string, string>;
}

export default function ShowDispute({ dispute, isClient, isProvider, statuses, reasons }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        response: '',
        evidence: [] as string[],
    });

    const handleRespond = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('disputes.respond', dispute.id));
    };

    const handleCancel = () => {
        if (confirm('Tem certeza que deseja cancelar esta disputa?')) {
            router.post(route('disputes.cancel', dispute.id));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'yellow';
            case 'under_review':
                return 'blue';
            case 'resolved_client_favor':
                return 'green';
            case 'resolved_provider_favor':
                return 'teal';
            case 'cancelled':
                return 'gray';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <IconClock size={14} />;
            case 'under_review':
                return <IconSearch size={14} />;
            case 'resolved_client_favor':
            case 'resolved_provider_favor':
                return <IconCheck size={14} />;
            case 'cancelled':
                return <IconX size={14} />;
            default:
                return null;
        }
    };

    const isPending = dispute.status === 'pending';
    const isUnderReview = dispute.status === 'under_review';
    const isResolved = dispute.status.startsWith('resolved');
    const canRespond = isProvider && isPending && !dispute.provider_response;
    const canCancel = isClient && (isPending || isUnderReview);

    return (
        <AuthenticatedLayout>
            <Head title={`Disputa - ${dispute.order.reference}`} />

            <Container size="lg" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href={route('disputes.index')}
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Voltar
                        </Button>
                    </Group>

                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Title order={2}>Disputa #{dispute.id}</Title>
                            <Text c="dimmed" size="sm">
                                Pedido {dispute.order.reference}
                            </Text>
                        </div>
                        <Badge
                            color={getStatusColor(dispute.status)}
                            leftSection={getStatusIcon(dispute.status)}
                            size="lg"
                        >
                            {statuses[dispute.status]}
                        </Badge>
                    </Group>

                    <Paper p="md" withBorder radius="md">
                        <Group>
                            <ThemeIcon size="lg" variant="light" color="violet">
                                <IconShoppingCart size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="sm" c="dimmed">Pedido</Text>
                                <Text fw={500}>{dispute.order.reference}</Text>
                            </div>
                            <Divider orientation="vertical" />
                            <div>
                                <Text size="sm" c="dimmed">Serviço</Text>
                                <Text fw={500}>{dispute.order.service.title}</Text>
                            </div>
                            <Divider orientation="vertical" />
                            <div>
                                <Text size="sm" c="dimmed">Cliente</Text>
                                <Text fw={500}>{dispute.client.name}</Text>
                            </div>
                            <Divider orientation="vertical" />
                            <div>
                                <Text size="sm" c="dimmed">Prestador</Text>
                                <Text fw={500}>{dispute.provider.user.name}</Text>
                            </div>
                            <Divider orientation="vertical" />
                            <div>
                                <Text size="sm" c="dimmed">Valor</Text>
                                <Text fw={500}>
                                    {dispute.order.agreed_price?.toLocaleString('pt-AO')} {dispute.order.currency}
                                </Text>
                            </div>
                        </Group>
                    </Paper>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Stack gap="md">
                            <Title order={4}>Histórico da Disputa</Title>

                            <Timeline active={isResolved ? 3 : (isUnderReview ? 2 : 1)} bulletSize={24} lineWidth={2}>
                                <Timeline.Item
                                    bullet={<IconUser size={12} />}
                                    title="Disputa aberta pelo cliente"
                                >
                                    <Text c="dimmed" size="sm">
                                        {new Date(dispute.created_at).toLocaleString('pt-AO')}
                                    </Text>
                                    <Paper p="sm" mt="sm" withBorder bg="gray.0">
                                        <Text size="sm" fw={500} c="dimmed" mb="xs">
                                            Motivo: {reasons[dispute.reason]}
                                        </Text>
                                        <Text size="sm">{dispute.description}</Text>
                                    </Paper>
                                </Timeline.Item>

                                {dispute.provider_response ? (
                                    <Timeline.Item
                                        bullet={<IconBriefcase size={12} />}
                                        title="Resposta do prestador"
                                    >
                                        <Text c="dimmed" size="sm">
                                            {dispute.provider_responded_at &&
                                                new Date(dispute.provider_responded_at).toLocaleString('pt-AO')}
                                        </Text>
                                        <Paper p="sm" mt="sm" withBorder bg="blue.0">
                                            <Text size="sm">{dispute.provider_response.text}</Text>
                                        </Paper>
                                    </Timeline.Item>
                                ) : (
                                    <Timeline.Item
                                        bullet={<IconMessage size={12} />}
                                        title="Aguardando resposta do prestador"
                                        color="gray"
                                    >
                                        <Text c="dimmed" size="sm">
                                            O prestador ainda não respondeu
                                        </Text>
                                    </Timeline.Item>
                                )}

                                {isUnderReview && (
                                    <Timeline.Item
                                        bullet={<IconSearch size={12} />}
                                        title="Em análise pela equipa Salu"
                                        color="blue"
                                    >
                                        <Text c="dimmed" size="sm">
                                            A nossa equipa está a analisar o caso
                                        </Text>
                                    </Timeline.Item>
                                )}

                                {isResolved && (
                                    <Timeline.Item
                                        bullet={<IconCheck size={12} />}
                                        title="Disputa resolvida"
                                        color="green"
                                    >
                                        <Text c="dimmed" size="sm">
                                            {dispute.resolved_at &&
                                                new Date(dispute.resolved_at).toLocaleString('pt-AO')}
                                        </Text>
                                        {dispute.resolution_notes && (
                                            <Paper p="sm" mt="sm" withBorder bg="green.0">
                                                <Text size="sm">{dispute.resolution_notes}</Text>
                                                {dispute.refund_amount && (
                                                    <Text size="sm" fw={500} mt="xs">
                                                        Reembolso: {dispute.refund_amount.toLocaleString('pt-AO')} {dispute.order.currency}
                                                    </Text>
                                                )}
                                            </Paper>
                                        )}
                                    </Timeline.Item>
                                )}
                            </Timeline>
                        </Stack>
                    </Card>

                    {canRespond && (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <form onSubmit={handleRespond}>
                                <Stack gap="md">
                                    <Title order={4}>Responder à Disputa</Title>
                                    <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
                                        Descreva a sua versão dos factos. A equipa Salu irá analisar ambos os lados.
                                    </Alert>

                                    <Textarea
                                        label="Sua resposta"
                                        placeholder="Descreva a sua versão dos factos..."
                                        minRows={5}
                                        value={data.response}
                                        onChange={(e) => setData('response', e.target.value)}
                                        error={errors.response}
                                        required
                                    />

                                    <Group justify="flex-end">
                                        <Button
                                            type="submit"
                                            loading={processing}
                                            leftSection={<IconSend size={16} />}
                                        >
                                            Enviar Resposta
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        </Card>
                    )}

                    {canCancel && (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Stack gap="md">
                                <Title order={4}>Cancelar Disputa</Title>
                                <Text size="sm" c="dimmed">
                                    Se resolveu o problema directamente com o prestador, pode cancelar esta disputa.
                                </Text>
                                <Group>
                                    <Button
                                        variant="outline"
                                        color="red"
                                        onClick={handleCancel}
                                        leftSection={<IconX size={16} />}
                                    >
                                        Cancelar Disputa
                                    </Button>
                                </Group>
                            </Stack>
                        </Card>
                    )}
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
