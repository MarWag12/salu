import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    Container,
    Card,
    Title,
    Text,
    Group,
    Stack,
    Button,
    Textarea,
    Select,
    Alert,
    Paper,
    ThemeIcon,
    Divider,
} from '@mantine/core';
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconSend,
    IconShoppingCart,
} from '@tabler/icons-react';

interface Order {
    id: number;
    reference: string;
    service: {
        id: number;
        title: string;
    };
    provider: {
        id: number;
        user: {
            name: string;
        };
    };
    agreed_price: number;
    currency: string;
    status: string;
}

interface Props {
    order: Order;
    reasons: Record<string, string>;
}

export default function CreateDispute({ order, reasons }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        order_id: order.id,
        reason: '',
        description: '',
        evidence: [] as string[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('disputes.store'));
    };

    const reasonOptions = Object.entries(reasons).map(([value, label]) => ({
        value,
        label,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="Abrir Disputa" />

            <Container size="md" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href={route('orders.show', order.id)}
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Voltar ao Pedido
                        </Button>
                    </Group>

                    <div>
                        <Title order={2}>Abrir Disputa</Title>
                        <Text c="dimmed" size="sm">
                            Relate um problema com o seu pedido para que possamos ajudar a resolver
                        </Text>
                    </div>

                    <Alert
                        icon={<IconAlertTriangle size={16} />}
                        title="Antes de continuar"
                        color="yellow"
                    >
                        <Text size="sm">
                            Recomendamos que tente resolver o problema diretamente com o prestador através do chat antes de abrir uma disputa.
                            A equipa Salu irá analisar ambos os lados antes de tomar uma decisão.
                        </Text>
                    </Alert>

                    <Paper p="md" withBorder radius="md">
                        <Group>
                            <ThemeIcon size="lg" variant="light" color="violet">
                                <IconShoppingCart size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="sm" c="dimmed">Pedido</Text>
                                <Text fw={500}>{order.reference}</Text>
                            </div>
                            <Divider orientation="vertical" />
                            <div>
                                <Text size="sm" c="dimmed">Serviço</Text>
                                <Text fw={500}>{order.service.title}</Text>
                            </div>
                            <Divider orientation="vertical" />
                            <div>
                                <Text size="sm" c="dimmed">Prestador</Text>
                                <Text fw={500}>{order.provider.user.name}</Text>
                            </div>
                            <Divider orientation="vertical" />
                            <div>
                                <Text size="sm" c="dimmed">Valor</Text>
                                <Text fw={500}>
                                    {order.agreed_price?.toLocaleString('pt-AO')} {order.currency}
                                </Text>
                            </div>
                        </Group>
                    </Paper>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <form onSubmit={handleSubmit}>
                            <Stack gap="md">
                                <Select
                                    label="Motivo da disputa"
                                    placeholder="Selecione o motivo"
                                    data={reasonOptions}
                                    value={data.reason}
                                    onChange={(value) => setData('reason', value || '')}
                                    error={errors.reason}
                                    required
                                />

                                <Textarea
                                    label="Descrição detalhada"
                                    placeholder="Descreva o problema com o máximo de detalhes possível. Inclua datas, o que foi combinado e o que aconteceu."
                                    minRows={5}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    error={errors.description}
                                    required
                                />

                                <Text size="sm" c="dimmed">
                                    Mínimo de 20 caracteres. Quanto mais detalhes fornecer, mais fácil será para a nossa equipa analisar o caso.
                                </Text>

                                <Divider my="sm" />

                                <Group justify="flex-end">
                                    <Button
                                        component={Link}
                                        href={route('orders.show', order.id)}
                                        variant="default"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={processing}
                                        leftSection={<IconSend size={16} />}
                                        color="red"
                                    >
                                        Abrir Disputa
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    </Card>
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
