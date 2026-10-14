import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
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
    ActionIcon,
    Tooltip,
    Alert,
} from '@mantine/core';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconStar,
    IconBuildingBank,
    IconDeviceMobile,
    IconCreditCard,
    IconCheck,
    IconArrowLeft,
} from '@tabler/icons-react';

interface PayoutMethod {
    id: number;
    type: string;
    name: string;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
    iban: string | null;
    phone_number: string | null;
    provider_name: string | null;
    is_default: boolean;
    is_verified: boolean;
}

interface Props {
    payoutMethods: PayoutMethod[];
    types: Record<string, string>;
    banks: Record<string, string>;
    mobileProviders: Record<string, string>;
}

export default function PayoutMethods({ payoutMethods, types }: Props) {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bank_transfer':
                return <IconBuildingBank size={16} />;
            case 'mobile_money':
                return <IconDeviceMobile size={16} />;
            case 'express':
                return <IconCreditCard size={16} />;
            default:
                return <IconCreditCard size={16} />;
        }
    };

    const getMethodDetails = (method: PayoutMethod) => {
        if (method.type === 'bank_transfer') {
            return `${method.bank_name} - ****${method.account_number?.slice(-4)}`;
        }
        if (method.type === 'mobile_money') {
            return `${method.provider_name} - ****${method.phone_number?.slice(-4)}`;
        }
        return method.name;
    };

    const handleDelete = (method: PayoutMethod) => {
        if (confirm(`Tem certeza que deseja remover "${method.name}"?`)) {
            router.delete(route('provider.payout-methods.destroy', method.id));
        }
    };

    const handleSetDefault = (method: PayoutMethod) => {
        router.post(route('provider.payout-methods.set-default', method.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Métodos de Pagamento" />

            <Container size="lg" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href={route('provider.wallet')}
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                        >
                            Voltar à Carteira
                        </Button>
                    </Group>

                    <Group justify="space-between">
                        <div>
                            <Title order={2}>Métodos de Pagamento</Title>
                            <Text c="dimmed" size="sm">
                                Configure como deseja receber os seus ganhos
                            </Text>
                        </div>
                        <Button
                            component={Link}
                            href={route('provider.payout-methods.create')}
                            leftSection={<IconPlus size={16} />}
                        >
                            Adicionar Método
                        </Button>
                    </Group>

                    {payoutMethods.length === 0 ? (
                        <Alert color="blue">
                            <Text size="sm">
                                Ainda não tem métodos de pagamento configurados. Adicione um para poder receber os seus ganhos.
                            </Text>
                        </Alert>
                    ) : (
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Nome</Table.Th>
                                        <Table.Th>Tipo</Table.Th>
                                        <Table.Th>Detalhes</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Ações</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {payoutMethods.map((method) => (
                                        <Table.Tr key={method.id}>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Text size="sm" fw={500}>
                                                        {method.name}
                                                    </Text>
                                                    {method.is_default && (
                                                        <Badge
                                                            size="xs"
                                                            color="violet"
                                                            leftSection={<IconStar size={10} />}
                                                        >
                                                            Padrão
                                                        </Badge>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    {getTypeIcon(method.type)}
                                                    <Text size="sm">
                                                        {types[method.type]}
                                                    </Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {getMethodDetails(method)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                {method.is_verified ? (
                                                    <Badge color="green" leftSection={<IconCheck size={10} />}>
                                                        Verificado
                                                    </Badge>
                                                ) : (
                                                    <Badge color="yellow">Pendente</Badge>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    {!method.is_default && (
                                                        <Tooltip label="Definir como padrão">
                                                            <ActionIcon
                                                                variant="light"
                                                                size="sm"
                                                                color="violet"
                                                                onClick={() => handleSetDefault(method)}
                                                            >
                                                                <IconStar size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip label="Editar">
                                                        <ActionIcon
                                                            component={Link}
                                                            href={route('provider.payout-methods.edit', method.id)}
                                                            variant="light"
                                                            size="sm"
                                                        >
                                                            <IconEdit size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Remover">
                                                        <ActionIcon
                                                            variant="light"
                                                            size="sm"
                                                            color="red"
                                                            onClick={() => handleDelete(method)}
                                                        >
                                                            <IconTrash size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Card>
                    )}
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
