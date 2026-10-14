import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Text, Group, Stack, Button, Badge, ActionIcon, Pagination, Menu } from '@mantine/core';
import {
    IconBell,
    IconCheck,
    IconCheckbox,
    IconTrash,
    IconDotsVertical,
    IconMessage,
    IconShieldCheck,
    IconStar,
    IconAlertCircle
} from '@tabler/icons-react';

interface Notification {
    id: string;
    type: string;
    data: {
        message: string;
        service_id?: number;
        service_name?: string;
        conversation_id?: number;
        sender_name?: string;
        [key: string]: unknown;
    };
    read_at: string | null;
    created_at: string;
}

interface PaginatedNotifications {
    data: Notification[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    notifications: PaginatedNotifications;
    unreadCount: number;
}

export default function Index({ notifications, unreadCount }: Props) {
    const handleMarkAsRead = (id: string) => {
        router.post(route('notifications.read', id), {}, { preserveScroll: true });
    };

    const handleMarkAllAsRead = () => {
        router.post(route('notifications.read-all'), {}, { preserveScroll: true });
    };

    const handleDelete = (id: string) => {
        router.delete(route('notifications.destroy', id), { preserveScroll: true });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Agora mesmo';
        if (diffMinutes < 60) return `${diffMinutes}m atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;

        return date.toLocaleDateString('pt-PT', {
            day: 'numeric',
            month: 'short',
        });
    };

    const getNotificationIcon = (type: string) => {
        if (type.includes('Message')) return <IconMessage size={20} className="text-blue-500" />;
        if (type.includes('Kyc')) return <IconShieldCheck size={20} className="text-purple-500" />;
        if (type.includes('Service')) return <IconStar size={20} className="text-yellow-500" />;
        return <IconBell size={20} className="text-gray-500" />;
    };

    const getNotificationLink = (notification: Notification): string | null => {
        const { data, type } = notification;

        if (type.includes('Message') && data.conversation_id) {
            return route('messages.show', data.conversation_id);
        }
        if (type.includes('Service') && data.service_id) {
            return route('services.show', data.service_id);
        }
        return null;
    };

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read if unread
        if (!notification.read_at) {
            handleMarkAsRead(notification.id);
        }

        // Navigate if there's a link
        const link = getNotificationLink(notification);
        if (link) {
            router.visit(link);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <Group justify="space-between">
                    <Group gap="sm">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Notificações
                        </h2>
                        {unreadCount > 0 && (
                            <Badge color="red" size="lg">
                                {unreadCount} não lidas
                            </Badge>
                        )}
                    </Group>
                    {unreadCount > 0 && (
                        <Button
                            variant="subtle"
                            leftSection={<IconCheckbox size={18} />}
                            onClick={handleMarkAllAsRead}
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </Group>
            }
        >
            <Head title="Notificações" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        {notifications.data.length === 0 ? (
                            <Stack align="center" py="xl" gap="md">
                                <IconBell size={48} className="text-gray-400" />
                                <Text c="dimmed" ta="center">
                                    Não tem notificações.
                                </Text>
                            </Stack>
                        ) : (
                            <Stack gap={0}>
                                {notifications.data.map((notification, index) => {
                                    const isUnread = !notification.read_at;
                                    const link = getNotificationLink(notification);

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`p-4 transition-colors ${
                                                index > 0 ? 'border-t border-gray-100' : ''
                                            } ${isUnread ? 'bg-blue-50/50' : ''} ${
                                                link ? 'cursor-pointer hover:bg-gray-50' : ''
                                            }`}
                                            onClick={() => link && handleNotificationClick(notification)}
                                        >
                                            <Group justify="space-between" wrap="nowrap">
                                                <Group gap="md" wrap="nowrap" className="flex-1 min-w-0">
                                                    <div className="flex-shrink-0">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <Text
                                                            size="sm"
                                                            fw={isUnread ? 600 : 400}
                                                            className="break-words"
                                                        >
                                                            {notification.data.message}
                                                        </Text>
                                                        <Text size="xs" c="dimmed" mt={2}>
                                                            {formatDate(notification.created_at)}
                                                        </Text>
                                                    </div>
                                                </Group>
                                                <Group gap="xs" wrap="nowrap">
                                                    {isUnread && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    )}
                                                    <Menu shadow="md" width={160}>
                                                        <Menu.Target>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <IconDotsVertical size={16} />
                                                            </ActionIcon>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            {isUnread && (
                                                                <Menu.Item
                                                                    leftSection={<IconCheck size={14} />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkAsRead(notification.id);
                                                                    }}
                                                                >
                                                                    Marcar como lida
                                                                </Menu.Item>
                                                            )}
                                                            <Menu.Item
                                                                color="red"
                                                                leftSection={<IconTrash size={14} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(notification.id);
                                                                }}
                                                            >
                                                                Eliminar
                                                            </Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Group>
                                            </Group>
                                        </div>
                                    );
                                })}
                            </Stack>
                        )}

                        {notifications.last_page > 1 && (
                            <Group justify="center" mt="lg" pt="lg" className="border-t">
                                <Pagination
                                    total={notifications.last_page}
                                    value={notifications.current_page}
                                    onChange={(page) => {
                                        router.get(route('notifications.index'), { page }, { preserveState: true });
                                    }}
                                />
                            </Group>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
