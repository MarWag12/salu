import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import {
    Container,
    Title,
    Text,
    SimpleGrid,
    Card,
    ThemeIcon,
    Stack,
    Group,
    Box,
    Paper,
    Badge,
    Button,
    Accordion,
    Transition,
} from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import {
    IconSearch,
    IconMessage,
    IconUserCheck,
    IconStar,
    IconUserPlus,
    IconFileDescription,
    IconShieldCheck,
    IconCoin,
    IconRocket,
    IconQuestionMark,
    IconCheck,
    IconArrowRight,
    IconSparkles,
} from '@tabler/icons-react';
import { Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function HowItWorks() {
    const [mounted, setMounted] = useState(false);
    const [visibleSections, setVisibleSections] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    // Intersection observers for sections
    const { ref: clientRef, entry: clientEntry } = useIntersection({ threshold: 0.2 });
    const { ref: providerRef, entry: providerEntry } = useIntersection({ threshold: 0.2 });
    const { ref: benefitsRef, entry: benefitsEntry } = useIntersection({ threshold: 0.2 });
    const { ref: faqRef, entry: faqEntry } = useIntersection({ threshold: 0.2 });

    useEffect(() => {
        if (clientEntry?.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, client: true }));
        }
        if (providerEntry?.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, provider: true }));
        }
        if (benefitsEntry?.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, benefits: true }));
        }
        if (faqEntry?.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, faq: true }));
        }
    }, [clientEntry, providerEntry, benefitsEntry, faqEntry]);

    const clientSteps = [
        {
            icon: IconSearch,
            title: 'Pesquise',
            description: 'Encontre o serviço que precisa através da nossa pesquisa ou navegue pelas categorias disponíveis.',
            color: 'blue',
        },
        {
            icon: IconMessage,
            title: 'Contacte',
            description: 'Entre em contacto com o prestador através do nosso sistema de mensagens seguro.',
            color: 'green',
        },
        {
            icon: IconUserCheck,
            title: 'Contrate',
            description: 'Combine os detalhes do serviço directamente com o prestador e feche o negócio.',
            color: 'orange',
        },
        {
            icon: IconStar,
            title: 'Avalie',
            description: 'Após o serviço, avalie o prestador para ajudar outros clientes na escolha.',
            color: 'yellow',
        },
    ];

    const providerSteps = [
        {
            icon: IconUserPlus,
            title: 'Registe-se',
            description: 'Crie a sua conta como prestador de serviços em poucos minutos.',
            color: 'blue',
        },
        {
            icon: IconShieldCheck,
            title: 'Verifique a Identidade',
            description: 'Complete a verificação KYC para garantir a confiança dos clientes.',
            color: 'green',
        },
        {
            icon: IconFileDescription,
            title: 'Publique Serviços',
            description: 'Crie anúncios detalhados dos seus serviços com fotos e preços.',
            color: 'orange',
        },
        {
            icon: IconCoin,
            title: 'Receba Contactos',
            description: 'Clientes interessados entram em contacto consigo directamente.',
            color: 'yellow',
        },
    ];

    const benefits = [
        {
            title: 'Para Clientes',
            items: [
                'Acesso a prestadores verificados',
                'Comparação fácil de preços',
                'Sistema de avaliações transparente',
                'Comunicação directa e segura',
                'Sem taxas ou comissões',
            ],
            color: 'blue',
            icon: IconSearch,
        },
        {
            title: 'Para Prestadores',
            items: [
                'Alcance milhares de clientes',
                'Perfil profissional gratuito',
                'Gestão simples de serviços',
                'Destaque pago opcional',
                'Suporte dedicado',
            ],
            color: 'green',
            icon: IconRocket,
        },
    ];

    const faqs = [
        {
            question: 'O Salu cobra comissões sobre os serviços?',
            answer: 'Não! O Salu não cobra comissões sobre os serviços prestados. A plataforma é gratuita tanto para clientes como para prestadores. A nossa receita vem apenas dos planos de destaque opcionais para prestadores que querem mais visibilidade.',
        },
        {
            question: 'Como funciona a verificação de identidade (KYC)?',
            answer: 'A verificação KYC é um processo simples onde o prestador envia uma foto do Bilhete de Identidade e uma selfie. Isto garante que todos os prestadores na plataforma são pessoas reais e verificadas, aumentando a confiança dos clientes.',
        },
        {
            question: 'Posso cancelar um serviço depois de contactar o prestador?',
            answer: 'Sim, pode cancelar a qualquer momento antes de fechar acordo com o prestador. Recomendamos que comunique claramente com o prestador para evitar mal-entendidos.',
        },
        {
            question: 'Como funciona o destaque de serviços?',
            answer: 'Os prestadores podem pagar para destacar os seus serviços, fazendo com que apareçam nas primeiras posições dos resultados de pesquisa e na página inicial. Existem planos semanais, mensais e trimestrais.',
        },
        {
            question: 'Os pagamentos são feitos através do Salu?',
            answer: 'Não, os pagamentos são acordados directamente entre o cliente e o prestador. O Salu apenas facilita a conexão entre as partes. Recomendamos sempre combinar os termos de pagamento antes de iniciar o serviço.',
        },
        {
            question: 'Como posso reportar um problema com um prestador?',
            answer: 'Pode reportar problemas através do nosso sistema de suporte ou enviando um e-mail para suporte@salu.ao. Investigamos todas as reclamações e tomamos as medidas necessárias.',
        },
    ];

    return (
        <PublicLayout>
            <Head title="Como Funciona" />

            {/* CSS for animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(3deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.5); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .step-card {
                    transition: all 0.3s ease;
                }
                .step-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
            `}</style>

            {/* Hero Section */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                py={100}
            >
                {/* Floating background elements */}
                {[...Array(8)].map((_, i) => (
                    <Box
                        key={i}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            animation: `float ${8 + i * 1.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.5}s`,
                            width: `${40 + i * 20}px`,
                            height: `${40 + i * 20}px`,
                            left: `${10 + i * 12}%`,
                            top: `${20 + (i % 3) * 30}%`,
                        }}
                    />
                ))}

                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
                    <Transition mounted={mounted} transition="slide-down" duration={600}>
                        {(styles) => (
                            <Stack align="center" gap="lg" style={styles}>
                                <Badge
                                    size="lg"
                                    variant="white"
                                    color="dark"
                                    leftSection={<IconSparkles size={14} />}
                                    style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                                >
                                    Simples e Transparente
                                </Badge>
                                <Title order={1} ta="center" c="white" size={52} fw={800}>
                                    Como Funciona o Salu
                                </Title>
                                <Text size="xl" ta="center" c="rgba(255,255,255,0.9)" maw={600}>
                                    Conectamos clientes a prestadores de serviços verificados em Angola.
                                    Veja como é fácil encontrar ou oferecer serviços na nossa plataforma.
                                </Text>
                            </Stack>
                        )}
                    </Transition>
                </Container>
            </Box>

            {/* For Clients Section */}
            <Container size="lg" py={100} ref={clientRef}>
                <Stack gap={60}>
                    <Transition mounted={visibleSections.client || false} transition="slide-up" duration={500}>
                        {(styles) => (
                            <Box ta="center" style={styles}>
                                <Badge
                                    color="blue"
                                    size="lg"
                                    mb="md"
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                >
                                    Para Clientes
                                </Badge>
                                <Title order={2} mb="sm" size={36}>
                                    Encontre o Serviço Ideal
                                </Title>
                                <Text c="dimmed" maw={500} mx="auto" size="lg">
                                    Em apenas 4 passos simples, encontre e contrate o profissional perfeito para as suas necessidades.
                                </Text>
                            </Box>
                        )}
                    </Transition>

                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
                        {clientSteps.map((step, index) => (
                            <Transition
                                key={step.title}
                                mounted={visibleSections.client || false}
                                transition="pop"
                                duration={400}
                                timingFunction="ease"
                            >
                                {(styles) => (
                                    <Card
                                        className="step-card"
                                        shadow="sm"
                                        padding="xl"
                                        radius="lg"
                                        withBorder
                                        style={{
                                            ...styles,
                                            position: 'relative',
                                            transitionDelay: `${index * 100}ms`,
                                        }}
                                    >
                                        <Box
                                            style={{
                                                position: 'absolute',
                                                top: -15,
                                                left: 20,
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, var(--mantine-color-${step.color}-5), var(--mantine-color-${step.color}-7))`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: 16,
                                                boxShadow: `0 4px 12px var(--mantine-color-${step.color}-3)`,
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                        <ThemeIcon
                                            size={70}
                                            radius="xl"
                                            variant="gradient"
                                            gradient={{ from: step.color, to: `${step.color}.3`, deg: 135 }}
                                            mb="lg"
                                        >
                                            <step.icon size={35} />
                                        </ThemeIcon>
                                        <Text fw={700} size="xl" mb="xs">
                                            {step.title}
                                        </Text>
                                        <Text size="sm" c="dimmed" lh={1.6}>
                                            {step.description}
                                        </Text>
                                    </Card>
                                )}
                            </Transition>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>

            {/* For Providers Section */}
            <Box bg="gray.0" py={100} ref={providerRef}>
                <Container size="lg">
                    <Stack gap={60}>
                        <Transition mounted={visibleSections.provider || false} transition="slide-up" duration={500}>
                            {(styles) => (
                                <Box ta="center" style={styles}>
                                    <Badge
                                        color="green"
                                        size="lg"
                                        mb="md"
                                        variant="gradient"
                                        gradient={{ from: 'green', to: 'teal', deg: 90 }}
                                    >
                                        Para Prestadores
                                    </Badge>
                                    <Title order={2} mb="sm" size={36}>
                                        Comece a Oferecer os Seus Serviços
                                    </Title>
                                    <Text c="dimmed" maw={500} mx="auto" size="lg">
                                        Crie o seu perfil profissional e alcance milhares de potenciais clientes em toda Angola.
                                    </Text>
                                </Box>
                            )}
                        </Transition>

                        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
                            {providerSteps.map((step, index) => (
                                <Transition
                                    key={step.title}
                                    mounted={visibleSections.provider || false}
                                    transition="pop"
                                    duration={400}
                                    timingFunction="ease"
                                >
                                    {(styles) => (
                                        <Card
                                            className="step-card"
                                            shadow="sm"
                                            padding="xl"
                                            radius="lg"
                                            withBorder
                                            style={{
                                                ...styles,
                                                position: 'relative',
                                                transitionDelay: `${index * 100}ms`,
                                            }}
                                        >
                                            <Box
                                                style={{
                                                    position: 'absolute',
                                                    top: -15,
                                                    left: 20,
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, var(--mantine-color-${step.color}-5), var(--mantine-color-${step.color}-7))`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    boxShadow: `0 4px 12px var(--mantine-color-${step.color}-3)`,
                                                }}
                                            >
                                                {index + 1}
                                            </Box>
                                            <ThemeIcon
                                                size={70}
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{ from: step.color, to: `${step.color}.3`, deg: 135 }}
                                                mb="lg"
                                            >
                                                <step.icon size={35} />
                                            </ThemeIcon>
                                            <Text fw={700} size="xl" mb="xs">
                                                {step.title}
                                            </Text>
                                            <Text size="sm" c="dimmed" lh={1.6}>
                                                {step.description}
                                            </Text>
                                        </Card>
                                    )}
                                </Transition>
                            ))}
                        </SimpleGrid>
                    </Stack>
                </Container>
            </Box>

            {/* Benefits Section */}
            <Container size="lg" py={100} ref={benefitsRef}>
                <Stack gap={60}>
                    <Transition mounted={visibleSections.benefits || false} transition="slide-up" duration={500}>
                        {(styles) => (
                            <Box ta="center" style={styles}>
                                <Title order={2} mb="sm" size={36}>
                                    Vantagens da Plataforma
                                </Title>
                                <Text c="dimmed" maw={500} mx="auto" size="lg">
                                    Descubra porque o Salu é a melhor escolha para encontrar ou oferecer serviços em Angola.
                                </Text>
                            </Box>
                        )}
                    </Transition>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                        {benefits.map((benefit, index) => (
                            <Transition
                                key={benefit.title}
                                mounted={visibleSections.benefits || false}
                                transition="slide-left"
                                duration={500}
                            >
                                {(styles) => (
                                    <Paper
                                        shadow="lg"
                                        radius="xl"
                                        p="xl"
                                        withBorder
                                        style={{
                                            ...styles,
                                            borderTop: `5px solid var(--mantine-color-${benefit.color}-6)`,
                                            transitionDelay: `${index * 150}ms`,
                                            transition: 'all 0.3s ease',
                                        }}
                                        className="step-card"
                                    >
                                        <Group mb="xl">
                                            <ThemeIcon
                                                size={60}
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{ from: benefit.color, to: `${benefit.color}.3`, deg: 135 }}
                                            >
                                                <benefit.icon size={30} />
                                            </ThemeIcon>
                                            <Title order={3} size={24}>{benefit.title}</Title>
                                        </Group>
                                        <Stack gap="md">
                                            {benefit.items.map((item, itemIndex) => (
                                                <Transition
                                                    key={item}
                                                    mounted={visibleSections.benefits || false}
                                                    transition="slide-right"
                                                    duration={300}
                                                >
                                                    {(itemStyles) => (
                                                        <Group
                                                            gap="sm"
                                                            style={{
                                                                ...itemStyles,
                                                                transitionDelay: `${(index * 150) + (itemIndex * 50)}ms`,
                                                            }}
                                                        >
                                                            <ThemeIcon
                                                                size={28}
                                                                radius="xl"
                                                                variant="gradient"
                                                                gradient={{ from: benefit.color, to: `${benefit.color}.3`, deg: 135 }}
                                                            >
                                                                <IconCheck size={16} />
                                                            </ThemeIcon>
                                                            <Text size="md">{item}</Text>
                                                        </Group>
                                                    )}
                                                </Transition>
                                            ))}
                                        </Stack>
                                    </Paper>
                                )}
                            </Transition>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Container>

            {/* FAQ Section */}
            <Box bg="gray.0" py={100} ref={faqRef}>
                <Container size="md">
                    <Stack gap={50}>
                        <Transition mounted={visibleSections.faq || false} transition="slide-up" duration={500}>
                            {(styles) => (
                                <Box ta="center" style={styles}>
                                    <ThemeIcon
                                        size={80}
                                        radius="xl"
                                        variant="gradient"
                                        gradient={{ from: 'violet', to: 'grape', deg: 135 }}
                                        mb="lg"
                                        mx="auto"
                                    >
                                        <IconQuestionMark size={40} />
                                    </ThemeIcon>
                                    <Title order={2} mb="sm" size={36}>
                                        Perguntas Frequentes
                                    </Title>
                                    <Text c="dimmed" size="lg">
                                        Tire as suas dúvidas sobre o funcionamento da plataforma.
                                    </Text>
                                </Box>
                            )}
                        </Transition>

                        <Transition mounted={visibleSections.faq || false} transition="fade" duration={600}>
                            {(styles) => (
                                <Accordion
                                    variant="separated"
                                    radius="lg"
                                    style={styles}
                                    styles={{
                                        item: {
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'scale(1.01)',
                                            },
                                        },
                                    }}
                                >
                                    {faqs.map((faq, index) => (
                                        <Accordion.Item key={index} value={`faq-${index}`}>
                                            <Accordion.Control>
                                                <Text fw={600} size="md">{faq.question}</Text>
                                            </Accordion.Control>
                                            <Accordion.Panel>
                                                <Text size="sm" c="dimmed" lh={1.7}>
                                                    {faq.answer}
                                                </Text>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            )}
                        </Transition>
                    </Stack>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box
                py={100}
                style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Animated background */}
                {[...Array(5)].map((_, i) => (
                    <Box
                        key={i}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            background: 'rgba(102, 126, 234, 0.1)',
                            animation: `float ${10 + i * 2}s ease-in-out infinite`,
                            animationDelay: `${i * 0.7}s`,
                            width: `${60 + i * 30}px`,
                            height: `${60 + i * 30}px`,
                            right: `${5 + i * 15}%`,
                            top: `${10 + (i % 2) * 60}%`,
                        }}
                    />
                ))}

                <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
                    <Transition mounted={mounted} transition="scale-y" duration={700}>
                        {(styles) => (
                            <Paper
                                radius="xl"
                                p={{ base: 'xl', md: 60 }}
                                style={{
                                    ...styles,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                <Stack align="center" gap="xl">
                                    <ThemeIcon
                                        size={70}
                                        radius="xl"
                                        variant="gradient"
                                        gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                    >
                                        <IconRocket size={35} />
                                    </ThemeIcon>
                                    <Title order={2} ta="center" c="white" size={36}>
                                        Pronto para Começar?
                                    </Title>
                                    <Text ta="center" c="rgba(255,255,255,0.8)" maw={450} size="lg">
                                        Junte-se a milhares de angolanos que já utilizam o Salu para encontrar e oferecer serviços.
                                    </Text>
                                    <Group mt="md" gap="md">
                                        <Button
                                            component={Link}
                                            href={route('services.index')}
                                            size="xl"
                                            radius="xl"
                                            variant="gradient"
                                            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                                            rightSection={<IconArrowRight size={20} />}
                                            className="step-card"
                                        >
                                            Explorar Serviços
                                        </Button>
                                        <Button
                                            component={Link}
                                            href={route('register')}
                                            size="xl"
                                            radius="xl"
                                            variant="outline"
                                            color="white"
                                            className="step-card"
                                        >
                                            Criar Conta
                                        </Button>
                                    </Group>
                                </Stack>
                            </Paper>
                        )}
                    </Transition>
                </Container>
            </Box>
        </PublicLayout>
    );
}
