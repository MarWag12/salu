import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import {
    Container,
    Paper,
    Title,
    Text,
    TextInput,
    PasswordInput,
    Button,
    Anchor,
    Group,
    Stack,
    Divider,
    Box,
    ThemeIcon,
    SimpleGrid,
    Center,
    SegmentedControl,
    Card,
    Badge,
} from '@mantine/core';
import {
    IconShieldCheck,
    IconMail,
    IconLock,
    IconUser,
    IconBriefcase,
    IconUsers,
    IconCheck,
    IconArrowRight,
} from '@tabler/icons-react';

interface UserType {
    value: string;
    label: string;
}

interface Props {
    userTypes: UserType[];
}

export default function Register({ userTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        user_type: 'client',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    const accountTypes = [
        {
            value: 'client',
            icon: IconUsers,
            title: 'Cliente',
            description: 'Procuro serviços e profissionais',
            features: ['Acesso a milhares de serviços', 'Chat directo com prestadores', 'Avaliações verificadas'],
        },
        {
            value: 'provider',
            icon: IconBriefcase,
            title: 'Prestador',
            description: 'Quero oferecer os meus serviços',
            features: ['Perfil profissional gratuito', 'Gestão de clientes', 'Pagamentos seguros'],
        },
    ];

    return (
        <>
            <Head title="Criar Conta" />

            <Box
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
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
                                    color="teal"
                                >
                                    <IconShieldCheck size={32} />
                                </ThemeIcon>
                                <Title order={1} c="white" fw={800} size="2.5rem">
                                    Salu
                                </Title>
                            </Group>

                            <Title order={2} c="white" fw={600} mb="md" size="1.75rem">
                                Junte-se à maior comunidade de serviços de Angola
                            </Title>

                            <Text c="white" opacity={0.9} size="lg" mb={40}>
                                Crie a sua conta gratuita e comece hoje mesmo.
                                Seja cliente ou prestador, temos tudo o que precisa.
                            </Text>

                            <Stack gap="md">
                                {[
                                    'Registo 100% gratuito',
                                    'Milhares de serviços disponíveis',
                                    'Profissionais verificados',
                                    'Suporte dedicado',
                                ].map((item, index) => (
                                    <Group key={index} gap="sm">
                                        <ThemeIcon
                                            size={28}
                                            radius="xl"
                                            variant="light"
                                            color="white"
                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                        >
                                            <IconCheck size={16} color="white" />
                                        </ThemeIcon>
                                        <Text c="white" fw={500}>
                                            {item}
                                        </Text>
                                    </Group>
                                ))}
                            </Stack>
                        </Box>

                        {/* Right Side - Registration Form */}
                        <Center>
                            <Paper
                                radius="lg"
                                p={{ base: 'lg', sm: 'xl' }}
                                shadow="xl"
                                w="100%"
                                maw={480}
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
                                            gradient={{ from: 'teal', to: 'lime', deg: 90 }}
                                        >
                                            <IconShieldCheck size={22} />
                                        </ThemeIcon>
                                        <Text
                                            size="xl"
                                            fw={800}
                                            variant="gradient"
                                            gradient={{ from: 'teal', to: 'lime', deg: 90 }}
                                        >
                                            Salu
                                        </Text>
                                    </Group>
                                </Center>

                                <Title order={2} ta="center" fw={700} mb={4}>
                                    Crie a sua conta
                                </Title>
                                <Text c="dimmed" size="sm" ta="center" mb="lg">
                                    Preencha os dados abaixo para começar
                                </Text>

                                <form onSubmit={submit}>
                                    <Stack gap="md">
                                        {/* Account Type Selection */}
                                        <Box>
                                            <Text size="sm" fw={500} mb="xs">
                                                Tipo de Conta
                                            </Text>
                                            <SimpleGrid cols={2} spacing="sm">
                                                {accountTypes.map((type) => (
                                                    <Card
                                                        key={type.value}
                                                        padding="sm"
                                                        radius="md"
                                                        withBorder
                                                        style={{
                                                            cursor: 'pointer',
                                                            borderColor: data.user_type === type.value ? 'var(--mantine-color-teal-6)' : undefined,
                                                            backgroundColor: data.user_type === type.value ? 'var(--mantine-color-teal-0)' : undefined,
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        onClick={() => setData('user_type', type.value)}
                                                    >
                                                        <Group gap="xs" mb={4}>
                                                            <ThemeIcon
                                                                size={32}
                                                                radius="md"
                                                                variant={data.user_type === type.value ? 'filled' : 'light'}
                                                                color="teal"
                                                            >
                                                                <type.icon size={18} />
                                                            </ThemeIcon>
                                                            {data.user_type === type.value && (
                                                                <Badge size="xs" color="teal" variant="filled">
                                                                    Seleccionado
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                        <Text fw={600} size="sm">
                                                            {type.title}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {type.description}
                                                        </Text>
                                                    </Card>
                                                ))}
                                            </SimpleGrid>
                                            {errors.user_type && (
                                                <Text size="xs" c="red" mt="xs">
                                                    {errors.user_type}
                                                </Text>
                                            )}
                                        </Box>

                                        <TextInput
                                            label="Nome Completo"
                                            placeholder="O seu nome"
                                            leftSection={<IconUser size={18} />}
                                            size="md"
                                            radius="md"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            error={errors.name}
                                            required
                                            autoComplete="name"
                                        />

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
                                        />

                                        <PasswordInput
                                            label="Palavra-passe"
                                            placeholder="Crie uma palavra-passe segura"
                                            leftSection={<IconLock size={18} />}
                                            size="md"
                                            radius="md"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            error={errors.password}
                                            required
                                            autoComplete="new-password"
                                        />

                                        <PasswordInput
                                            label="Confirmar Palavra-passe"
                                            placeholder="Repita a palavra-passe"
                                            leftSection={<IconLock size={18} />}
                                            size="md"
                                            radius="md"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            error={errors.password_confirmation}
                                            required
                                            autoComplete="new-password"
                                        />

                                        <Text size="xs" c="dimmed" mt={-8}>
                                            Ao criar conta, concorda com os nossos{' '}
                                            <Anchor size="xs" fw={500}>Termos de Serviço</Anchor>
                                            {' '}e{' '}
                                            <Anchor size="xs" fw={500}>Política de Privacidade</Anchor>.
                                        </Text>

                                        <Button
                                            type="submit"
                                            fullWidth
                                            size="md"
                                            radius="md"
                                            loading={processing}
                                            variant="gradient"
                                            gradient={{ from: 'teal', to: 'lime', deg: 90 }}
                                            rightSection={<IconArrowRight size={18} />}
                                        >
                                            Criar Conta Gratuita
                                        </Button>
                                    </Stack>
                                </form>

                                <Divider label="ou" labelPosition="center" my="lg" />

                                <Text c="dimmed" size="sm" ta="center">
                                    Já tem conta?{' '}
                                    <Anchor component={Link} href={route('login')} fw={600}>
                                        Iniciar sessão
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
