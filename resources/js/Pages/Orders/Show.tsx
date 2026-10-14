import { Head, Link, useForm, router } from '@inertiajs/react';
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
    Divider,
    Textarea,
    Modal,
    Timeline,
    Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconClipboardList,
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconMessage,
    IconStar,
    IconClock,
    IconTruck,
    IconPlayerPlay,
    IconArrowLeft,
} from '@tabler/icons-react';
import { useState } from 'react';
import OrderTimer from '@/Components/OrderTimer';
import OrderTaskList from '@/Components/OrderTaskList';

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
    price: number;
    price_type: string;
    price_min: number;
    description: string;
}

interface Conversation {
    id: number;
}

interface Review {
    id: number;
    rating: number;
    comment: string;
}

interface Order {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    status_color: string;
    agreed_price: number;
    service_fee: number;
    requirements: string | null;
    delivery_notes: string | null;
    cancellation_reason: string | null;
    dispute_reason: string | null;
    created_at: string;
    accepted_at: string | null;
    started_at: string | null;
    delivered_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    service: Service;
    client: User;
    provider: ServiceProvider;
    conversation: Conversation | null;
    review: Review | null;
}

interface Props {
    order: Order;
    canReview: boolean;
    isProvider: boolean;
    isClient: boolean;
    auth: {
        user: User;
    };
}

export default function Show({ order, canReview, isProvider, isClient, auth }: Props) {
    const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false);
    const [disputeOpened, { open: openDispute, close: closeDispute }] = useDisclosure(false);
    const [deliverOpened, { open: openDeliver, close: closeDeliver }] = useDisclosure(false);

    const cancelForm = useForm({ reason: '' });
    const disputeForm = useForm({ reason: '' });
    const deliverForm = useForm({ delivery_notes: '' });

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDateTime = (dateString: string | null): string => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleAccept = () => {
        router.post(route('orders.accept', order.id));
    };

    const handleStart = () => {
        router.post(route('orders.start', order.id));
    };

    const handleDeliver = () => {
        deliverForm.post(route('orders.deliver', order.id), {
            onSuccess: () => closeDeliver(),
        });
    };

    const handleComplete = () => {
        router.post(route('orders.complete', order.id));
    };

    const handleCancel = () => {
        cancelForm.post(route('orders.cancel', order.id), {
            onSuccess: () => closeCancel(),
        });
    };

    const handleDispute = () => {
        disputeForm.post(route('orders.dispute', order.id), {
            onSuccess: () => closeDispute(),
        });
    };

    const getTimelineItems = () => {
        const items: Array<{
            title: string;
            date: string | null;
            active: boolean;
            icon: React.ReactNode;
        }> = [
            {
                title: 'Pedido Criado',
                date: order.created_at,
                active: true,
                icon: <IconClipboardList size={14} />,
            },
        ];

        if (order.accepted_at || order.status !== 'pending') {
            items.push({
                title: 'Pedido Aceite',
                date: order.accepted_at,
                active: !!order.accepted_at,
                icon: <IconCheck size={14} />,
            });
        }

        if (order.started_at || ['in_progress', 'delivered', 'completed'].includes(order.status)) {
            items.push({
                title: 'Trabalho Iniciado',
                date: order.started_at,
                active: !!order.started_at,
                icon: <IconPlayerPlay size={14} />,
            });
        }

        if (order.delivered_at || ['delivered', 'completed'].includes(order.status)) {
            items.push({
                title: 'Serviço Entregue',
                date: order.delivered_at,
                active: !!order.delivered_at,
                icon: <IconTruck size={14} />,
            });
        }

        if (order.completed_at || order.status === 'completed') {
            items.push({
                title: 'Pedido Concluído',
                date: order.completed_at,
                active: !!order.completed_at,
                icon: <IconCheck size={14} />,
            });
        }

        if (order.cancelled_at) {
            items.push({
                title: 'Pedido Cancelado',
                date: order.cancelled_at,
                active: true,
                icon: <IconX size={14} />,
            });
        }

        return items;
    };

    return (
        <AuthenticatedLayout
            header={
                <Group>
                    <Link href={route('orders.index')}>
                        <IconArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Pedido {order.reference}
                    </h2>
                </Group>
            }
        >
            <Head title={`Pedido ${order.reference}`} />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Order Status */}
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600} size="lg">Estado do Pedido</Text>
                                    <Badge color={order.status_color} size="lg">
                                        {order.status_label}
                                    </Badge>
                                </Group>

                                <Timeline active={getTimelineItems().filter(i => i.active).length - 1} bulletSize={24} lineWidth={2}>
                                    {getTimelineItems().map((item, index) => (
                                        <Timeline.Item
                                            key={index}
                                            bullet={item.icon}
                                            title={item.title}
                                            color={item.active ? 'blue' : 'gray'}
                                        >
                                            <Text size="xs" c="dimmed">
                                                {formatDateTime(item.date)}
                                            </Text>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>

                                {order.cancellation_reason && (
                                    <Alert color="red" icon={<IconX />} mt="md" title="Motivo do Cancelamento">
                                        {order.cancellation_reason}
                                    </Alert>
                                )}

                                {order.dispute_reason && (
                                    <Alert color="orange" icon={<IconAlertTriangle />} mt="md" title="Motivo da Disputa">
                                        {order.dispute_reason}
                                    </Alert>
                                )}
                            </Card>

                            {/* Service Details */}
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Text fw={600} size="lg" mb="md">Detalhes do Serviço</Text>

                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Text c="dimmed">Serviço</Text>
                                        <Text fw={500}>{order.service.name}</Text>
                                    </Group>

                                    <Group justify="space-between">
                                        <Text c="dimmed">Preço Acordado</Text>
                                        <Text fw={600} c="blue">{formatCurrency(order.agreed_price)}</Text>
                                    </Group>

                                    {isProvider && (
                                        <>
                                            <Group justify="space-between">
                                                <Text c="dimmed">Taxa da Plataforma</Text>
                                                <Text c="red">-{formatCurrency(order.service_fee)}</Text>
                                            </Group>
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text fw={500}>Valor a Receber</Text>
                                                <Text fw={700} c="green">
                                                    {formatCurrency(order.agreed_price - order.service_fee)}
                                                </Text>
                                            </Group>
                                        </>
                                    )}
                                </Stack>
                            </Card>

                            {/* Timer - Only for hourly services in progress */}
                            {order.service.price_type === 'hourly' && order.status === 'in_progress' && (
                                <OrderTimer
                                    orderId={order.id}
                                    isProvider={isProvider}
                                    hourlyRate={order.service.price_min}
                                    currency="AOA"
                                />
                            )}

                            {/* Task List - Show when order is accepted or in progress */}
                            {['accepted', 'in_progress', 'delivered', 'completed'].includes(order.status) && (
                                <OrderTaskList
                                    orderId={order.id}
                                    isProvider={isProvider}
                                />
                            )}

                            {/* Requirements */}
                            {order.requirements && (
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Text fw={600} size="lg" mb="md">Requisitos do Cliente</Text>
                                    <Text>{order.requirements}</Text>
                                </Card>
                            )}

                            {/* Delivery Notes */}
                            {order.delivery_notes && (
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Text fw={600} size="lg" mb="md">Notas de Entrega</Text>
                                    <Text>{order.delivery_notes}</Text>
                                </Card>
                            )}

                            {/* Actions */}
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Text fw={600} size="lg" mb="md">Acções</Text>

                                <Group>
                                    {/* Provider Actions */}
                                    {isProvider && (
                                        <>
                                            {order.status === 'pending' && (
                                                <>
                                                    <Button color="green" onClick={handleAccept}>
                                                        Aceitar Pedido
                                                    </Button>
                                                    <Button color="red" variant="light" onClick={openCancel}>
                                                        Recusar
                                                    </Button>
                                                </>
                                            )}

                                            {order.status === 'accepted' && (
                                                <Button color="blue" onClick={handleStart}>
                                                    Iniciar Trabalho
                                                </Button>
                                            )}

                                            {order.status === 'in_progress' && (
                                                <Button color="teal" onClick={openDeliver}>
                                                    Marcar como Entregue
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {/* Client Actions */}
                                    {isClient && (
                                        <>
                                            {order.status === 'delivered' && (
                                                <>
                                                    <Button color="green" onClick={handleComplete}>
                                                        Confirmar Recepção
                                                    </Button>
                                                    <Button color="orange" variant="light" onClick={openDispute}>
                                                        Abrir Disputa
                                                    </Button>
                                                </>
                                            )}

                                            {['in_progress'].includes(order.status) && (
                                                <Button color="orange" variant="light" onClick={openDispute}>
                                                    Abrir Disputa
                                                </Button>
                                            )}

                                            {canReview && (
                                                <Button
                                                    component={Link}
                                                    href={route('reviews.create', order.service.id)}
                                                    color="yellow"
                                                    leftSection={<IconStar size={16} />}
                                                >
                                                    Avaliar Serviço
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {/* Common Actions */}
                                    {['pending', 'accepted'].includes(order.status) && (
                                        <Button color="red" variant="light" onClick={openCancel}>
                                            Cancelar Pedido
                                        </Button>
                                    )}

                                    {order.conversation && (
                                        <Button
                                            component={Link}
                                            href={route('messages.show', order.conversation.id)}
                                            variant="light"
                                            leftSection={<IconMessage size={16} />}
                                        >
                                            Ver Conversa
                                        </Button>
                                    )}
                                </Group>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Contact Card */}
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Text fw={600} size="lg" mb="md">
                                    {isProvider ? 'Cliente' : 'Prestador'}
                                </Text>

                                <Stack align="center" gap="sm">
                                    <Avatar size="xl" color="blue" radius="xl">
                                        {isProvider
                                            ? order.client.name.charAt(0).toUpperCase()
                                            : order.provider.user.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Text fw={500} ta="center">
                                        {isProvider
                                            ? order.client.name
                                            : order.provider.trading_name || order.provider.company_name || order.provider.user.name}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {isProvider ? order.client.email : order.provider.user.email}
                                    </Text>
                                </Stack>
                            </Card>

                            {/* Review Card */}
                            {order.review && (
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Text fw={600} size="lg" mb="md">Avaliação</Text>

                                    <Stack gap="sm">
                                        <Group justify="center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <IconStar
                                                    key={star}
                                                    size={24}
                                                    fill={star <= order.review!.rating ? 'currentColor' : 'none'}
                                                    className={star <= order.review!.rating ? 'text-yellow-400' : 'text-gray-300'}
                                                />
                                            ))}
                                        </Group>
                                        {order.review.comment && (
                                            <Text size="sm" ta="center" c="dimmed">
                                                "{order.review.comment}"
                                            </Text>
                                        )}
                                    </Stack>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            <Modal opened={cancelOpened} onClose={closeCancel} title="Cancelar Pedido">
                <Stack>
                    <Text size="sm" c="dimmed">
                        Tem a certeza que deseja cancelar este pedido? Esta acção não pode ser desfeita.
                    </Text>
                    <Textarea
                        label="Motivo do cancelamento"
                        placeholder="Explique porque está a cancelar..."
                        required
                        value={cancelForm.data.reason}
                        onChange={(e) => cancelForm.setData('reason', e.target.value)}
                        error={cancelForm.errors.reason}
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={closeCancel}>Voltar</Button>
                        <Button
                            color="red"
                            onClick={handleCancel}
                            loading={cancelForm.processing}
                        >
                            Confirmar Cancelamento
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Dispute Modal */}
            <Modal opened={disputeOpened} onClose={closeDispute} title="Abrir Disputa">
                <Stack>
                    <Text size="sm" c="dimmed">
                        A nossa equipa irá analisar a situação e entrar em contacto consigo.
                    </Text>
                    <Textarea
                        label="Descreva o problema"
                        placeholder="Explique detalhadamente o que aconteceu..."
                        required
                        minRows={4}
                        value={disputeForm.data.reason}
                        onChange={(e) => disputeForm.setData('reason', e.target.value)}
                        error={disputeForm.errors.reason}
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={closeDispute}>Voltar</Button>
                        <Button
                            color="orange"
                            onClick={handleDispute}
                            loading={disputeForm.processing}
                        >
                            Abrir Disputa
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Deliver Modal */}
            <Modal opened={deliverOpened} onClose={closeDeliver} title="Marcar como Entregue">
                <Stack>
                    <Text size="sm" c="dimmed">
                        Confirme que o serviço foi entregue ao cliente.
                    </Text>
                    <Textarea
                        label="Notas de entrega (opcional)"
                        placeholder="Adicione informações relevantes sobre a entrega..."
                        value={deliverForm.data.delivery_notes}
                        onChange={(e) => deliverForm.setData('delivery_notes', e.target.value)}
                        error={deliverForm.errors.delivery_notes}
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={closeDeliver}>Voltar</Button>
                        <Button
                            color="teal"
                            onClick={handleDeliver}
                            loading={deliverForm.processing}
                        >
                            Confirmar Entrega
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </AuthenticatedLayout>
    );
}
