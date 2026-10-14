import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect, useCallback } from 'react';
import {
    AppShell,
    Burger,
    Group,
    NavLink,
    Text,
    Avatar,
    Menu,
    UnstyledButton,
    Badge,
    Indicator,
    ActionIcon,
    Tooltip,
    Divider,
    Box,
    Transition,
    rem,
    useMantineTheme,
    Notification as MantineNotification,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconDashboard,
    IconBriefcase,
    IconCreditCard,
    IconMessage,
    IconBell,
    IconUser,
    IconLogout,
    IconChevronDown,
    IconSearch,
    IconStar,
    IconShoppingCart,
    IconSettings,
    IconHome,
    IconStarFilled,
    IconWallet,
} from '@tabler/icons-react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import useRealtimeNotifications from '@/hooks/useRealtimeNotifications';

interface User {
    id: number;
    name: string;
    email: string;
    type: 'admin' | 'provider' | 'client';
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as { auth: { user: User } };
    const user = auth.user;
    const theme = useMantineTheme();

    const [opened, { toggle, close }] = useDisclosure();
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);

    const isProvider = user.type === 'provider';
    const isClient = user.type === 'client';

    // Fetch unread counts
    const fetchCounts = useCallback(async () => {
        try {
            const requests = [
                fetch(route('messages.unread-count')),
                fetch(route('notifications.unread-count')),
            ];

            // Fetch pending orders count for providers
            if (isProvider) {
                requests.push(fetch(route('orders.pending-count')));
            }

            const responses = await Promise.all(requests);

            if (responses[0].ok) {
                const data = await responses[0].json();
                setUnreadMessages(data.count || 0);
            }
            if (responses[1].ok) {
                const data = await responses[1].json();
                setUnreadNotifications(data.count || 0);
            }
            if (isProvider && responses[2]?.ok) {
                const data = await responses[2].json();
                setPendingOrders(data.count || 0);
            }
        } catch (e) {
            // Ignore errors
        }
    }, [isProvider]);

    useEffect(() => {
        fetchCounts();
        const interval = setInterval(fetchCounts, 60000);
        return () => clearInterval(interval);
    }, [fetchCounts]);

    // Real-time notifications via WebSocket
    useRealtimeNotifications(user.id, {
        onReviewReceived: (data) => {
            // Increment notification count
            setUnreadNotifications((prev) => prev + 1);

            // Show toast notification
            notifications.show({
                title: 'Nova Avaliacao Recebida',
                message: data.message,
                color: 'yellow',
                icon: <IconStarFilled size={18} />,
                autoClose: 5000,
                onClick: () => {
                    router.visit(route('reviews.index'));
                },
                styles: {
                    root: { cursor: 'pointer' },
                },
            });
        },
        onOrderStatusChanged: (data) => {
            // Increment notification count
            setUnreadNotifications((prev) => prev + 1);

            // Show toast notification
            notifications.show({
                title: 'Actualizacao de Pedido',
                message: data.message,
                color: 'blue',
                icon: <IconShoppingCart size={18} />,
                autoClose: 5000,
                onClick: () => {
                    if (data.order_id) {
                        router.visit(route('orders.show', data.order_id));
                    }
                },
                styles: {
                    root: { cursor: 'pointer' },
                },
            });
        },
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const isActive = (routeName: string | string[]) => {
        if (Array.isArray(routeName)) {
            return routeName.some((r) => route().current(r));
        }
        return route().current(routeName);
    };

    // Provider navigation items
    const providerNavItems = [
        {
            icon: IconDashboard,
            label: 'Dashboard',
            href: route('provider.dashboard'),
            active: isActive('provider.dashboard'),
            badge: 0,
        },
        {
            icon: IconBriefcase,
            label: 'Meus Serviços',
            href: route('provider.services.index'),
            active: isActive('provider.services.*'),
            badge: 0,
        },
        {
            icon: IconShoppingCart,
            label: 'Pedidos',
            href: route('orders.index'),
            active: isActive('orders.*'),
            badge: pendingOrders,
        },
        {
            icon: IconStar,
            label: 'Avaliações',
            href: route('reviews.index'),
            active: isActive('reviews.*'),
            badge: 0,
        },
        {
            icon: IconWallet,
            label: 'Minha Carteira',
            href: route('provider.wallet'),
            active: isActive(['provider.wallet', 'wallet.*']),
            badge: 0,
        },
        {
            icon: IconCreditCard,
            label: 'Pagamentos',
            href: route('provider.payments.history'),
            active: isActive('provider.payments.*'),
            badge: 0,
        },
    ];

    // Client navigation items
    const clientNavItems = [
        {
            icon: IconDashboard,
            label: 'Dashboard',
            href: route('dashboard'),
            active: isActive('dashboard'),
            badge: 0,
        },
        {
            icon: IconSearch,
            label: 'Explorar Serviços',
            href: route('services.index'),
            active: isActive('services.index'),
            badge: 0,
        },
        {
            icon: IconShoppingCart,
            label: 'Meus Pedidos',
            href: route('orders.index'),
            active: isActive('orders.*'),
            badge: 0,
        },
        {
            icon: IconWallet,
            label: 'Minha Carteira',
            href: route('wallet.index'),
            active: isActive('wallet.*'),
            badge: 0,
        },
        {
            icon: IconStar,
            label: 'Minhas Avaliações',
            href: route('reviews.index'),
            active: isActive('reviews.*'),
            badge: 0,
        },
    ];

    const navItems = isProvider ? providerNavItems : clientNavItems;

    // Common items for both
    const commonNavItems = [
        {
            icon: IconMessage,
            label: 'Mensagens',
            href: route('messages.index'),
            active: isActive('messages.*'),
            badge: unreadMessages,
        },
    ];

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 260,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            {/* Header */}
            <AppShell.Header className="border-b border-gray-200">
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            hiddenFrom="sm"
                            size="sm"
                        />
                        <Link href="/">
                            <Group gap="xs">
                                <ApplicationLogo className="h-9 w-auto" />
                                <Text
                                    size="xl"
                                    fw={700}
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                                    visibleFrom="sm"
                                >
                                    Salu
                                </Text>
                            </Group>
                        </Link>
                    </Group>

                    <Group gap="sm">
                        {/* Notifications */}
                        <Tooltip label="Notificações" withArrow>
                            <Indicator
                                label={unreadNotifications > 99 ? '99+' : unreadNotifications}
                                size={18}
                                disabled={unreadNotifications === 0}
                                color="red"
                                processing={unreadNotifications > 0}
                            >
                                <ActionIcon
                                    component={Link}
                                    href={route('notifications.index')}
                                    variant="subtle"
                                    color="gray"
                                    size="lg"
                                    radius="xl"
                                >
                                    <IconBell size={20} />
                                </ActionIcon>
                            </Indicator>
                        </Tooltip>

                        {/* User Menu */}
                        <Menu
                            width={220}
                            position="bottom-end"
                            transitionProps={{ transition: 'pop-top-right' }}
                            shadow="md"
                            radius="md"
                        >
                            <Menu.Target>
                                <UnstyledButton className="hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                                    <Group gap="xs">
                                        <Avatar
                                            color="blue"
                                            radius="xl"
                                            size="sm"
                                        >
                                            {getInitials(user.name)}
                                        </Avatar>
                                        <Box visibleFrom="sm">
                                            <Text size="sm" fw={500} lh={1}>
                                                {user.name}
                                            </Text>
                                            <Text size="xs" c="dimmed" lh={1} mt={4}>
                                                {isProvider ? 'Prestador' : 'Cliente'}
                                            </Text>
                                        </Box>
                                        <IconChevronDown
                                            style={{ width: rem(14), height: rem(14) }}
                                            className="text-gray-500"
                                        />
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>Conta</Menu.Label>
                                <Menu.Item
                                    component={Link}
                                    href={isProvider ? route('provider.profile.edit') : route('profile.edit')}
                                    leftSection={<IconUser size={16} />}
                                >
                                    Meu Perfil
                                </Menu.Item>
                                <Menu.Item
                                    component={Link}
                                    href={route('notifications.index')}
                                    leftSection={<IconBell size={16} />}
                                    rightSection={
                                        unreadNotifications > 0 && (
                                            <Badge size="xs" color="red" variant="filled">
                                                {unreadNotifications}
                                            </Badge>
                                        )
                                    }
                                >
                                    Notificações
                                </Menu.Item>

                                <Menu.Divider />

                                <Menu.Item
                                    component={Link}
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    leftSection={<IconLogout size={16} />}
                                    color="red"
                                >
                                    Terminar Sessão
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* Sidebar Navigation */}
            <AppShell.Navbar p="md" className="bg-white">
                <AppShell.Section grow>
                    <Box mb="md">
                        <Text size="xs" fw={500} c="dimmed" tt="uppercase" mb="xs">
                            Menu Principal
                        </Text>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.href}
                                component={Link}
                                href={item.href}
                                label={
                                    item.badge > 0 ? (
                                        <Group justify="space-between">
                                            <Text size="sm">{item.label}</Text>
                                            <Badge size="xs" color="orange" variant="filled">
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </Badge>
                                        </Group>
                                    ) : item.label
                                }
                                leftSection={<item.icon size={18} stroke={1.5} />}
                                active={item.active}
                                onClick={close}
                                variant="light"
                                className="rounded-md mb-1"
                                styles={{
                                    root: {
                                        borderRadius: theme.radius.md,
                                    },
                                }}
                            />
                        ))}
                    </Box>

                    <Divider my="sm" />

                    <Box>
                        <Text size="xs" fw={500} c="dimmed" tt="uppercase" mb="xs">
                            Comunicação
                        </Text>
                        {commonNavItems.map((item) => (
                            <NavLink
                                key={item.href}
                                component={Link}
                                href={item.href}
                                label={
                                    <Group justify="space-between">
                                        <Text size="sm">{item.label}</Text>
                                        {item.badge > 0 && (
                                            <Badge size="xs" color="red" variant="filled">
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </Badge>
                                        )}
                                    </Group>
                                }
                                leftSection={<item.icon size={18} stroke={1.5} />}
                                active={item.active}
                                onClick={close}
                                variant="light"
                                className="rounded-md mb-1"
                                styles={{
                                    root: {
                                        borderRadius: theme.radius.md,
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </AppShell.Section>

                {/* User Info at Bottom */}
                <AppShell.Section>
                    <Divider my="sm" />
                    <Box
                        className="bg-gray-50 rounded-lg p-3"
                    >
                        <Group>
                            <Avatar color="blue" radius="xl" size="md">
                                {getInitials(user.name)}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" fw={500} lineClamp={1}>
                                    {user.name}
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                    {user.email}
                                </Text>
                            </div>
                        </Group>
                    </Box>
                </AppShell.Section>
            </AppShell.Navbar>

            {/* Main Content */}
            <AppShell.Main className="bg-gray-50">
                {header && (
                    <Box className="bg-white border-b border-gray-200 -mx-4 -mt-4 mb-6 px-4 py-4 sm:px-6">
                        {header}
                    </Box>
                )}
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
