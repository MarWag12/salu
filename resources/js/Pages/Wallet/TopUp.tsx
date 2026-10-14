import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Container,
    Paper,
    Title,
    Text,
    Stack,
    Group,
    Button,
    NumberInput,
    SimpleGrid,
    ThemeIcon,
    Alert,
    Divider,
    Badge,
    Card,
    ActionIcon,
} from '@mantine/core';
import {
    IconWallet,
    IconCreditCard,
    IconCheck,
    IconArrowRight,
    IconInfoCircle,
    IconShieldCheck,
    IconLock,
    IconCurrencyDollar,
    IconPlus,
} from '@tabler/icons-react';
import { PageProps } from '@/types';
import { useState } from 'react';

interface Props extends PageProps {
    suggested_amounts: number[];
}

export default function TopUp({ auth, suggested_amounts }: Props) {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState<number | string>('');

    // Use direct payment (internal system)
    const { data, setData, post, processing, errors } = useForm({
        amount: 0,
        payment_method: 'direct',
    });

    const handleAmountSelect = (amount: number) => {
        setSelectedAmount(amount);
        setCustomAmount('');
        setData('amount', amount);
    };

    const handleCustomAmountChange = (value: number | string) => {
        setCustomAmount(value);
        setSelectedAmount(null);
        setData('amount', typeof value === 'string' ? 0 : value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.amount < 100) {
            alert('O valor mínimo para recarga é 100 AOA');
            return;
        }

        post(route('wallet.top-up.process'), {
            onSuccess: () => {
                console.log('Top-up successful');
            },
            onError: () => {
                console.error('Top-up failed');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Recarregar Carteira" />

            <Container size="md" py="xl">
                <Stack gap="xl">
                    {/* Header */}
                    <Paper p="xl" radius="md" withBorder bg="gradient-to-r from-green-50 to-emerald-50">
                        <Group>
                            <ThemeIcon size={60} radius="xl" variant="light" color="green">
                                <IconWallet size={32} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                                <Title order={2}>Recarregar Carteira</Title>
                                <Text c="dimmed" size="sm">
                                    Adicione fundos à sua carteira Salu para contratar serviços
                                </Text>
                            </div>
                        </Group>
                    </Paper>

                    {/* Info Alert */}
                    <Alert
                        icon={<IconInfoCircle size={20} />}
                        title="Sistema de Pagamento Interno"
                        color="blue"
                        variant="light"
                    >
                        <Stack gap="xs">
                            <Text size="sm">
                                Os pagamentos são processados internamente no sistema Salu.
                                O saldo será adicionado à sua carteira instantaneamente após confirmação.
                            </Text>
                            <Group gap="lg" mt="xs">
                                <Group gap="xs">
                                    <IconShieldCheck size={16} color="green" />
                                    <Text size="xs" c="dimmed">100% Seguro</Text>
                                </Group>
                                <Group gap="xs">
                                    <IconCheck size={16} color="green" />
                                    <Text size="xs" c="dimmed">Instantâneo</Text>
                                </Group>
                            </Group>
                        </Stack>
                    </Alert>

                    {/* Suggested Amounts */}
                    <Paper p="xl" radius="md" withBorder>
                        <Stack gap="md">
                            <div>
                                <Text fw={600} size="lg" mb="xs">
                                    Valores Sugeridos
                                </Text>
                                <Text size="sm" c="dimmed">
                                    Escolha um valor rápido ou insira um valor personalizado
                                </Text>
                            </div>

                            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                                {suggested_amounts.map((amount) => (
                                    <Card
                                        key={amount}
                                        p="lg"
                                        radius="md"
                                        withBorder
                                        style={{
                                            cursor: 'pointer',
                                            borderColor: selectedAmount === amount ? '#5dba40' : undefined,
                                            borderWidth: selectedAmount === amount ? 2 : 1,
                                            backgroundColor: selectedAmount === amount ? '#f0fdf4' : undefined,
                                            transition: 'all 0.2s',
                                        }}
                                        onClick={() => handleAmountSelect(amount)}
                                    >
                                        <Stack align="center" gap="xs">
                                            <IconCurrencyDollar
                                                size={32}
                                                color={selectedAmount === amount ? '#5dba40' : '#868e96'}
                                            />
                                            <Text fw={700} size="xl">
                                                {amount.toLocaleString('pt-AO')} AOA
                                            </Text>
                                            {selectedAmount === amount && (
                                                <Badge color="green" size="sm" variant="filled">
                                                    <Group gap={4}>
                                                        <IconCheck size={12} />
                                                        Selecionado
                                                    </Group>
                                                </Badge>
                                            )}
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>

                            <Divider label="OU" labelPosition="center" my="md" />

                            {/* Custom Amount */}
                            <div>
                                <Text fw={600} mb="xs">Valor Personalizado</Text>
                                <NumberInput
                                    size="lg"
                                    placeholder="Digite o valor"
                                    min={100}
                                    max={1000000}
                                    value={customAmount}
                                    onChange={handleCustomAmountChange}
                                    leftSection={<Text fw={600} c="dimmed">AOA</Text>}
                                    rightSection={
                                        customAmount && (
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                onClick={() => handleCustomAmountChange('')}
                                            >
                                                <IconPlus size={16} />
                                            </ActionIcon>
                                        )
                                    }
                                    hideControls
                                    error={errors.amount}
                                    styles={{
                                        input: {
                                            fontSize: '1.2rem',
                                            fontWeight: 600,
                                        },
                                    }}
                                />
                                <Text size="xs" c="dimmed" mt="xs">
                                    Valor mínimo: 100 AOA
                                </Text>
                            </div>
                        </Stack>
                    </Paper>

                    {/* Payment Summary */}
                    {data.amount > 0 && (
                        <Paper p="xl" radius="md" withBorder bg="gray.0">
                            <Stack gap="md">
                                <Text fw={600} size="lg">Resumo do Pagamento</Text>

                                <Group justify="space-between">
                                    <Text c="dimmed">Valor a recarregar:</Text>
                                    <Text fw={600} size="lg">
                                        {data.amount.toLocaleString('pt-AO')} AOA
                                    </Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text c="dimmed">Taxa de processamento:</Text>
                                    <Text fw={600} c="green">
                                        Grátis
                                    </Text>
                                </Group>

                                <Divider />

                                <Group justify="space-between">
                                    <Text fw={700} size="lg">Total:</Text>
                                    <Text fw={700} size="xl" c="green">
                                        {data.amount.toLocaleString('pt-AO')} AOA
                                    </Text>
                                </Group>

                                <Button
                                    size="lg"
                                    color="green"
                                    fullWidth
                                    leftSection={<IconWallet size={20} />}
                                    rightSection={<IconCheck size={20} />}
                                    onClick={handleSubmit}
                                    loading={processing}
                                    disabled={data.amount < 100}
                                >
                                    Adicionar Saldo à Carteira
                                </Button>

                                <Text size="xs" c="dimmed" ta="center">
                                    O saldo será adicionado instantaneamente à sua carteira
                                </Text>
                            </Stack>
                        </Paper>
                    )}

                    {/* Features */}
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                        <Card p="md" radius="md" withBorder>
                            <Stack align="center" gap="xs">
                                <ThemeIcon size="lg" radius="xl" variant="light" color="green">
                                    <IconShieldCheck size={20} />
                                </ThemeIcon>
                                <Text fw={600} size="sm" ta="center">100% Seguro</Text>
                                <Text size="xs" c="dimmed" ta="center">
                                    Pagamentos protegidos com SSL
                                </Text>
                            </Stack>
                        </Card>

                        <Card p="md" radius="md" withBorder>
                            <Stack align="center" gap="xs">
                                <ThemeIcon size="lg" radius="xl" variant="light" color="blue">
                                    <IconCheck size={20} />
                                </ThemeIcon>
                                <Text fw={600} size="sm" ta="center">Instantâneo</Text>
                                <Text size="xs" c="dimmed" ta="center">
                                    Saldo disponível imediatamente
                                </Text>
                            </Stack>
                        </Card>

                        <Card p="md" radius="md" withBorder>
                            <Stack align="center" gap="xs">
                                <ThemeIcon size="lg" radius="xl" variant="light" color="yellow">
                                    <IconWallet size={20} />
                                </ThemeIcon>
                                <Text fw={600} size="sm" ta="center">Sem Taxas</Text>
                                <Text size="xs" c="dimmed" ta="center">
                                    Recarregue sem custos adicionais
                                </Text>
                            </Stack>
                        </Card>
                    </SimpleGrid>
                </Stack>
            </Container>
        </AuthenticatedLayout>
    );
}
