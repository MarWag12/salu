import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Text, Button, Group, Stack, Badge, Image, Radio, Alert } from '@mantine/core';
import { IconStar, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';

interface HighlightPlan {
    id: number;
    name: string;
    duration_days: number;
    price: string;
    currency: string;
    formatted_price: string;
    duration_label: string;
}

interface Service {
    id: number;
    name: string;
    description: string;
    cover_url: string | null;
    category: {
        name: string;
    };
}

interface Props {
    service: Service;
    plans: HighlightPlan[];
}

export default function Highlight({ service, plans }: Props) {
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleCheckout = () => {
        if (!selectedPlan) return;

        setProcessing(true);
        router.post(
            route('provider.payments.checkout', { service: service.id }),
            {
                plan_id: selectedPlan,
                gateway: 'simulated', // For development
            },
            {
                preserveScroll: true,
                onError: () => setProcessing(false),
            }
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Destacar Serviço
                </h2>
            }
        >
            <Head title="Destacar Serviço" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <Stack gap="lg">
                        {/* Service Info */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group wrap="nowrap" gap="md">
                                {service.cover_url && (
                                    <Image
                                        src={service.cover_url}
                                        alt={service.name}
                                        w={120}
                                        h={80}
                                        radius="md"
                                        fit="cover"
                                    />
                                )}
                                <div>
                                    <Text fw={600} size="lg">{service.name}</Text>
                                    <Badge variant="light" size="sm" mt={4}>
                                        {service.category.name}
                                    </Badge>
                                </div>
                            </Group>
                        </Card>

                        {/* Benefits Alert */}
                        <Alert icon={<IconInfoCircle size={16} />} title="Vantagens do Destaque" color="blue">
                            <ul className="mt-2 space-y-1 text-sm">
                                <li>• Apareça nas primeiras posições dos resultados de pesquisa</li>
                                <li>• Badge de "Destaque" visível para clientes</li>
                                <li>• Maior visibilidade e mais contactos</li>
                            </ul>
                        </Alert>

                        {/* Plans */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Text fw={600} size="lg" mb="md">
                                Seleccione um Plano
                            </Text>

                            <Stack gap="md">
                                {plans.map((plan) => (
                                    <Card
                                        key={plan.id}
                                        withBorder
                                        padding="md"
                                        radius="md"
                                        className={`cursor-pointer transition-all ${
                                            selectedPlan === plan.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'hover:border-gray-400'
                                        }`}
                                        onClick={() => setSelectedPlan(plan.id)}
                                    >
                                        <Group justify="space-between" align="center">
                                            <Group gap="md">
                                                <Radio
                                                    checked={selectedPlan === plan.id}
                                                    onChange={() => setSelectedPlan(plan.id)}
                                                />
                                                <div>
                                                    <Text fw={500}>{plan.name}</Text>
                                                    <Text size="sm" c="dimmed">
                                                        {plan.duration_label} de destaque
                                                    </Text>
                                                </div>
                                            </Group>
                                            <Text fw={700} size="lg" c="blue">
                                                {plan.formatted_price}
                                            </Text>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>

                            <Group justify="flex-end" mt="xl">
                                <Button
                                    variant="subtle"
                                    onClick={() => router.get(route('provider.services.index'))}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    leftSection={<IconStar size={18} />}
                                    disabled={!selectedPlan || processing}
                                    loading={processing}
                                    onClick={handleCheckout}
                                >
                                    Continuar para Pagamento
                                </Button>
                            </Group>
                        </Card>

                        {/* Guarantee */}
                        <Card shadow="sm" padding="md" radius="md" withBorder>
                            <Group gap="xs">
                                <IconCheck size={20} className="text-green-600" />
                                <Text size="sm">
                                    Pagamento seguro • Activação imediata após confirmação
                                </Text>
                            </Group>
                        </Card>
                    </Stack>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
