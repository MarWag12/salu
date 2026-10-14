import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import {
    Container,
    Paper,
    Title,
    Text,
    TextInput,
    PasswordInput,
    Checkbox,
    Button,
    Anchor,
    Group,
    Stack,
    Divider,
    Box,
    ThemeIcon,
    SimpleGrid,
    Center,
    Alert,
} from '@mantine/core';
import {
    IconShieldCheck,
    IconMail,
    IconLock,
    IconBriefcase,
    IconUser,
    IconStar,
    IconCheck,
} from '@tabler/icons-react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    const features = [
        {
            icon: IconBriefcase,
            title: 'Encontre Profissionais',
            description: 'Conecte-se com prestadores qualificados',
        },
        {
            icon: IconStar,
            title: 'Serviços Avaliados',
            description: 'Avaliações reais de clientes verificados',
        },
        {
            icon: IconShieldCheck,
            title: 'Pagamentos Seguros',
            description: 'Transações protegidas e seguras',
        },
    ];

    return (
        <>
            <Head title="Iniciar Sessão" />

            <Box
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2rem 0',
                }}
            >
                <Container size="lg" w="100%">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60}>
                        {/* Left Side - Branding */}
                        <Box visibleFrom="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Group gap={12} mb="xl">
                                <ThemeIcon
                                    size={56}
                                    radius="xl"
                                    variant="white"
                                    color="blue"
                                >
                                    <IconShieldCheck size={32} />
                                </ThemeIcon>
                                <Title order={1} c="white" fw={800} size="2.5rem">
                                    Salu
                                </Title>
                            </Group>

                            <Title order={2} c="white" fw={600} mb="md" size="1.75rem">
                                O maior marketplace de serviços de Angola
                            </Title>

                            <Text c="white" opacity={0.9} size="lg" mb={40}>
                                Conectamos profissionais qualificados a clientes em todo o país.
                                Encontre o serviço que precisa ou ofereça os seus talentos.
                            </Text>

                            <Stack gap="lg">
                                {features.map((feature, index) => (
                                    <Group key={index} gap="md" align="flex-start">
                                        <ThemeIcon
                                            size={44}
                                            radius="md"
                                            variant="light"
                                            color="white"
                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                                        >
                                            <feature.icon size={24} color="white" />
                                        </ThemeIcon>
                                        <Box>
                                            <Text c="white" fw={600} size="md">
                                                {feature.title}
                                            </Text>
                                            <Text c="white" opacity={0.8} size="sm">
                                                {feature.description}
                                            </Text>
                                        </Box>
                                    </Group>
                                ))}
                            </Stack>
                        </Box>

                        {/* Right Side - Login Form */}
                        <Center>
                            <Paper
                                radius="lg"
                                p={{ base: 'lg', sm: 'xl' }}
                                shadow="xl"
                                w="100%"
                                maw={440}
                                style={{
                                    backgroundColor: 'white',
                                }}
                            >
                                {/* Mobile Logo */}
                                <Center hiddenFrom="md" mb="lg">
                                    <Group gap={8}>
                                        <ThemeIcon
                                            size={40}
                                            radius="md"
                                            variant="gradient"
                                            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                        >
                                            <IconShieldCheck size={22} />
                                        </ThemeIcon>
                                        <Text
                                            size="xl"
                                            fw={800}
                                            variant="gradient"
                                            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                        >
                                            Salu
                                        </Text>
                                    </Group>
                                </Center>

                                <Title order={2} ta="center" fw={700} mb={4}>
                                    Bem-vindo de volta!
                                </Title>
                                <Text c="dimmed" size="sm" ta="center" mb="xl">
                                    Introduza as suas credenciais para continuar
                                </Text>

                                {status && (
                                    <Alert
                                        icon={<IconCheck size={16} />}
                                        color="green"
                                        mb="lg"
                                        radius="md"
                                    >
                                        {status}
                                    </Alert>
                                )}

                                <form onSubmit={submit}>
                                    <Stack gap="md">
                                        <TextInput
                                            label="E-mail"
                                            placeholder="seu@email.com"
                                            leftSection={<IconMail size={18} />}
                                            size="md"
                                            radius="md"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={errors.email}
                                            required
                                            autoComplete="email"
                                            autoFocus
                                        />

                                        <PasswordInput
                                            label="Palavra-passe"
                                            placeholder="Introduza a sua palavra-passe"
                                            leftSection={<IconLock size={18} />}
                                            size="md"
                                            radius="md"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            error={errors.password}
                                            required
                                            autoComplete="current-password"
                                        />

                                        <Group justify="space-between">
                                            <Checkbox
                                                label="Manter sessão iniciada"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.currentTarget.checked)}
                                                size="sm"
                                            />
                                            {canResetPassword && (
                                                <Anchor
                                                    component={Link}
                                                    href={route('password.request')}
                                                    size="sm"
                                                    c="blue"
                                                >
                                                    Esqueceu a palavra-passe?
                                                </Anchor>
                                            )}
                                        </Group>

                                        <Button
                                            type="submit"
                                            fullWidth
                                            size="md"
                                            radius="md"
                                            loading={processing}
                                            variant="gradient"
                                            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                            mt="sm"
                                        >
                                            Entrar
                                        </Button>
                                    </Stack>
                                </form>

                                <Divider label="ou" labelPosition="center" my="lg" />

                                <Text c="dimmed" size="sm" ta="center">
                                    Ainda não tem conta?{' '}
                                    <Anchor component={Link} href={route('register')} fw={600}>
                                        Criar conta gratuita
                                    </Anchor>
                                </Text>

                                <Divider my="lg" />

                                <Group justify="center" gap="xs">
                                    <Anchor component={Link} href={route('home')} size="xs" c="dimmed">
                                        Página Inicial
                                    </Anchor>
                                    <Text size="xs" c="dimmed">•</Text>
                                    <Anchor component={Link} href={route('services.index')} size="xs" c="dimmed">
                                        Explorar Serviços
                                    </Anchor>
                                    <Text size="xs" c="dimmed">•</Text>
                                    <Anchor component={Link} href={route('how-it-works')} size="xs" c="dimmed">
                                        Como Funciona
                                    </Anchor>
                                </Group>
                            </Paper>
                        </Center>
                    </SimpleGrid>
                </Container>
            </Box>
        </>
    );
}
