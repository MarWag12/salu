import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Container,
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Button,
    Table,
    Pagination,
    Alert,
} from '@mantine/core';
import {
    IconAlertTriangle,
    IconEye,
    IconCheck,
    IconX,
    IconClock,
    IconSearch,
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
    status: string;
    created_at: string;
    resolved_at: string | null;
}

interface PaginatedDisputes {
    data: Dispute[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    disputes: PaginatedDisputes;
    statuses: Record<string, string>;
}

export default function DisputesIndex({ disputes, statuses }: Props) {
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

    return (
        <AuthenticatedLayout>
            <Head title="Minhas Disputas" />

            <Container size="xl" py="xl">
                <Stack gap="lg">
                    <Group justify="space-between">
                        <div>
                            <Title order={2}>Minhas Disputas</Title>
                            <Text c="dimmed" size="sm">
                                Gerencie disputas e reembolsos dos seus pedidos
                            </Text>
                        </div>
                    </Group>

                    {disputes.data.length === 0 ? (
                        <Alert icon={<IconAlertTriangle size={16} />} color="blue">
                            Você não tem disputas abertas. As disputas aparecem quando há algum problema com um pedido.
                        </Alert>
                    ) : (
                        <Card shadow="sm" padding="md" radius="md" withBorder>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Pedido</Table.Th>
                                        <Table.Th>Serviço</Table.Th>
                                        <Table.Th>Motivo</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Data</Table.Th>
                                        <Table.Th>Ações</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {disputes.data.map((dispute) => (
                                        <Table.Tr key={dispute.id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>
                                                    {dispute.order.reference}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" lineClamp={1}>
                                                    {dispute.order.service.title}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {dispute.reason}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={getStatusColor(dispute.status)}
                                                    leftSection={getStatusIcon(dispute.status)}
                                                    size="sm"
                                                >
                                                    {statuses[dispute.status]}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {new Date(dispute.created_at).toLocaleDateString('pt-AO')}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Button
                                                    component={Link}
                                                    href={route('disputes.show', dispute.id)}
                                                    variant="light"
                                                    size="xs"
                                                    leftSection={<IconEye size={14} />}
                                                >
                                                    Ver
                                                </Button>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>

                            {disputes.last_page > 1 && (
                                <Group justify="center" mt="md">
                                    <Pagination
                                        total={disputes.last_page}
                                        value={disputes.current_page}
                                        onChange={(page) => {
                                            window.location.href = route('disputes.index', { page });
                                        }}
                                    />
                                </Group>
                            )}
                        </Card>
                    )}
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
