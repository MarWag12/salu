import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import {
    AppShell,
    Burger,
    Group,
    Button,
    Text,
    Container,
    Menu,
    Avatar,
    ActionIcon,
    TextInput,
    Box,
    Divider,
    Stack,
    SimpleGrid,
    ThemeIcon,
    Tooltip,
    Transition,
    Paper,
} from '@mantine/core';
import { useDisclosure, useWindowScroll } from '@mantine/hooks';
import {
    IconSearch,
    IconBell,
    IconMessage,
    IconLogout,
    IconBriefcase,
    IconChevronRight,
    IconBrandFacebook,
    IconBrandInstagram,
    IconBrandTwitter,
    IconMail,
    IconPhone,
    IconMapPin,
    IconHeart,
    IconShieldCheck,
    IconCategory,
} from '@tabler/icons-react';
import { PropsWithChildren, useState } from 'react';
import { PageProps } from '@/types';

export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const [opened, { toggle, close }] = useDisclosure();
    const [searchQuery, setSearchQuery] = useState('');
    const [scroll] = useWindowScroll();

    const isScrolled = scroll.y > 10;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = route('services.index', { search: searchQuery });
        }
    };

    const getDashboardRoute = () => {
        if (!auth.user) return route('login');
        if (auth.user.type === 'provider') return route('provider.dashboard');
        if (auth.user.type === 'admin') return '/admin';
        return route('dashboard');
    };

    return (
        <AppShell
            header={{ height: 70 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { desktop: true, mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header
                style={{
                    backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'white',
                    backdropFilter: isScrolled ? 'blur(10px)' : undefined,
                    boxShadow: isScrolled ? '0 2px 10px rgba(0,0,0,0.1)' : undefined,
                    transition: 'all 0.3s ease',
                }}
            >
                <Container size="xl" h="100%">
                    <Group h="100%" justify="space-between">
                        <Group>
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                            <Link href={route('home')} className="no-underline">
                                <Group gap={8}>
                                    <ApplicationLogo className="h-10 w-auto" />
                                    <Text size="xl" fw={800} c="primary.4">
                                        Salu
                                    </Text>
                                </Group>
                            </Link>
                        </Group>

                        {/* Search Bar - Desktop */}
                        <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-md mx-8">
                            <TextInput
                                placeholder="Pesquisar serviços..."
                                leftSection={<IconSearch size={18} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                radius="xl"
                                size="md"
                                styles={{
                                    input: {
                                        backgroundColor: 'var(--mantine-color-gray-0)',
                                        border: '1px solid var(--mantine-color-gray-2)',
                                        '&:focus': {
                                            borderColor: 'var(--mantine-color-primary-4)',
                                        },
                                    },
                                }}
                            />
                        </form>

                        {/* Desktop Navigation */}
                        <Group gap="sm" visibleFrom="sm">
                            <Button
                                component={Link}
                                href={route('services.index')}
                                variant="subtle"
                                color="gray"
                                radius="xl"
                            >
                                Serviços
                            </Button>

                            <Button
                                component={Link}
                                href={route('providers.index')}
                                variant="subtle"
                                color="gray"
                                radius="xl"
                            >
                                Prestadores
                            </Button>

                            {auth.user ? (
                                <>
                                    <Tooltip label="Mensagens">
                                        <ActionIcon
                                            component={Link}
                                            href={route('messages.index')}
                                            variant="subtle"
                                            color="gray"
                                            size="lg"
                                            radius="xl"
                                        >
                                            <IconMessage size={20} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip label="Notificações">
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
                                    </Tooltip>

                                    <Menu shadow="lg" width={220} radius="md" position="bottom-end">
                                        <Menu.Target>
                                            <Avatar
                                                color="primary.4"
                                                radius="xl"
                                                size="md"
                                                style={{ cursor: 'pointer' }}
                                                variant="filled"
                                            >
                                                {auth.user.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </Menu.Target>

                                        <Menu.Dropdown>
                                            <Box p="xs">
                                                <Text fw={600}>{auth.user.name}</Text>
                                                <Text size="xs" c="dimmed">{auth.user.email}</Text>
                                            </Box>
                                            <Menu.Divider />
                                            <Menu.Item
                                                component={Link}
                                                href={getDashboardRoute()}
                                                leftSection={<IconBriefcase size={16} />}
                                                rightSection={<IconChevronRight size={14} />}
                                            >
                                                {auth.user.type === 'provider' ? 'Painel do Prestador' : 'Minha Conta'}
                                            </Menu.Item>
                                            <Menu.Item
                                                component={Link}
                                                href={route('messages.index')}
                                                leftSection={<IconMessage size={16} />}
                                            >
                                                Mensagens
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
                                </>
                            ) : (
                                <>
                                    <Button
                                        component={Link}
                                        href={route('login')}
                                        variant="subtle"
                                        radius="xl"
                                    >
                                        Entrar
                                    </Button>
                                    <Button
                                        component={Link}
                                        href={route('register')}
                                        color="primary.4"
                                        radius="xl"
                                    >
                                        Criar Conta
                                    </Button>
                                </>
                            )}
                        </Group>
                    </Group>
                </Container>
            </AppShell.Header>

            {/* Mobile Navigation */}
            <AppShell.Navbar p="md">
                <Stack gap="sm">
                    <form onSubmit={handleSearch}>
                        <TextInput
                            placeholder="Pesquisar serviços..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            radius="xl"
                            size="md"
                        />
                    </form>

                    <Divider my="sm" />

                    <Button
                        component={Link}
                        href={route('services.index')}
                        variant="subtle"
                        fullWidth
                        justify="start"
                        leftSection={<IconCategory size={18} />}
                        onClick={close}
                    >
                        Explorar Serviços
                    </Button>

                    <Button
                        component={Link}
                        href={route('providers.index')}
                        variant="subtle"
                        fullWidth
                        justify="start"
                        leftSection={<IconBriefcase size={18} />}
                        onClick={close}
                    >
                        Prestadores
                    </Button>

                    {auth.user ? (
                        <>
                            <Button
                                component={Link}
                                href={getDashboardRoute()}
                                variant="subtle"
                                fullWidth
                                justify="start"
                                leftSection={<IconBriefcase size={18} />}
                                onClick={close}
                            >
                                {auth.user.type === 'provider' ? 'Painel do Prestador' : 'Minha Conta'}
                            </Button>
                            <Button
                                component={Link}
                                href={route('messages.index')}
                                variant="subtle"
                                fullWidth
                                justify="start"
                                leftSection={<IconMessage size={18} />}
                                onClick={close}
                            >
                                Mensagens
                            </Button>
                            <Button
                                component={Link}
                                href={route('notifications.index')}
                                variant="subtle"
                                fullWidth
                                justify="start"
                                leftSection={<IconBell size={18} />}
                                onClick={close}
                            >
                                Notificações
                            </Button>
                            <Divider my="sm" />
                            <Button
                                component={Link}
                                href={route('logout')}
                                method="post"
                                as="button"
                                variant="subtle"
                                color="red"
                                fullWidth
                                justify="start"
                                leftSection={<IconLogout size={18} />}
                            >
                                Terminar Sessão
                            </Button>
                        </>
                    ) : (
                        <>
                            <Divider my="sm" />
                            <Button
                                component={Link}
                                href={route('login')}
                                variant="light"
                                fullWidth
                                onClick={close}
                            >
                                Entrar
                            </Button>
                            <Button
                                component={Link}
                                href={route('register')}
                                color="primary.4"
                                fullWidth
                                onClick={close}
                            >
                                Criar Conta
                            </Button>
                        </>
                    )}
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main>
                {children}
            </AppShell.Main>

            {/* Modern Footer */}
            <Box
                component="footer"
                style={{
                    background: 'linear-gradient(180deg, var(--mantine-color-gray-0) 0%, var(--mantine-color-gray-1) 100%)',
                    borderTop: '1px solid var(--mantine-color-gray-2)',
                }}
                mt={60}
            >
                <Container size="xl" py={60}>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={40}>
                        {/* Brand */}
                        <Box>
                            <Group gap={8} mb="md">
                                <ApplicationLogo variant="full" className="h-24 w-auto" />
                            </Group>
                            <Text size="sm" c="dimmed" mb="lg">
                                O maior marketplace de serviços de Angola. Conectamos profissionais qualificados a clientes em todo o país.
                            </Text>
                            <Group gap="xs">
                                <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                                    <IconBrandFacebook size={20} />
                                </ActionIcon>
                                <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                                    <IconBrandInstagram size={20} />
                                </ActionIcon>
                                <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                                    <IconBrandTwitter size={20} />
                                </ActionIcon>
                            </Group>
                        </Box>

                        {/* Services */}
                        <Box>
                            <Text fw={600} mb="md">Serviços</Text>
                            <Stack gap="xs">
                                <Text
                                    component={Link}
                                    href={route('services.index')}
                                    size="sm"
                                    c="dimmed"
                                    className="hover:text-primary-600 no-underline"
                                    style={{ transition: 'color 0.2s' }}
                                >
                                    Explorar Serviços
                                </Text>
                                <Text
                                    component={Link}
                                    href={route('providers.index')}
                                    size="sm"
                                    c="dimmed"
                                    className="hover:text-primary-600 no-underline"
                                    style={{ transition: 'color 0.2s' }}
                                >
                                    Prestadores
                                </Text>
                                <Text
                                    component={Link}
                                    href={route('services.index', { featured: 1 })}
                                    size="sm"
                                    c="dimmed"
                                    className="hover:text-primary-600 no-underline"
                                    style={{ transition: 'color 0.2s' }}
                                >
                                    Serviços em Destaque
                                </Text>
                            </Stack>
                        </Box>

                        {/* For Providers */}
                        <Box>
                            <Text fw={600} mb="md">Para Prestadores</Text>
                            <Stack gap="xs">
                                <Text
                                    component={Link}
                                    href={route('register')}
                                    size="sm"
                                    c="dimmed"
                                    className="hover:text-primary-600 no-underline"
                                    style={{ transition: 'color 0.2s' }}
                                >
                                    Tornar-se Prestador
                                </Text>
                                <Text
                                    component={Link}
                                    href={route('login')}
                                    size="sm"
                                    c="dimmed"
                                    className="hover:text-primary-600 no-underline"
                                    style={{ transition: 'color 0.2s' }}
                                >
                                    Área do Prestador
                                </Text>
                                <Text
                                    component={Link}
                                    href={route('how-it-works')}
                                    size="sm"
                                    c="dimmed"
                                    className="hover:text-primary-600 no-underline"
                                    style={{ transition: 'color 0.2s' }}
                                >
                                    Como Funciona
                                </Text>
                            </Stack>
                        </Box>

                        {/* Contact */}
                        <Box>
                            <Text fw={600} mb="md">Contacto</Text>
                            <Stack gap="sm">
                                <Group gap="xs">
                                    <IconMapPin size={16} color="var(--mantine-color-dimmed)" />
                                    <Text size="sm" c="dimmed">Luanda, Angola</Text>
                                </Group>
                                <Group gap="xs">
                                    <IconMail size={16} color="var(--mantine-color-dimmed)" />
                                    <Text size="sm" c="dimmed">contacto@salu.ao</Text>
                                </Group>
                                <Group gap="xs">
                                    <IconPhone size={16} color="var(--mantine-color-dimmed)" />
                                    <Text size="sm" c="dimmed">+244 923 456 789</Text>
                                </Group>
                            </Stack>
                        </Box>
                    </SimpleGrid>
                </Container>

                {/* Bottom Bar */}
                <Box
                    style={{
                        borderTop: '1px solid var(--mantine-color-gray-2)',
                        backgroundColor: 'var(--mantine-color-gray-1)',
                    }}
                    py="md"
                >
                    <Container size="xl">
                        <Group justify="space-between" align="center">
                            <Text size="xs" c="dimmed">
                                © {new Date().getFullYear()} Salu. Todos os direitos reservados.
                            </Text>
                            <Group gap="xs">
                                <Text size="xs" c="dimmed">Feito com</Text>
                                <IconHeart size={14} fill="var(--mantine-color-red-6)" color="var(--mantine-color-red-6)" />
                                <Text size="xs" c="dimmed">em Angola</Text>
                            </Group>
                        </Group>
                    </Container>
                </Box>
            </Box>
        </AppShell>
    );
}
