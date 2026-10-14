import { Head, router } from '@inertiajs/react';
import { Card, Text, Button, Group, Stack, Divider, Image, Badge } from '@mantine/core';
import { IconCreditCard, IconX, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';

interface Payment {
    id: number;
    amount: string;
    currency: string;
    formatted_amount: string;
    service: {
        id: number;
        name: string;
        cover_url: string | null;
    };
    highlight_plan: {
        name: string;
        duration_days: number;
        duration_label: string;
    };
}

interface Props {
    payment: Payment;
}

export default function SimulatedCheckout({ payment }: Props) {
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
            <Head title="Checkout - Simulação" />

            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Card shadow="lg" padding="xl" radius="md" className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <Badge color="orange" size="lg" mb="md">
                            Modo de Simulação
                        </Badge>
                        <Text size="xl" fw={700}>
                            Checkout de Pagamento
                        </Text>
                        <Text c="dimmed" size="sm">
                            Este é um ambiente de teste. Nenhum pagamento real será processado.
                        </Text>
                    </div>

                    <Divider my="md" />

                    {/* Order Summary */}
                    <Stack gap="md">
                        <Group wrap="nowrap" gap="md">
                            {payment.service.cover_url && (
                                <Image
                                    src={payment.service.cover_url}
                                    alt={payment.service.name}
                                    w={80}
                                    h={60}
                                    radius="md"
                                    fit="cover"
                                />
                            )}
                            <div className="flex-1">
                                <Text fw={500} size="sm" lineClamp={1}>
                                    {payment.service.name}
                                </Text>
                                <Text c="dimmed" size="xs">
                                    {payment.highlight_plan.name} - {payment.highlight_plan.duration_label}
                                </Text>
                            </div>
                        </Group>

                        <Divider />

                        <Group justify="space-between">
                            <Text fw={500}>Total a pagar:</Text>
                            <Text fw={700} size="xl" c="blue">
                                {payment.formatted_amount}
                            </Text>
                        </Group>
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
