import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    Divider,
} from '@mantine/core';
import {
    IconCheck,
    IconWallet,
    IconReceipt,
    IconArrowRight,
} from '@tabler/icons-react';
import { PageProps } from '@/types';

interface Payment {
    id: number;
    amount: number;
    formatted_amount: string;
    status: string;
    gateway: string;
    created_at: string;
}

interface Props extends PageProps {
    payment?: Payment;
}

export default function TopUpSuccess({ auth, payment }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Recarga Concluída" />

            <Container size="sm" py="xl">
                <Stack gap="xl">
                    {/* Success Header */}
                    <Paper p="xl" radius="md" withBorder bg="gradient-to-r from-green-50 to-emerald-50">
                        <Stack align="center" gap="md">
                            <ThemeIcon size={80} radius="xl" color="green" variant="light">
                                <IconCheck size={48} stroke={3} />
                            </ThemeIcon>
                            <div style={{ textAlign: 'center' }}>
                                <Title order={2} c="green">Recarga Concluída com Sucesso!</Title>
                                <Text c="dimmed" size="sm" mt="xs">
                                    Sua carteira foi recarregada e o saldo está disponível para uso
                                </Text>
                            </div>
                        </Stack>
                    </Paper>

                    {/* Payment Details */}
                    {payment && (
                        <Card p="xl" radius="md" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <IconReceipt size={20} color="gray" />
                                        <Text fw={500}>Detalhes da Transação</Text>
                                    </Group>
                                </Group>

                                <Divider />

                                <Group justify="space-between">
                                    <Text c="dimmed" size="sm">Valor recarregado:</Text>
                                    <Text fw={700} size="xl" c="green">
                                        {payment.amount.toLocaleString('pt-AO')} AOA
                                    </Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text c="dimmed" size="sm">Método de pagamento:</Text>
                                    <Text fw={500} size="sm">
                                        {payment.gateway === 'stripe' ? 'Stripe' : 'Simulação'}
                                    </Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text c="dimmed" size="sm">ID da transação:</Text>
                                    <Text fw={500} size="sm" c="dimmed">
                                        #{payment.id}
                                    </Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text c="dimmed" size="sm">Data e hora:</Text>
                                    <Text fw={500} size="sm">
                                        {new Date(payment.created_at).toLocaleString('pt-PT')}
                                    </Text>
                                </Group>
                            </Stack>
                        </Card>
                    )}

                    {/* What's Next */}
                    <Paper p="xl" radius="md" withBorder bg="blue.0">
                        <Stack gap="sm">
                            <Text fw={600} size="lg">O que fazer agora?</Text>
                            <Text size="sm" c="dimmed">
                                Seu saldo está disponível imediatamente! Você pode:
                            </Text>
                            <Stack gap="xs" mt="xs">
                                <Group gap="xs">
                                    <IconCheck size={16} color="green" />
                                    <Text size="sm">Contratar serviços na plataforma</Text>
                                </Group>
                                <Group gap="xs">
                                    <IconCheck size={16} color="green" />
                                    <Text size="sm">Ver histórico de transações na carteira</Text>
                                </Group>
                                <Group gap="xs">
                                    <IconCheck size={16} color="green" />
                                    <Text size="sm">Explorar prestadores e serviços disponíveis</Text>
                                </Group>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Actions */}
                    <Stack gap="sm">
                        <Button
                            size="lg"
                            color="green"
                            fullWidth
                            leftSection={<IconWallet size={20} />}
                            onClick={() => router.visit(route('wallet.index'))}
                        >
                            Ver Minha Carteira
                        </Button>

                        <Button
                            size="lg"
                            variant="light"
                            fullWidth
                            rightSection={<IconArrowRight size={20} />}
                            onClick={() => router.visit(route('services.index'))}
                        >
                            Explorar Serviços
                        </Button>
                    </Stack>

                    <Text size="xs" c="dimmed" ta="center">
                        Um comprovante foi enviado para o seu email
                    </Text>
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
