import { useState, useEffect } from 'react';
import {
    Card,
    Stack,
    Text,
    Group,
    Button,
    Checkbox,
    Progress,
    Badge,
    ActionIcon,
    Textarea,
    TextInput,
    NumberInput,
    Modal,
    Select,
    Alert,
    Divider,
} from '@mantine/core';
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconCheck,
    IconClock,
    IconMapPin,
    IconCurrencyDollar,
} from '@tabler/icons-react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

interface Task {
    id: number;
    task_type: string | null;
    description: string;
    location: string | null;
    duration_minutes: number | null;
    formatted_duration: string;
    value_charged: number | null;
    formatted_value: string;
    status: 'pending' | 'in_progress' | 'completed';
    completed_at: string | null;
    created_at: string;
}

interface TaskSummary {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    pending_tasks: number;
    total_duration: number;
    total_value: number;
}

interface OrderTaskListProps {
    orderId: number;
    isProvider: boolean;
}

export default function OrderTaskList({ orderId, isProvider }: OrderTaskListProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [summary, setSummary] = useState<TaskSummary>({
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        pending_tasks: 0,
        total_duration: 0,
        total_value: 0,
    });
    const [loading, setLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Form state
    const [taskType, setTaskType] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [durationMinutes, setDurationMinutes] = useState<number | undefined>();
    const [valueCharged, setValueCharged] = useState<number | undefined>();
    const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

    // Fetch tasks
    const fetchTasks = async () => {
        try {
            const response = await axios.get(`/orders/${orderId}/tasks`);
            setTasks(response.data.tasks);
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [orderId]);

    // Reset form
    const resetForm = () => {
        setTaskType('');
        setDescription('');
        setLocation('');
        setDurationMinutes(undefined);
        setValueCharged(undefined);
        setStatus('pending');
    };

    // Add task
    const handleAddTask = async () => {
        if (!description.trim()) {
            notifications.show({
                title: 'Erro',
                message: 'A descrição é obrigatória',
                color: 'red',
            });
            return;
        }

        try {
            await axios.post(`/orders/${orderId}/tasks`, {
                task_type: taskType || null,
                description,
                location: location || null,
                duration_minutes: durationMinutes,
                value_charged: valueCharged,
                status,
            });

            notifications.show({
                title: 'Sucesso',
                message: 'Tarefa adicionada',
                color: 'green',
            });

            setAddModalOpen(false);
            resetForm();
            fetchTasks();
        } catch (error: any) {
            notifications.show({
                title: 'Erro',
                message: error.response?.data?.error || 'Erro ao adicionar tarefa',
                color: 'red',
            });
        }
    };

    // Edit task
    const handleEditTask = async () => {
        if (!editingTask || !description.trim()) return;

        try {
            await axios.patch(`/orders/${orderId}/tasks/${editingTask.id}`, {
                task_type: taskType || null,
                description,
                location: location || null,
                duration_minutes: durationMinutes,
                value_charged: valueCharged,
                status,
            });

            notifications.show({
                title: 'Sucesso',
                message: 'Tarefa atualizada',
                color: 'green',
            });

            setEditModalOpen(false);
            setEditingTask(null);
            resetForm();
            fetchTasks();
        } catch (error: any) {
            notifications.show({
                title: 'Erro',
                message: error.response?.data?.error || 'Erro ao atualizar tarefa',
                color: 'red',
            });
        }
    };

    // Delete task
    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Tem certeza que deseja remover esta tarefa?')) return;

        try {
            await axios.delete(`/orders/${orderId}/tasks/${taskId}`);

            notifications.show({
                title: 'Sucesso',
                message: 'Tarefa removida',
                color: 'green',
            });

            fetchTasks();
        } catch (error: any) {
            notifications.show({
                title: 'Erro',
                message: error.response?.data?.error || 'Erro ao remover tarefa',
                color: 'red',
            });
        }
    };

    // Toggle task status
    const handleToggleTask = async (taskId: number) => {
        try {
            await axios.post(`/orders/${orderId}/tasks/${taskId}/toggle`);
            fetchTasks();
        } catch (error: any) {
            notifications.show({
                title: 'Erro',
                message: error.response?.data?.error || 'Erro ao atualizar tarefa',
                color: 'red',
            });
        }
    };

    // Open edit modal
    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setTaskType(task.task_type || '');
        setDescription(task.description);
        setLocation(task.location || '');
        setDurationMinutes(task.duration_minutes || undefined);
        setValueCharged(task.value_charged || undefined);
        setStatus(task.status);
        setEditModalOpen(true);
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'green';
            case 'in_progress':
                return 'blue';
            case 'pending':
                return 'gray';
            default:
                return 'gray';
        }
    };

    // Get status label
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completa';
            case 'in_progress':
                return 'Em Progresso';
            case 'pending':
                return 'Pendente';
            default:
                return status;
        }
    };

    // Calculate progress
    const progress = summary.total_tasks > 0
        ? (summary.completed_tasks / summary.total_tasks) * 100
        : 0;

    if (loading) {
        return <Text>Carregando tarefas...</Text>;
    }

    return (
        <>
            <Card withBorder shadow="sm" radius="md" p="lg">
                <Stack gap="md">
                    <Group justify="space-between">
                        <div>
                            <Text fw={600} size="lg">
                                Tarefas do Serviço
                            </Text>
                            <Text size="sm" c="dimmed">
                                {summary.completed_tasks} de {summary.total_tasks} completas
                            </Text>
                        </div>
                        {isProvider && (
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={() => {
                                    resetForm();
                                    setAddModalOpen(true);
                                }}
                                size="sm"
                            >
                                Adicionar Tarefa
                            </Button>
                        )}
                    </Group>

                    {/* Progress Bar */}
                    {summary.total_tasks > 0 && (
                        <Progress value={progress} color="green" size="lg" />
                    )}

                    {/* Summary Stats */}
                    {summary.total_tasks > 0 && (
                        <Group justify="space-between">
                            {summary.total_duration > 0 && (
                                <Group gap={4}>
                                    <IconClock size={16} />
                                    <Text size="sm">
                                        {Math.floor(summary.total_duration / 60)}h{' '}
                                        {summary.total_duration % 60}min
                                    </Text>
                                </Group>
                            )}
                            {summary.total_value > 0 && (
                                <Group gap={4}>
                                    <IconCurrencyDollar size={16} />
                                    <Text size="sm">
                                        {summary.total_value.toFixed(2)} AOA
                                    </Text>
                                </Group>
                            )}
                        </Group>
                    )}

                    <Divider />

                    {/* Tasks List */}
                    {tasks.length === 0 ? (
                        <Alert color="blue">
                            Nenhuma tarefa adicionada ainda.
                            {isProvider && ' Clique em "Adicionar Tarefa" para começar.'}
                        </Alert>
                    ) : (
                        <Stack gap="xs">
                            {tasks.map((task) => (
                                <Card
                                    key={task.id}
                                    withBorder
                                    padding="sm"
                                    style={{
                                        background:
                                            task.status === 'completed'
                                                ? '#f0fdf4'
                                                : 'white',
                                    }}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="sm" style={{ flex: 1 }}>
                                            <Checkbox
                                                checked={task.status === 'completed'}
                                                onChange={() =>
                                                    isProvider && handleToggleTask(task.id)
                                                }
                                                disabled={!isProvider}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <Group gap="xs">
                                                    <Text
                                                        fw={500}
                                                        style={{
                                                            textDecoration:
                                                                task.status === 'completed'
                                                                    ? 'line-through'
                                                                    : 'none',
                                                        }}
                                                    >
                                                        {task.description}
                                                    </Text>
                                                    {task.task_type && (
                                                        <Badge
                                                            size="sm"
                                                            color={getStatusColor(task.status)}
                                                            variant="light"
                                                        >
                                                            {task.task_type}
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Group gap="md" mt={4}>
                                                    {task.location && (
                                                        <Group gap={4}>
                                                            <IconMapPin size={12} />
                                                            <Text size="xs" c="dimmed">
                                                                {task.location}
                                                            </Text>
                                                        </Group>
                                                    )}
                                                    {task.duration_minutes && (
                                                        <Group gap={4}>
                                                            <IconClock size={12} />
                                                            <Text size="xs" c="dimmed">
                                                                {task.formatted_duration}
                                                            </Text>
                                                        </Group>
                                                    )}
                                                    {task.value_charged && (
                                                        <Group gap={4}>
                                                            <IconCurrencyDollar size={12} />
                                                            <Text size="xs" c="dimmed">
                                                                {task.formatted_value}
                                                            </Text>
                                                        </Group>
                                                    )}
                                                </Group>
                                            </div>
                                        </Group>
                                        {isProvider && (
                                            <Group gap={4}>
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="blue"
                                                    onClick={() => openEditModal(task)}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        )}
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Card>

            {/* Add Task Modal */}
            <Modal
                opened={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                title="Adicionar Tarefa"
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Tipo de Tarefa (opcional)"
                        placeholder="Ex: Reparação, Instalação"
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva a tarefa..."
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                    <TextInput
                        label="Localização (opcional)"
                        placeholder="Ex: Sala, Escritório"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    <Group grow>
                        <NumberInput
                            label="Duração (minutos)"
                            placeholder="Ex: 60"
                            value={durationMinutes}
                            onChange={(val) => setDurationMinutes(val as number)}
                            min={0}
                        />
                        <NumberInput
                            label="Valor (AOA)"
                            placeholder="Ex: 1000"
                            value={valueCharged}
                            onChange={(val) => setValueCharged(val as number)}
                            min={0}
                            decimalScale={2}
                        />
                    </Group>
                    <Select
                        label="Estado"
                        value={status}
                        onChange={(val) =>
                            setStatus(val as 'pending' | 'in_progress' | 'completed')
                        }
                        data={[
                            { value: 'pending', label: 'Pendente' },
                            { value: 'in_progress', label: 'Em Progresso' },
                            { value: 'completed', label: 'Completa' },
                        ]}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setAddModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddTask} leftSection={<IconCheck size={16} />}>
                            Adicionar
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Edit Task Modal */}
            <Modal
                opened={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Editar Tarefa"
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Tipo de Tarefa (opcional)"
                        placeholder="Ex: Reparação, Instalação"
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva a tarefa..."
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                    <TextInput
                        label="Localização (opcional)"
                        placeholder="Ex: Sala, Escritório"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    <Group grow>
                        <NumberInput
                            label="Duração (minutos)"
                            placeholder="Ex: 60"
                            value={durationMinutes}
                            onChange={(val) => setDurationMinutes(val as number)}
                            min={0}
                        />
                        <NumberInput
                            label="Valor (AOA)"
                            placeholder="Ex: 1000"
                            value={valueCharged}
                            onChange={(val) => setValueCharged(val as number)}
                            min={0}
                            decimalScale={2}
                        />
                    </Group>
                    <Select
                        label="Estado"
                        value={status}
                        onChange={(val) =>
                            setStatus(val as 'pending' | 'in_progress' | 'completed')
                        }
                        data={[
                            { value: 'pending', label: 'Pendente' },
                            { value: 'in_progress', label: 'Em Progresso' },
                            { value: 'completed', label: 'Completa' },
                        ]}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setEditModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditTask} leftSection={<IconCheck size={16} />}>
                            Salvar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
