import { Head, router } from '@inertiajs/react';
import { Card, Text, Loader, Stack, Center } from '@mantine/core';
import { useEffect } from 'react';

interface Payment {
    id: number;
}

interface Service {
    id: number;
    name: string;
}

interface Props {
    payment: Payment;
    service: Service;
}

export default function Processing({ payment, service }: Props) {
    useEffect(() => {
        // Poll for payment status every 3 seconds
        const interval = setInterval(() => {
            router.reload({ only: ['payment'] });
        }, 3000);

        // Timeout after 2 minutes
        const timeout = setTimeout(() => {
            clearInterval(interval);
            router.get(route('provider.services.index'));
        }, 120000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    return (
        <>
            <Head title="A processar pagamento..." />

            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <Card shadow="lg" padding="xl" radius="md" className="w-full max-w-md">
                    <Center>
                        <Stack align="center" gap="lg">
                            <Loader size="xl" />
                            <div className="text-center">
                                <Text size="xl" fw={700} mb="xs">
                                    A processar pagamento...
                                </Text>
                                <Text c="dimmed" size="sm">
                                    Por favor aguarde enquanto confirmamos o seu pagamento.
                                </Text>
                                <Text c="dimmed" size="xs" mt="md">
                                    Serviço: {service.name}
                                </Text>
                            </div>
                        </Stack>
                    </Center>
                </Card>
            </div>
        </>
    );
}
