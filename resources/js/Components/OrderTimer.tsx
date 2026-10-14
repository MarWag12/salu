import { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Group,
    Stack,
    Text,
    Textarea,
    Modal,
    NumberInput,
    Alert,
} from '@mantine/core';
import {
    IconPlayerPlay,
    IconPlayerPause,
    IconPlayerStop,
    IconClock,
    IconAlertTriangle,
    IconCurrencyDollar,
} from '@tabler/icons-react';
import { useOrderTimer } from '@/hooks/useOrderTimer';
import { notifications } from '@mantine/notifications';

interface OrderTimerProps {
    orderId: number;
    isProvider: boolean;
    hourlyRate: number;
    currency?: string;
}

export default function OrderTimer({
    orderId,
    isProvider,
    hourlyRate,
    currency = 'AOA',
}: OrderTimerProps) {
    const {
        status,
        elapsedSeconds,
        formattedTime,
        isLoading,
        error,
        start,
        pause,
        resume,
        stop,
        dispute,
    } = useOrderTimer(orderId);

    const [pauseModalOpen, setPauseModalOpen] = useState(false);
    const [pauseReason, setPauseReason] = useState('');
    const [stopModalOpen, setStopModalOpen] = useState(false);
    const [stopNotes, setStopNotes] = useState('');
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputedHours, setDisputedHours] = useState(0);

    // Calculate current price based on elapsed time
    const hoursWorked = elapsedSeconds / 3600;
    const currentPrice = hourlyRate * hoursWorked;

    // Don't show timer if service doesn't have one
    if (!status.has_timer) {
        return null;
    }

    // Handle start
    const handleStart = async () => {
        try {
            await start();
            notifications.show({
                title: 'Cronómetro iniciado',
                message: 'O cronómetro foi iniciado com sucesso.',
                color: 'green',
            });
        } catch (err: any) {
            notifications.show({
                title: 'Erro',
                message: err.message,
                color: 'red',
            });
        }
    };

    // Handle pause
    const handlePause = async () => {
        try {
            await pause(pauseReason || undefined);
            setPauseModalOpen(false);
            setPauseReason('');
            notifications.show({
                title: 'Cronómetro pausado',
                message: 'O cronómetro foi pausado.',
                color: 'yellow',
            });
        } catch (err: any) {
            notifications.show({
                title: 'Erro',
                message: err.message,
                color: 'red',
            });
        }
    };

    // Handle resume
    const handleResume = async () => {
        try {
            await resume();
            notifications.show({
                title: 'Cronómetro retomado',
                message: 'O cronómetro foi retomado.',
                color: 'green',
            });
        } catch (err: any) {
            notifications.show({
                title: 'Erro',
                message: err.message,
                color: 'red',
            });
        }
    };

    // Handle stop
    const handleStop = async () => {
        try {
            const result = await stop(stopNotes || undefined);
            setStopModalOpen(false);
            setStopNotes('');

            if (result.needs_additional_payment) {
                notifications.show({
                    title: 'Cronómetro parado',
                    message: `Tempo total: ${result.formatted_time}. Valor adicional necessário: ${result.price_difference.toFixed(2)} ${currency}`,
                    color: 'orange',
                    autoClose: 10000,
                });
            } else {
                notifications.show({
                    title: 'Cronómetro parado',
                    message: `Tempo total: ${result.formatted_time}`,
                    color: 'green',
                });
            }
        } catch (err: any) {
            notifications.show({
                title: 'Erro',
                message: err.message,
                color: 'red',
            });
        }
    };

    // Handle dispute
    const handleDispute = async () => {
        try {
            const disputedSeconds = Math.floor(disputedHours * 3600);
            await dispute(disputeReason, disputedSeconds);
            setDisputeModalOpen(false);
            setDisputeReason('');
            setDisputedHours(0);
            notifications.show({
                title: 'Disputa registada',
                message: 'A sua disputa foi registada. A nossa equipa irá analisar o caso.',
                color: 'blue',
            });
        } catch (err: any) {
            notifications.show({
                title: 'Erro',
                message: err.message,
                color: 'red',
            });
        }
    };

    // Get status color
    const getStatusColor = () => {
        if (status.status === 'active') return 'green';
        if (status.status === 'paused') return 'yellow';
        if (status.status === 'stopped') return 'gray';
        return 'gray';
    };

    // Get status label
    const getStatusLabel = () => {
        if (status.status === 'active') return 'Ativo';
        if (status.status === 'paused') return 'Pausado';
        if (status.status === 'stopped') return 'Parado';
        return 'Inativo';
    };

    return (
        <>
            <Card withBorder shadow="sm" radius="md" p="lg">
                <Stack gap="md">
                    <Group justify="space-between">
                        <Group gap="xs">
                            <IconClock size={20} />
                            <Text fw={600} size="lg">
                                Cronómetro de Serviço
                            </Text>
                        </Group>
                        <Badge color={getStatusColor()} variant="filled">
                            {getStatusLabel()}
                        </Badge>
                    </Group>

                    {error && (
                        <Alert color="red" title="Erro">
                            {error}
                        </Alert>
                    )}

                    {/* Timer Display */}
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '20px',
                            background: status.is_active ? '#f0fdf4' : '#f9fafb',
                            borderRadius: '8px',
                        }}
                    >
                        <Text
                            size="48px"
                            fw={700}
                            style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                            c={status.is_active ? 'green' : 'gray'}
                        >
                            {formattedTime}
                        </Text>
                    </div>

                    {/* Info */}
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">
                                Taxa Horária
                            </Text>
                            <Group gap={4}>
                                <IconCurrencyDollar size={16} />
                                <Text fw={600}>
                                    {hourlyRate.toFixed(2)} {currency}/h
                                </Text>
                            </Group>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">
                                Valor Atual
                            </Text>
                            <Text fw={600} c="green">
                                {currentPrice.toFixed(2)} {currency}
                            </Text>
                        </div>
                        {status.pause_count !== undefined && status.pause_count > 0 && (
                            <div>
                                <Text size="xs" c="dimmed">
                                    Pausas
                                </Text>
                                <Text fw={600}>{status.pause_count}x</Text>
                            </div>
                        )}
                    </Group>

                    {/* Provider Controls */}
                    {isProvider && (
                        <Group gap="xs">
                            {!status.is_active && status.status !== 'stopped' && (
                                <>
                                    {status.status === 'paused' ? (
                                        <Button
                                            leftSection={<IconPlayerPlay size={16} />}
                                            onClick={handleResume}
                                            loading={isLoading}
                                            color="green"
                                            fullWidth
                                        >
                                            Retomar
                                        </Button>
                                    ) : (
                                        <Button
                                            leftSection={<IconPlayerPlay size={16} />}
                                            onClick={handleStart}
                                            loading={isLoading}
                                            color="green"
                                            fullWidth
                                        >
                                            Iniciar Cronómetro
                                        </Button>
                                    )}
                                </>
                            )}

                            {status.is_active && status.status === 'active' && (
                                <>
                                    <Button
                                        leftSection={<IconPlayerPause size={16} />}
                                        onClick={() => setPauseModalOpen(true)}
                                        loading={isLoading}
                                        color="yellow"
                                        variant="light"
                                        style={{ flex: 1 }}
                                    >
                                        Pausar
                                    </Button>
                                    <Button
                                        leftSection={<IconPlayerStop size={16} />}
                                        onClick={() => setStopModalOpen(true)}
                                        loading={isLoading}
                                        color="red"
                                        variant="light"
                                        style={{ flex: 1 }}
                                    >
                                        Parar
                                    </Button>
                                </>
                            )}
                        </Group>
                    )}

                    {/* Client View */}
                    {!isProvider && (
                        <Alert color="blue" icon={<IconClock size={16} />}>
                            <Text size="sm">
                                O prestador controla o cronómetro. O tempo é registado automaticamente.
                            </Text>
                        </Alert>
                    )}

                    {/* Client Dispute Button */}
                    {!isProvider &&
                        status.status === 'stopped' &&
                        !status.is_disputed && (
                            <Button
                                leftSection={<IconAlertTriangle size={16} />}
                                onClick={() => setDisputeModalOpen(true)}
                                color="orange"
                                variant="light"
                            >
                                Disputar Tempo Registado
                            </Button>
                        )}

                    {status.is_disputed && (
                        <Alert color="orange" title="Disputa em análise">
                            A sua disputa está a ser analisada pela nossa equipa.
                        </Alert>
                    )}
                </Stack>
            </Card>

            {/* Pause Modal */}
            <Modal
                opened={pauseModalOpen}
                onClose={() => setPauseModalOpen(false)}
                title="Pausar Cronómetro"
            >
                <Stack gap="md">
                    <Text size="sm">
                        Deseja pausar o cronómetro? Pode opcionalmente adicionar uma razão.
                    </Text>
                    <Textarea
                        label="Razão (opcional)"
                        placeholder="Ex: Pausa para almoço"
                        value={pauseReason}
                        onChange={(e) => setPauseReason(e.target.value)}
                        maxLength={500}
                    />
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            onClick={() => setPauseModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handlePause} loading={isLoading} color="yellow">
                            Pausar
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Stop Modal */}
            <Modal
                opened={stopModalOpen}
                onClose={() => setStopModalOpen(false)}
                title="Parar Cronómetro"
            >
                <Stack gap="md">
                    <Alert color="orange" title="Atenção">
                        Ao parar o cronómetro, o tempo será finalizado e o valor será calculado.
                        Esta ação não pode ser revertida.
                    </Alert>
                    <div>
                        <Text size="sm" fw={600}>
                            Tempo Total: {formattedTime}
                        </Text>
                        <Text size="sm" fw={600}>
                            Valor Calculado: {currentPrice.toFixed(2)} {currency}
                        </Text>
                    </div>
                    <Textarea
                        label="Notas finais (opcional)"
                        placeholder="Adicione notas sobre o trabalho realizado..."
                        value={stopNotes}
                        onChange={(e) => setStopNotes(e.target.value)}
                        maxLength={1000}
                        rows={4}
                    />
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            onClick={() => setStopModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleStop} loading={isLoading} color="red">
                            Parar Cronómetro
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Dispute Modal */}
            <Modal
                opened={disputeModalOpen}
                onClose={() => setDisputeModalOpen(false)}
                title="Disputar Tempo Registado"
            >
                <Stack gap="md">
                    <Alert color="orange" icon={<IconAlertTriangle size={16} />}>
                        Use esta opção se acredita que o tempo registado não está correcto.
                    </Alert>
                    <div>
                        <Text size="sm" fw={600}>
                            Tempo Registado: {formattedTime} ({hoursWorked.toFixed(2)}h)
                        </Text>
                        <Text size="sm" fw={600}>
                            Valor: {currentPrice.toFixed(2)} {currency}
                        </Text>
                    </div>
                    <NumberInput
                        label="Tempo que considera correcto (horas)"
                        placeholder="Ex: 2.5"
                        value={disputedHours}
                        onChange={(val) => setDisputedHours(Number(val) || 0)}
                        min={0}
                        step={0.25}
                        decimalScale={2}
                        required
                    />
                    <Textarea
                        label="Razão da disputa"
                        placeholder="Explique porque considera que o tempo está incorreto..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        maxLength={1000}
                        rows={4}
                        required
                    />
                    <Group justify="flex-end">
                        <Button
                            variant="subtle"
                            onClick={() => setDisputeModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDispute}
                            loading={isLoading}
                            color="orange"
                            disabled={!disputeReason || disputedHours <= 0}
                        >
                            Enviar Disputa
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
