import { Head, router } from '@inertiajs/react';
import { Card, Text, Button, Group, Stack, Divider, Badge, ThemeIcon } from '@mantine/core';
import { IconCreditCard, IconX, IconCheck, IconWallet } from '@tabler/icons-react';
import { useState } from 'react';

interface Payment {
    id: number;
    amount: string;
    currency: string;
    formatted_amount: string;
    type: string;
}

interface Props {
    payment: Payment;
}

export default function SimulatedWalletCheckout({ payment }: Props) {
    const [processing, setProcessing] = useState(false);

    const handleConfirm = () => {
        setProcessing(true);
        router.post(route('payments.simulate.confirm', { payment: payment.id }));
    };

    const handleCancel = () => {
        setProcessing(true);
        router.post(route('payments.simulate.fail', { payment: payment.id }));
    };

    return (
        <>
            <Head title="Checkout - Recarga de Carteira (Simulação)" />

            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <Card shadow="lg" padding="xl" radius="md" className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <Badge color="orange" size="lg" mb="md">
                            Modo de Simulação
                        </Badge>
                        <ThemeIcon size={80} radius="xl" color="green" variant="light" mx="auto" mb="md">
                            <IconWallet size={40} />
                        </ThemeIcon>
                        <Text size="xl" fw={700}>
                            Recarga de Carteira
                        </Text>
                        <Text c="dimmed" size="sm">
                            Este é um ambiente de teste. Nenhum pagamento real será processado.
                        </Text>
                    </div>

                    <Divider my="md" />

                    {/* Order Summary */}
                    <Stack gap="md">
                        <div className="bg-green-50 p-4 rounded-lg">
                            <Group justify="space-between" mb="xs">
                                <Text c="dimmed" size="sm">Tipo de Transação:</Text>
                                <Badge color="green" variant="light">
                                    Recarga de Carteira
                                </Badge>
                            </Group>
                            <Group justify="space-between">
                                <Text c="dimmed" size="sm">Valor a adicionar:</Text>
                                <Text fw={500} size="sm">
                                    {payment.formatted_amount}
                                </Text>
                            </Group>
                        </div>

                        <Divider />

                        <Group justify="space-between">
                            <Text fw={500}>Total a pagar:</Text>
                            <Text fw={700} size="xl" c="green">
                                {payment.formatted_amount}
                            </Text>
                        </Group>

                        <div className="bg-blue-50 p-3 rounded-lg">
                            <Text size="xs" c="dimmed" ta="center">
                                💡 Após o pagamento, o saldo será adicionado à sua carteira instantaneamente
                            </Text>
                        </div>
                    </Stack>

                    <Divider my="md" />

                    {/* Simulated Card Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <Group gap="xs" mb="sm">
                            <IconCreditCard size={20} />
                            <Text fw={500} size="sm">Cartão de Simulação</Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                            Número: 4242 4242 4242 4242
                        </Text>
                        <Text size="xs" c="dimmed">
                            Validade: 12/28 • CVV: 123
                        </Text>
                    </div>

                    {/* Actions */}
                    <Stack gap="sm">
                        <Button
                            fullWidth
                            size="lg"
                            color="green"
                            leftSection={<IconCheck size={20} />}
                            loading={processing}
                            onClick={handleConfirm}
                        >
                            Simular Pagamento com Sucesso
                        </Button>
                        <Button
                            fullWidth
                            variant="light"
                            color="red"
                            leftSection={<IconX size={20} />}
                            loading={processing}
                            onClick={handleCancel}
                        >
                            Simular Pagamento Falhado
                        </Button>
                    </Stack>

                    <Text size="xs" c="dimmed" ta="center" mt="md">
                        Ambiente de desenvolvimento - Salu Marketplace
                    </Text>
                </Card>
            </div>
        </>
    );
}
