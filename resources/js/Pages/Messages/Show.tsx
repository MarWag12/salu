import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Text,
    Group,
    Stack,
    Avatar,
    Badge,
    TextInput,
    Button,
    ScrollArea,
    ActionIcon,
    Loader,
    Transition,
    ThemeIcon,
    Tooltip,
    Paper,
    Box,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconSend,
    IconCheck,
    IconChecks,
    IconWifi,
    IconWifiOff,
} from '@tabler/icons-react';
import { useRef, useEffect, useState, useCallback } from 'react';

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
    sender: User;
}

interface Conversation {
    id: number;
    client_id: number;
    provider_id: number;
    service_id: number | null;
    client: User;
    provider: User;
    service: Service | null;
}

interface PaginatedMessages {
    data: Message[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    conversation: Conversation;
    messages: PaginatedMessages;
    otherParticipant: User;
    auth: {
        user: User;
    };
}

export default function Show({ conversation, messages: initialMessages, otherParticipant, auth }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>(initialMessages.data);
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        content: '',
    });

    // Initial mount animation
    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // Scroll on load and new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages.length, scrollToBottom]);

    // WebSocket connection for real-time messages
    useEffect(() => {
        if (!window.Echo) {
            console.warn('Laravel Echo not initialized');
            return;
        }

        const channel = window.Echo.private(`conversation.${conversation.id}`);

        channel
            .subscribed(() => {
                setIsConnected(true);
            })
            .listen('.message.sent', (event: Message) => {
                // Add new message to the list (avoid duplicates)
                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === event.id);
                    if (exists) return prev;
                    return [...prev, event];
                });
            })
            .error((error: Error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            });

        return () => {
            window.Echo.leave(`conversation.${conversation.id}`);
        };
    }, [conversation.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.content.trim()) return;

        post(route('messages.store', conversation.id), {
            preserveScroll: true,
            onSuccess: () => {
                // Add the message optimistically
                const newMessage: Message = {
                    id: Date.now(), // Temporary ID
                    content: data.content,
                    created_at: new Date().toISOString(),
                    sender_id: auth.user.id,
                    sender: auth.user,
                };
                setMessages((prev) => [...prev, newMessage]);
                reset('content');
                scrollToBottom();
            },
        });
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        }

        return date.toLocaleDateString('pt-PT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const shouldShowDate = (current: Message, previous: Message | null): boolean => {
        if (!previous) return true;
        const currentDate = new Date(current.created_at).toDateString();
        const previousDate = new Date(previous.created_at).toDateString();
        return currentDate !== previousDate;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <AuthenticatedLayout
            header={
                <Group gap="md">
                    <ActionIcon
                        component={Link}
                        href={route('messages.index')}
                        variant="subtle"
                        size="lg"
                        radius="xl"
                    >
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Avatar
                        color="blue"
                        radius="xl"
                        size="md"
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                    >
                        {getInitials(otherParticipant.name)}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                        <Group gap="xs">
                            <Text fw={600}>{otherParticipant.name}</Text>
                            <Tooltip label={isConnected ? 'Conectado em tempo real' : 'A conectar...'}>
                                <ThemeIcon
                                    size="xs"
                                    radius="xl"
                                    color={isConnected ? 'green' : 'gray'}
                                    variant="light"
                                >
                                    {isConnected ? <IconWifi size={10} /> : <IconWifiOff size={10} />}
                                </ThemeIcon>
                            </Tooltip>
                        </Group>
                        {conversation.service && (
                            <Badge variant="light" size="xs" mt={2}>
                                {conversation.service.name}
                            </Badge>
                        )}
                    </div>
                </Group>
            }
        >
            <Head title={`Conversa com ${otherParticipant.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <Transition mounted={mounted} transition="fade" duration={300}>
                        {(styles) => (
                            <Card
                                style={styles}
                                shadow="md"
                                padding={0}
                                radius="lg"
                                withBorder
                                className="h-[calc(100vh-200px)] flex flex-col overflow-hidden"
                            >
                                {/* Messages Area */}
                                <ScrollArea
                                    className="flex-1"
                                    p="md"
                                    viewportRef={scrollRef}
                                    style={{ background: 'var(--mantine-color-gray-0)' }}
                                >
                                    <Stack gap="md">
                                        {messages.map((message, index) => {
                                            const isOwnMessage = message.sender_id === auth.user.id;
                                            const previousMessage = index > 0 ? messages[index - 1] : null;
                                            const showDate = shouldShowDate(message, previousMessage);

                                            return (
                                                <Transition
                                                    key={message.id}
                                                    mounted={true}
                                                    transition="slide-up"
                                                    duration={200}
                                                >
                                                    {(transitionStyles) => (
                                                        <div style={transitionStyles}>
                                                            {showDate && (
                                                                <Group justify="center" my="md">
                                                                    <Badge
                                                                        variant="light"
                                                                        color="gray"
                                                                        size="sm"
                                                                        radius="xl"
                                                                    >
                                                                        {formatDate(message.created_at)}
                                                                    </Badge>
                                                                </Group>
                                                            )}
                                                            <div
                                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                                            >
                                                                <div className={`max-w-[75%]`}>
                                                                    {!isOwnMessage && (
                                                                        <Group gap="xs" mb={4}>
                                                                            <Avatar
                                                                                size="sm"
                                                                                color="blue"
                                                                                radius="xl"
                                                                                variant="gradient"
                                                                                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                                                            >
                                                                                {getInitials(message.sender.name)}
                                                                            </Avatar>
                                                                            <Text size="xs" fw={500} c="dimmed">
                                                                                {message.sender.name}
                                                                            </Text>
                                                                        </Group>
                                                                    )}
                                                                    <Paper
                                                                        p="sm"
                                                                        radius="lg"
                                                                        shadow="xs"
                                                                        style={{
                                                                            backgroundColor: isOwnMessage
                                                                                ? 'var(--mantine-color-blue-6)'
                                                                                : 'white',
                                                                            borderBottomRightRadius: isOwnMessage ? 4 : undefined,
                                                                            borderBottomLeftRadius: !isOwnMessage ? 4 : undefined,
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            size="sm"
                                                                            c={isOwnMessage ? 'white' : undefined}
                                                                            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                                                                        >
                                                                            {message.content}
                                                                        </Text>
                                                                    </Paper>
                                                                    <Group
                                                                        gap={4}
                                                                        justify={isOwnMessage ? 'flex-end' : 'flex-start'}
                                                                        mt={4}
                                                                    >
                                                                        <Text size="xs" c="dimmed">
                                                                            {formatTime(message.created_at)}
                                                                        </Text>
                                                                        {isOwnMessage && (
                                                                            <IconChecks size={14} className="text-blue-500" />
                                                                        )}
                                                                    </Group>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Transition>
                                            );
                                        })}

                                        {messages.length === 0 && (
                                            <Stack align="center" py="xl" gap="md">
                                                <ThemeIcon size={60} color="gray" variant="light" radius="xl">
                                                    <IconSend size={30} />
                                                </ThemeIcon>
                                                <Text c="dimmed" ta="center">
                                                    Comece a conversa enviando uma mensagem.
                                                </Text>
                                            </Stack>
                                        )}

                                        {isTyping && (
                                            <Group gap="xs" pl="md">
                                                <Loader size="xs" />
                                                <Text size="xs" c="dimmed">
                                                    {otherParticipant.name} está a escrever...
                                                </Text>
                                            </Group>
                                        )}
                                    </Stack>
                                </ScrollArea>

                                {/* Input Area */}
                                <Box
                                    p="md"
                                    style={{
                                        borderTop: '1px solid var(--mantine-color-gray-2)',
                                        background: 'white',
                                    }}
                                >
                                    <form onSubmit={handleSubmit}>
                                        <Group gap="sm">
                                            <TextInput
                                                className="flex-1"
                                                placeholder="Escreva uma mensagem..."
                                                value={data.content}
                                                onChange={(e) => setData('content', e.target.value)}
                                                error={errors.content}
                                                disabled={processing}
                                                autoComplete="off"
                                                radius="xl"
                                                size="md"
                                                styles={{
                                                    input: {
                                                        backgroundColor: 'var(--mantine-color-gray-0)',
                                                        border: '1px solid var(--mantine-color-gray-2)',
                                                    },
                                                }}
                                            />
                                            <ActionIcon
                                                type="submit"
                                                loading={processing}
                                                disabled={!data.content.trim()}
                                                size="xl"
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                            >
                                                <IconSend size={20} />
                                            </ActionIcon>
                                        </Group>
                                    </form>
                                </Box>
                            </Card>
                        )}
                    </Transition>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
