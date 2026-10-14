import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
    Container,
    Paper,
    Title,
    Text,
    Stack,
    Group,
    Button,
    ThemeIcon,
    Card,
    Badge,
    SimpleGrid,
    Table,
    ScrollArea,
    Divider,
    ActionIcon,
    Tooltip,
    Alert,
} from '@mantine/core';
import {
    IconWallet,
    IconPlus,
    IconArrowUp,
    IconArrowDown,
    IconLock,
    IconReceipt,
    IconInfoCircle,
    IconClock,
    IconCheck,
    IconX,
} from '@tabler/icons-react';
import { PageProps } from '@/types';

interface Balance {
    total_balance: number;
    available_balance: number;
    held_balance: number;
    formatted_total: string;
    formatted_available: string;
    formatted_held: string;
    currency: string;
    is_active: boolean;
}

interface Transaction {
    id: number;
    reference: string;
    type: string;
    type_label: string;
    amount: number;
    formatted_amount: string;
    description: string;
    status: string;
    status_label: string;
    status_color: string;
    created_at: string;
    order: {
        id: number;
        reference: string;
    } | null;
}

interface Hold {
    id: number;
    amount: number;
    formatted_amount: string;
    status: string;
    status_label: string;
    created_at: string;
    order: {
        id: number;
        reference: string;
        service_name: string;
    };
}

interface PendingTopUp {
    id: number;
    amount: number;
    formatted_amount: string;
    status: string;
    status_label: string;
    created_at: string;
}

interface Props extends PageProps {
    balance: Balance;
    transactions: Transaction[];
    active_holds: Hold[];
    pending_top_ups: PendingTopUp[];
}

export default function WalletIndex({ auth, balance, transactions, active_holds, pending_top_ups }: Props) {
    const { flash } = usePage().props as any;

    // Show success notification
    useEffect(() => {
        if (flash?.success) {
            notifications.show({
                title: 'Sucesso!',
                message: flash.success,
                color: 'green',
                icon: <IconCheck size={18} />,
                autoClose: 5000,
            });
        }
    }, [flash]);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'top_up':
                return <IconArrowDown size={16} color="green" />;
            case 'order_payment':
                return <IconArrowUp size={16} color="red" />;
            case 'escrow_release':
                return <IconArrowDown size={16} color="green" />;
            case 'refund':
                return <IconArrowDown size={16} color="blue" />;
            case 'platform_fee':
                return <IconArrowUp size={16} color="orange" />;
            default:
                return <IconReceipt size={16} />;
        }
    };

    const getTransactionColor = (amount: number) => {
        return amount >= 0 ? 'green' : 'red';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Minha Carteira" />

            <Container size="lg" py="xl">
                <Stack gap="xl">
                    {/* Header */}
                    <Group justify="space-between">
                        <div>
                            <Title order={2}>Minha Carteira</Title>
                            <Text c="dimmed" size="sm">
                                Gerencie seu saldo e transações
                            </Text>
                        </div>
                        <Button
                            leftSection={<IconPlus size={18} />}
                            color="green"
                            size="md"
                            onClick={() => router.visit(route('wallet.top-up'))}
                        >
                            Recarregar Carteira
                        </Button>
                    </Group>

                    {/* Balance Cards */}
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                        {/* Total Balance */}
                        <Card p="lg" radius="md" withBorder bg="gradient-to-br from-green-500 to-emerald-600" className="text-white">
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm" opacity={0.9}>Saldo Total</Text>
                                    <ThemeIcon size="lg" radius="xl" variant="white" color="green">
                                        <IconWallet size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text size="xl" fw={700}>
                                    {balance.formatted_total}
                                </Text>
                                <Text size="xs" opacity={0.8}>
                                    Saldo total na carteira
                                </Text>
                            </Stack>
                        </Card>

                        {/* Available Balance */}
                        <Card p="lg" radius="md" withBorder>
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Saldo Disponível</Text>
                                    <ThemeIcon size="lg" radius="xl" variant="light" color="blue">
                                        <IconCheck size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text size="xl" fw={700} c="blue">
                                    {balance.formatted_available}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Pode ser usado para contratar serviços
                                </Text>
                            </Stack>
                        </Card>

                        {/* Held Balance */}
                        <Card p="lg" radius="md" withBorder>
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Saldo Retido</Text>
                                    <ThemeIcon size="lg" radius="xl" variant="light" color="orange">
                                        <IconLock size={20} />
                                    </ThemeIcon>
                                </Group>
                                <Text size="xl" fw={700} c="orange">
                                    {balance.formatted_held}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Em escrow para pedidos ativos
                                </Text>
                            </Stack>
                        </Card>
                    </SimpleGrid>

                    {/* Pending Top-Up Requests */}
                    {pending_top_ups.length > 0 && (
                        <Alert icon={<IconClock size={20} />} color="yellow" variant="light">
                            <Stack gap="sm">
                                <Text size="sm" fw={500}>
                                    ⏳ Você tem {pending_top_ups.length} {pending_top_ups.length === 1 ? 'pedido' : 'pedidos'} de recarga pendente{pending_top_ups.length > 1 ? 's' : ''}
                                </Text>
                                <Divider />
                                {pending_top_ups.map((request) => (
                                    <Group key={request.id} justify="space-between">
                                        <div>
                                            <Text size="sm" fw={600}>{request.formatted_amount}</Text>
                                            <Text size="xs" c="dimmed">
                                                Solicitado em {new Date(request.created_at).toLocaleString('pt-PT')}
                                            </Text>
                                        </div>
                                        <Badge color="yellow" variant="light">
                                            Aguardando Aprovação
                                        </Badge>
                                    </Group>
                                ))}
                                <Text size="xs" c="dimmed" mt="xs">
                                    💡 Seu pedido está em análise pelo administrador. Você será notificado quando for processado.
                                </Text>
                            </Stack>
                        </Alert>
                    )}

                    {/* Active Holds */}
                    {active_holds.length > 0 && (
                        <Paper p="xl" radius="md" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={600} size="lg">Valores Retidos (Escrow)</Text>
                                        <Text size="sm" c="dimmed">
                                            Valores em escrow serão liberados após conclusão dos pedidos
                                        </Text>
                                    </div>
                                    <Badge color="orange" size="lg" variant="light">
                                        {active_holds.length} {active_holds.length === 1 ? 'ativo' : 'ativos'}
                                    </Badge>
                                </Group>

                                <Divider />

                                <ScrollArea>
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Pedido</Table.Th>
                                                <Table.Th>Serviço</Table.Th>
                                                <Table.Th>Valor</Table.Th>
                                                <Table.Th>Data</Table.Th>
                                                <Table.Th>Status</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {active_holds.map((hold) => (
                                                <Table.Tr key={hold.id}>
                                                    <Table.Td>
                                                        <Text size="sm" fw={500}>
                                                            #{hold.order.reference}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" lineClamp={1}>
                                                            {hold.order.service_name}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" fw={600} c="orange">
                                                            {hold.formatted_amount}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" c="dimmed">
                                                            {new Date(hold.created_at).toLocaleDateString('pt-PT')}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge color="orange" variant="light" size="sm">
                                                            {hold.status_label}
                                                        </Badge>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            </Stack>
                        </Paper>
                    )}

                    {/* Recent Transactions */}
                    <Paper p="xl" radius="md" withBorder>
                        <Stack gap="md">
                            <div>
                                <Text fw={600} size="lg">Transações Recentes</Text>
                                <Text size="sm" c="dimmed">
                                    Histórico das últimas {transactions.length} transações
                                </Text>
                            </div>

                            <Divider />

                            {transactions.length === 0 ? (
                                <Alert icon={<IconInfoCircle size={20} />} color="blue" variant="light">
                                    <Text size="sm">
                                        Você ainda não tem transações. Recarregue sua carteira para começar!
                                    </Text>
                                </Alert>
                            ) : (
                                <ScrollArea>
                                    <Table highlightOnHover>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Tipo</Table.Th>
                                                <Table.Th>Descrição</Table.Th>
                                                <Table.Th>Valor</Table.Th>
                                                <Table.Th>Data</Table.Th>
                                                <Table.Th>Status</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {transactions.map((transaction) => (
                                                <Table.Tr key={transaction.id}>
                                                    <Table.Td>
                                                        <Group gap="xs">
                                                            {getTransactionIcon(transaction.type)}
                                                            <Text size="sm">{transaction.type_label}</Text>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" lineClamp={1}>
                                                            {transaction.description}
                                                        </Text>
                                                        {transaction.order && (
                                                            <Text size="xs" c="dimmed">
                                                                Pedido #{transaction.order.reference}
                                                            </Text>
                                                        )}
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text
                                                            size="sm"
                                                            fw={600}
                                                            c={getTransactionColor(transaction.amount)}
                                                        >
                                                            {transaction.amount >= 0 ? '+' : ''}{transaction.formatted_amount}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" c="dimmed">
                                                            {new Date(transaction.created_at).toLocaleString('pt-PT')}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge
                                                            color={transaction.status_color}
                                                            variant="light"
                                                            size="sm"
                                                        >
                                                            {transaction.status_label}
                                                        </Badge>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </Stack>
                    </Paper>

                    {/* Info Section */}
                    <Alert icon={<IconInfoCircle size={20} />} color="blue" variant="light">
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Como funciona a Carteira Salu?</Text>
                            <Text size="sm">
                                • <strong>Saldo Total:</strong> Soma de todo o dinheiro na sua carteira
                                <br />
                                • <strong>Saldo Disponível:</strong> Pode ser usado para contratar novos serviços
                                <br />
                                • <strong>Saldo Retido:</strong> Valor em escrow para pedidos em andamento (será liberado após conclusão)
                                <br />
                                • <strong>Taxa da Plataforma:</strong> 10% cobrado apenas quando o serviço é concluído
                            </Text>
                        </Stack>
                    </Alert>
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
