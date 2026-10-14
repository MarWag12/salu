import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Group,
    Stack,
    Avatar,
    Badge,
    Indicator,
    ThemeIcon,
    Transition,
    Paper,
    Box,
    Pagination,
    Divider,
} from '@mantine/core';
import {
    IconMessage,
    IconChevronRight,
    IconMessageCircle,
    IconInbox,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Service {
    id: number;
    name: string;
}

interface Message {
    id: number;
    content: string;
    created_at: string;
    sender_id: number;
}

interface Conversation {
    id: number;
    client_id: number;
    provider_id: number;
    service_id: number | null;
    last_message_at: string;
    client: User;
    provider: User;
    service: Service | null;
    latest_message: Message | null;
    unread_count: number;
}

interface PaginatedConversations {
    data: Conversation[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    conversations: PaginatedConversations;
    unreadCount: number;
    auth: {
        user: User;
    };
}

export default function Index({ conversations, unreadCount, auth }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getOtherParticipant = (conversation: Conversation): User => {
        return auth.user.id === conversation.client_id
            ? conversation.provider
            : conversation.client;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('pt-PT', { weekday: 'short' });
        }
        return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    };

    const handlePageChange = (page: number) => {
        router.get(route('messages.index'), { page }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <Group justify="space-between">
                    <div>
                        <Text size="xl" fw={700} className="text-gray-800">
                            Mensagens
                        </Text>
                        <Text size="sm" c="dimmed">
                            Gerencie suas conversas com clientes e prestadores
                        </Text>
                    </div>
                    {unreadCount > 0 && (
                        <Badge
                            color="red"
                            size="lg"
                            variant="gradient"
                            gradient={{ from: 'red', to: 'pink', deg: 90 }}
                        >
                            {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                </Group>
            }
        >
            <Head title="Mensagens" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <Transition mounted={mounted} transition="fade" duration={400}>
                        {(styles) => (
                            <Card style={styles} shadow="sm" padding="lg" radius="md" withBorder>
                                {conversations.data.length === 0 ? (
                                    <Stack align="center" py="xl" gap="lg">
                                        <ThemeIcon size={80} color="gray" variant="light" radius="xl">
                                            <IconInbox size={40} />
                                        </ThemeIcon>
                                        <Stack align="center" gap="xs">
                                            <Text size="lg" fw={500}>Nenhuma conversa ainda</Text>
                                            <Text c="dimmed" ta="center" maw={400}>
                                                Ainda não tem conversas.
                                                Contacte um prestador de serviço para iniciar uma conversa.
                                            </Text>
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Stack gap={0}>
                                        {conversations.data.map((conversation, index) => {
                                            const otherUser = getOtherParticipant(conversation);
                                            const hasUnread = conversation.unread_count > 0;

                                            return (
                                                <Transition
                                                    key={conversation.id}
                                                    mounted={mounted}
                                                    transition="slide-up"
                                                    duration={300 + index * 50}
                                                >
                                                    {(transitionStyles) => (
                                                        <Link
                                                            href={route('messages.show', conversation.id)}
                                                            className="block no-underline"
                                                        >
                                                            <Paper
                                                                style={transitionStyles}
                                                                p="md"
                                                                radius="md"
                                                                className={`hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                                                                    hasUnread ? 'bg-blue-50/50' : ''
                                                                }`}
                                                                mb={index < conversations.data.length - 1 ? 'xs' : 0}
                                                            >
                                                                <Group justify="space-between" wrap="nowrap">
                                                                    <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                                        <Indicator
                                                                            disabled={!hasUnread}
                                                                            color="blue"
                                                                            size={12}
                                                                            offset={4}
                                                                            processing={hasUnread}
                                                                        >
                                                                            <Avatar
                                                                                color="blue"
                                                                                radius="xl"
                                                                                size="lg"
                                                                                variant="gradient"
                                                                                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                                                            >
                                                                                {getInitials(otherUser.name)}
                                                                            </Avatar>
                                                                        </Indicator>
                                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                                            <Group gap="xs" mb={4}>
                                                                                <Text
                                                                                    fw={hasUnread ? 700 : 500}
                                                                                    size="sm"
                                                                                    lineClamp={1}
                                                                                >
                                                                                    {otherUser.name}
                                                                                </Text>
                                                                                {conversation.service && (
                                                                                    <Badge
                                                                                        variant="light"
                                                                                        size="xs"
                                                                                        radius="sm"
                                                                                    >
                                                                                        {conversation.service.name}
                                                                                    </Badge>
                                                                                )}
                                                                            </Group>
                                                                            {conversation.latest_message && (
                                                                                <Text
                                                                                    size="xs"
                                                                                    c={hasUnread ? 'dark' : 'dimmed'}
                                                                                    fw={hasUnread ? 500 : 400}
                                                                                    lineClamp={1}
                                                                                >
                                                                                    {conversation.latest_message.sender_id === auth.user.id && (
                                                                                        <span className="text-gray-500">Você: </span>
                                                                                    )}
                                                                                    {conversation.latest_message.content}
                                                                                </Text>
                                                                            )}
                                                                        </div>
                                                                    </Group>
                                                                    <Group gap="xs" wrap="nowrap">
                                                                        <Stack gap={4} align="flex-end">
                                                                            <Text size="xs" c="dimmed">
                                                                                {conversation.last_message_at &&
                                                                                    formatDate(conversation.last_message_at)}
                                                                            </Text>
                                                                            {hasUnread && (
                                                                                <Badge
                                                                                    color="blue"
                                                                                    size="sm"
                                                                                    circle
                                                                                    variant="gradient"
                                                                                    gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                                                                >
                                                                                    {conversation.unread_count}
                                                                                </Badge>
                                                                            )}
                                                                        </Stack>
                                                                        <IconChevronRight size={18} className="text-gray-400" />
                                                                    </Group>
                                                                </Group>
                                                            </Paper>
                                                        </Link>
                                                    )}
                                                </Transition>
                                            );
                                        })}
                                    </Stack>
                                )}

                                {conversations.last_page > 1 && (
                                    <>
                                        <Divider my="lg" />
                                        <Group justify="center">
                                            <Pagination
                                                value={conversations.current_page}
                                                total={conversations.last_page}
                                                onChange={handlePageChange}
                                                withEdges
                                            />
                                        </Group>
                                    </>
                                )}
                            </Card>
                        )}
                    </Transition>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
