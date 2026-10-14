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
    Alert,
} from '@mantine/core';
import {
    IconX,
    IconWallet,
    IconRefresh,
    IconHome,
    IconInfoCircle,
} from '@tabler/icons-react';
import { PageProps } from '@/types';

interface Payment {
    id: number;
    amount: number;
    formatted_amount: string;
    status: string;
    gateway: string;
}

interface Props extends PageProps {
    payment?: Payment;
}

export default function TopUpCancel({ auth, payment }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Recarga Cancelada" />

            <Container size="sm" py="xl">
                <Stack gap="xl">
                    {/* Cancel Header */}
                    <Paper p="xl" radius="md" withBorder bg="gradient-to-r from-red-50 to-orange-50">
                        <Stack align="center" gap="md">
                            <ThemeIcon size={80} radius="xl" color="red" variant="light">
                                <IconX size={48} stroke={3} />
                            </ThemeIcon>
                            <div style={{ textAlign: 'center' }}>
                                <Title order={2} c="red">Recarga Cancelada</Title>
                                <Text c="dimmed" size="sm" mt="xs">
                                    O processo de pagamento foi cancelado ou falhou
                                </Text>
                            </div>
                        </Stack>
                    </Paper>

                    {/* Info Alert */}
                    <Alert
                        icon={<IconInfoCircle size={20} />}
                        title="O que aconteceu?"
                        color="blue"
                        variant="light"
                    >
                        <Text size="sm">
                            Sua tentativa de recarga da carteira não foi concluída. Isso pode ter acontecido por:
                        </Text>
                        <Stack gap="xs" mt="sm">
                            <Text size="sm">• Cancelamento voluntário do pagamento</Text>
                            <Text size="sm">• Problema com o método de pagamento</Text>
                            <Text size="sm">• Erro de conexão durante o processamento</Text>
                            <Text size="sm">• Dados de pagamento inválidos</Text>
                        </Stack>
                    </Alert>

                    {/* Payment Info if available */}
                    {payment && (
                        <Card p="xl" radius="md" withBorder>
                            <Stack gap="sm">
                                <Text fw={500}>Informações da tentativa:</Text>
                                <Group justify="space-between">
                                    <Text c="dimmed" size="sm">Valor:</Text>
                                    <Text fw={500} size="sm">
                                        {payment.amount.toLocaleString('pt-AO')} AOA
                                    </Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text c="dimmed" size="sm">Método:</Text>
                                    <Text fw={500} size="sm">
                                        {payment.gateway === 'stripe' ? 'Stripe' : 'Simulação'}
                                    </Text>
                                </Group>
                            </Stack>
                        </Card>
                    )}

                    {/* What to do next */}
                    <Paper p="xl" radius="md" withBorder bg="gray.0">
                        <Stack gap="sm">
                            <Text fw={600} size="lg">Não se preocupe!</Text>
                            <Text size="sm" c="dimmed">
                                Nenhum valor foi debitado da sua conta. Você pode:
                            </Text>
                            <Stack gap="xs" mt="xs">
                                <Text size="sm">✓ Tentar novamente com o mesmo ou outro método de pagamento</Text>
                                <Text size="sm">✓ Verificar os dados do seu cartão antes de tentar novamente</Text>
                                <Text size="sm">✓ Escolher um valor diferente se preferir</Text>
                                <Text size="sm">✓ Contactar o suporte se o problema persistir</Text>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Actions */}
                    <Stack gap="sm">
                        <Button
                            size="lg"
                            color="green"
                            fullWidth
                            leftSection={<IconRefresh size={20} />}
                            onClick={() => router.visit(route('wallet.top-up'))}
                        >
                            Tentar Novamente
                        </Button>

                        <Group grow>
                            <Button
                                size="lg"
                                variant="light"
                                leftSection={<IconWallet size={20} />}
                                onClick={() => router.visit(route('wallet.index'))}
                            >
                                Minha Carteira
                            </Button>

                            <Button
                                size="lg"
                                variant="light"
                                color="gray"
                                leftSection={<IconHome size={20} />}
                                onClick={() => router.visit(route('home'))}
                            >
                                Página Inicial
                            </Button>
                        </Group>
                    </Stack>

                    <Text size="xs" c="dimmed" ta="center">
                        Precisa de ajuda? Entre em contacto com o nosso suporte
                    </Text>
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
