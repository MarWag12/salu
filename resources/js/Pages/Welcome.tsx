import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Container,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Card,
    SimpleGrid,
    ThemeIcon,
    Box,
    Badge,
    Transition,
    rem,
    Tooltip,
    Paper,
    Progress,
    RingProgress,
    Divider,
    Anchor,
    ActionIcon,
    HoverCard,
    Kbd,
    Notification,
    List,
} from '@mantine/core';
import { useIntersection, useInterval, useHover } from '@mantine/hooks';
import {
    IconSearch,
    IconShieldCheck,
    IconStar,
    IconMessage,
    IconClock,
    IconUsers,
    IconArrowRight,
    IconBriefcase,
    IconSparkles,
    IconHeartHandshake,
    IconRocket,
    IconCheck,
    IconBrandWhatsapp,
    IconBrandInstagram,
    IconBrandFacebook,
    IconQuestionMark,
    IconBulb,
    IconTrendingUp,
    IconMapPin,
    IconPhone,
    IconMail,
    IconChevronRight,
    IconPlayerPlay,
    IconInfoCircle,
    IconCoin,
    IconAward,
    IconThumbUp,
    IconX,
} from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

interface Feature {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    tip: string;
}

interface Stat {
    value: number;
    suffix: string;
    label: string;
    tip: string;
}

interface Category {
    name: string;
    count: number;
    icon: React.ElementType;
    color: string;
}

const features: Feature[] = [
    {
        icon: IconSearch,
        title: 'Encontre Serviços',
        description: 'Pesquise e descubra prestadores de serviços qualificados na sua área.',
        color: 'blue',
        tip: 'Use filtros avançados para encontrar exactamente o que precisa!',
    },
    {
        icon: IconShieldCheck,
        title: 'Prestadores Verificados',
        description: 'Todos os prestadores passam por verificação de identidade KYC.',
        color: 'green',
        tip: 'Verificamos documento de identidade e foto para sua segurança.',
    },
    {
        icon: IconStar,
        title: 'Avaliações Reais',
        description: 'Avaliações de clientes verificados para tomar decisões informadas.',
        color: 'yellow',
        tip: 'Apenas clientes que usaram o serviço podem avaliar.',
    },
    {
        icon: IconMessage,
        title: 'Chat em Tempo Real',
        description: 'Converse directamente com prestadores através da plataforma.',
        color: 'grape',
        tip: 'Mensagens instantâneas com notificações em tempo real!',
    },
    {
        icon: IconClock,
        title: 'Acompanhamento',
        description: 'Acompanhe o estado dos seus pedidos em tempo real.',
        color: 'orange',
        tip: 'Receba actualizações automáticas sobre seus pedidos.',
    },
    {
        icon: IconHeartHandshake,
        title: 'Sem Comissões',
        description: 'Não cobramos comissões sobre os serviços prestados.',
        color: 'teal',
        tip: 'Prestadores recebem 100% do valor acordado!',
    },
];

const stats: Stat[] = [
    { value: 500, suffix: '+', label: 'Prestadores', tip: 'Prestadores verificados activos na plataforma' },
    { value: 10, suffix: 'K+', label: 'Serviços', tip: 'Serviços publicados e disponíveis' },
    { value: 50, suffix: 'K+', label: 'Clientes', tip: 'Clientes satisfeitos em toda Angola' },
    { value: 4.8, suffix: '', label: 'Avaliação Média', tip: 'Média de avaliações dos prestadores' },
];

const categories: Category[] = [
    { name: 'Limpeza', count: 234, icon: IconSparkles, color: 'blue' },
    { name: 'Reparações', count: 189, icon: IconBriefcase, color: 'orange' },
    { name: 'Tecnologia', count: 156, icon: IconBulb, color: 'violet' },
    { name: 'Beleza', count: 145, icon: IconStar, color: 'pink' },
    { name: 'Educação', count: 98, icon: IconAward, color: 'green' },
    { name: 'Saúde', count: 87, icon: IconHeartHandshake, color: 'red' },
];

const howItWorks = [
    {
        step: 1,
        title: 'Pesquise',
        description: 'Encontre o serviço que precisa na nossa plataforma.',
        icon: IconSearch,
        detail: 'Use palavras-chave ou navegue por categorias',
    },
    {
        step: 2,
        title: 'Compare',
        description: 'Compare preços, avaliações e perfis de prestadores.',
        icon: IconUsers,
        detail: 'Veja fotos, avaliações e histórico do prestador',
    },
    {
        step: 3,
        title: 'Contacte',
        description: 'Entre em contacto directo com o prestador.',
        icon: IconMessage,
        detail: 'Chat em tempo real para combinar detalhes',
    },
    {
        step: 4,
        title: 'Avalie',
        description: 'Deixe a sua avaliação e ajude outros utilizadores.',
        icon: IconStar,
        detail: 'Sua opinião ajuda a comunidade!',
    },
];

const testimonials = [
    {
        name: 'Maria Santos',
        role: 'Cliente',
        text: 'Encontrei um electricista excelente em minutos! Super recomendo.',
        rating: 5,
        location: 'Luanda',
    },
    {
        name: 'João Pedro',
        role: 'Prestador',
        text: 'Aumentei meus clientes em 300% desde que entrei no Salu.',
        rating: 5,
        location: 'Benguela',
    },
    {
        name: 'Ana Costa',
        role: 'Cliente',
        text: 'A verificação KYC me dá muita confiança para contratar.',
        rating: 5,
        location: 'Huambo',
    },
];

// Animated counter component
function AnimatedCounter({ value, suffix, duration = 2000 }: { value: number; suffix: string; duration?: number }) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const { ref, entry } = useIntersection({ threshold: 0.5 });

    useEffect(() => {
        if (entry?.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const steps = 60;
            const increment = value / steps;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setCount(value);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);
            return () => clearInterval(timer);
        }
    }, [entry?.isIntersecting, value, duration, hasAnimated]);

    return (
        <span ref={ref}>
            {count % 1 === 0 ? count : count.toFixed(1)}
            {suffix}
        </span>
    );
}

export default function Welcome({
    auth,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const [mounted, setMounted] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);
    const [showTip, setShowTip] = useState(true);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [visibleSections, setVisibleSections] = useState<{ [key: string]: boolean }>({});

    // Intersection observers
    const { ref: statsRef, entry: statsEntry } = useIntersection({ threshold: 0.3 });
    const { ref: featuresRef, entry: featuresEntry } = useIntersection({ threshold: 0.2 });
    const { ref: howItWorksRef, entry: howItWorksEntry } = useIntersection({ threshold: 0.2 });
    const { ref: categoriesRef, entry: categoriesEntry } = useIntersection({ threshold: 0.3 });
    const { ref: testimonialsRef, entry: testimonialsEntry } = useIntersection({ threshold: 0.3 });

    // Typing effect for hero
    const heroTexts = ['Serviços Profissionais', 'Prestadores Verificados', 'Qualidade Garantida'];
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Update visible sections
    useEffect(() => {
        if (statsEntry?.isIntersecting) setVisibleSections(prev => ({ ...prev, stats: true }));
        if (featuresEntry?.isIntersecting) setVisibleSections(prev => ({ ...prev, features: true }));
        if (howItWorksEntry?.isIntersecting) setVisibleSections(prev => ({ ...prev, howItWorks: true }));
        if (categoriesEntry?.isIntersecting) setVisibleSections(prev => ({ ...prev, categories: true }));
        if (testimonialsEntry?.isIntersecting) setVisibleSections(prev => ({ ...prev, testimonials: true }));
    }, [statsEntry, featuresEntry, howItWorksEntry, categoriesEntry, testimonialsEntry]);

    // Auto-rotate features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Typing effect
    useEffect(() => {
        const text = heroTexts[heroIndex];
        let index = 0;
        setTypedText('');

        const typeInterval = setInterval(() => {
            if (index <= text.length) {
                setTypedText(text.slice(0, index));
                index++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    setHeroIndex((prev) => (prev + 1) % heroTexts.length);
                }, 2000);
            }
        }, 80);

        return () => clearInterval(typeInterval);
    }, [heroIndex]);

    return (
        <PublicLayout>
            <Head title="Salu - Marketplace de Serviços em Angola" />

            {/* CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 1; }
                    100% { transform: scale(1.3); opacity: 0; }
                }
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes cursor-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .card-hover:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                }
                .feature-ring {
                    position: relative;
                }
                .feature-ring::before {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    border: 2px solid currentColor;
                    opacity: 0;
                    animation: pulse-ring 2s ease-out infinite;
                }
                .feature-ring.active::before {
                    opacity: 0.5;
                }
                .typing-cursor::after {
                    content: '|';
                    animation: cursor-blink 1s infinite;
                    margin-left: 2px;
                }
            `}</style>

            {/* Floating Tip Notification */}
            {showTip && (
                <Box
                    style={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 1000,
                        maxWidth: 350,
                    }}
                >
                    <Transition mounted={mounted} transition="slide-left" duration={500}>
                        {(styles) => (
                            <Notification
                                style={styles}
                                icon={<IconBulb size={18} />}
                                color="violet"
                                title="Dica Rápida"
                                onClose={() => setShowTip(false)}
                                withCloseButton
                            >
                                <Text size="sm">
                                    Use <Kbd size="xs">Ctrl</Kbd> + <Kbd size="xs">K</Kbd> para pesquisar serviços rapidamente!
                                </Text>
                            </Notification>
                        )}
                    </Transition>
                </Box>
            )}

            {/* Hero Section */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 15s ease infinite',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                py={{ base: 80, md: 120 }}
            >
                {/* Animated Background Elements */}
                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                    }}
                >
                    {[...Array(10)].map((_, i) => (
                        <Box
                            key={i}
                            style={{
                                position: 'absolute',
                                borderRadius: '50%',
                                background: `rgba(255,255,255,${0.05 + (i * 0.02)})`,
                                animation: `float ${8 + i * 1.5}s ease-in-out infinite`,
                                animationDelay: `${i * 0.3}s`,
                                width: `${60 + i * 40}px`,
                                height: `${60 + i * 40}px`,
                                left: `${5 + i * 10}%`,
                                top: `${10 + (i % 4) * 20}%`,
                            }}
                        />
                    ))}
                </Box>

                <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
                    <Transition mounted={mounted} transition="slide-down" duration={700}>
                        {(styles) => (
                            <Stack align="center" gap="xl" style={styles}>
                                <HoverCard width={280} shadow="md" position="bottom">
                                    <HoverCard.Target>
                                        <Badge
                                            size="xl"
                                            variant="white"
                                            color="dark"
                                            leftSection={<IconSparkles size={16} />}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                color: 'white',
                                                backdropFilter: 'blur(10px)',
                                                cursor: 'pointer',
                                                animation: 'bounce-subtle 2s ease-in-out infinite',
                                            }}
                                        >
                                            A plataforma #1 de serviços em Angola
                                        </Badge>
                                    </HoverCard.Target>
                                    <HoverCard.Dropdown>
                                        <Group>
                                            <IconTrendingUp size={20} color="green" />
                                            <Text size="sm" fw={500}>
                                                +300% crescimento em 2024
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="dimmed" mt="xs">
                                            Somos a plataforma de serviços que mais cresce em Angola!
                                        </Text>
                                    </HoverCard.Dropdown>
                                </HoverCard>

                                <Title
                                    order={1}
                                    ta="center"
                                    c="white"
                                    fz={{ base: rem(38), sm: rem(52), md: rem(64) }}
                                    fw={800}
                                    style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}
                                >
                                    Encontre os Melhores
                                    <br />
                                    <Text
                                        component="span"
                                        inherit
                                        className="typing-cursor"
                                        style={{
                                            background: 'linear-gradient(90deg, #fff 0%, #a8edea 50%, #fed6e3 100%)',
                                            backgroundSize: '200% auto',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            animation: 'shimmer 3s linear infinite',
                                        }}
                                    >
                                        {typedText}
                                    </Text>
                                </Title>

                                <Text
                                    size="xl"
                                    c="white"
                                    ta="center"
                                    maw={650}
                                    style={{ opacity: 0.95 }}
                                    lh={1.6}
                                >
                                    Conectamos você aos melhores prestadores de serviços em Angola.
                                    <br />
                                    <Text component="span" fw={600}>
                                        Simples, seguro e 100% verificado.
                                    </Text>
                                </Text>

                                <Group mt="lg" gap="md">
                                    <Tooltip
                                        label="Explore centenas de serviços disponíveis"
                                        position="bottom"
                                        withArrow
                                        transitionProps={{ transition: 'pop', duration: 200 }}
                                    >
                                        <Button
                                            component={Link}
                                            href={route('services.index')}
                                            size="xl"
                                            radius="xl"
                                            variant="white"
                                            color="violet"
                                            rightSection={<IconArrowRight size={20} />}
                                            className="card-hover"
                                            style={{
                                                boxShadow: '0 15px 50px rgba(0,0,0,0.25)',
                                            }}
                                        >
                                            Explorar Serviços
                                        </Button>
                                    </Tooltip>
                                    {!auth.user && (
                                        <Tooltip
                                            label="Crie sua conta em menos de 1 minuto!"
                                            position="bottom"
                                            withArrow
                                        >
                                            <Button
                                                component={Link}
                                                href={route('register')}
                                                size="xl"
                                                radius="xl"
                                                variant="outline"
                                                color="white"
                                                className="card-hover"
                                                style={{
                                                    borderColor: 'rgba(255,255,255,0.5)',
                                                    borderWidth: 2,
                                                }}
                                            >
                                                Criar Conta Grátis
                                            </Button>
                                        </Tooltip>
                                    )}
                                </Group>

                                {/* Quick search hint */}
                                <Group gap="xs" mt="md">
                                    <IconInfoCircle size={16} color="rgba(255,255,255,0.7)" />
                                    <Text size="sm" c="white" style={{ opacity: 0.7 }}>
                                        Pesquisa rápida: <Kbd size="xs" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>Ctrl + K</Kbd>
                                    </Text>
                                </Group>
                            </Stack>
                        )}
                    </Transition>
                </Container>

                {/* Wave Divider */}
                <Box
                    style={{
                        position: 'absolute',
                        bottom: -1,
                        left: 0,
                        right: 0,
                    }}
                >
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                            fill="white"
                        />
                    </svg>
                </Box>
            </Box>

            {/* Stats Section */}
            <Container size="lg" py={80} ref={statsRef}>
                <Transition mounted={visibleSections.stats || false} transition="fade" duration={600}>
                    {(styles) => (
                        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl" style={styles}>
                            {stats.map((stat, index) => (
                                <Transition
                                    key={stat.label}
                                    mounted={visibleSections.stats || false}
                                    transition="pop"
                                    duration={400 + index * 100}
                                >
                                    {(itemStyles) => (
                                        <Tooltip
                                            label={stat.tip}
                                            position="top"
                                            withArrow
                                            multiline
                                            w={200}
                                            transitionProps={{ transition: 'pop', duration: 200 }}
                                        >
                                            <Card
                                                style={itemStyles}
                                                p="xl"
                                                radius="xl"
                                                withBorder
                                                className="text-center card-hover cursor-pointer"
                                            >
                                                <Text
                                                    fz={{ base: rem(36), md: rem(48) }}
                                                    fw={800}
                                                    variant="gradient"
                                                    gradient={{ from: 'violet', to: 'grape', deg: 135 }}
                                                >
                                                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                                </Text>
                                                <Text size="sm" c="dimmed" fw={600} mt="xs">
                                                    {stat.label}
                                                </Text>
                                            </Card>
                                        </Tooltip>
                                    )}
                                </Transition>
                            ))}
                        </SimpleGrid>
                    )}
                </Transition>
            </Container>

            {/* Popular Categories */}
            <Box bg="gray.0" py={80} ref={categoriesRef}>
                <Container size="lg">
                    <Transition mounted={visibleSections.categories || false} transition="slide-up" duration={500}>
                        {(styles) => (
                            <Stack align="center" mb={50} style={styles}>
                                <Badge size="lg" variant="gradient" gradient={{ from: 'pink', to: 'grape', deg: 90 }}>
                                    Categorias Populares
                                </Badge>
                                <Title order={2} ta="center" fz={{ base: rem(28), md: rem(38) }}>
                                    O Que Procura Hoje?
                                </Title>
                                <Text size="lg" c="dimmed" ta="center" maw={500}>
                                    Explore as categorias mais procuradas na nossa plataforma
                                </Text>
                            </Stack>
                        )}
                    </Transition>

                    <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="lg">
                        {categories.map((category, index) => (
                            <Transition
                                key={category.name}
                                mounted={visibleSections.categories || false}
                                transition="pop"
                                duration={300 + index * 50}
                            >
                                {(styles) => (
                                    <Tooltip label={`${category.count} serviços disponíveis`} withArrow>
                                        <Card
                                            component={Link}
                                            href={route('services.index', { category: category.name.toLowerCase() })}
                                            style={styles}
                                            p="lg"
                                            radius="xl"
                                            withBorder
                                            className="card-hover text-center cursor-pointer"
                                        >
                                            <ThemeIcon
                                                size={60}
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{ from: category.color, to: `${category.color}.3`, deg: 135 }}
                                                mx="auto"
                                                mb="md"
                                            >
                                                <category.icon size={28} />
                                            </ThemeIcon>
                                            <Text fw={600} size="sm">
                                                {category.name}
                                            </Text>
                                            <Badge size="xs" variant="light" color={category.color} mt="xs">
                                                {category.count}+ serviços
                                            </Badge>
                                        </Card>
                                    </Tooltip>
                                )}
                            </Transition>
                        ))}
                    </SimpleGrid>

                    <Group justify="center" mt="xl">
                        <Button
                            component={Link}
                            href={route('services.index')}
                            variant="light"
                            color="violet"
                            size="lg"
                            radius="xl"
                            rightSection={<IconChevronRight size={18} />}
                        >
                            Ver Todas as Categorias
                        </Button>
                    </Group>
                </Container>
            </Box>

            {/* Features Section */}
            <Container size="lg" py={80} ref={featuresRef}>
                <Transition mounted={visibleSections.features || false} transition="slide-up" duration={600}>
                    {(styles) => (
                        <Stack align="center" mb={60} style={styles}>
                            <Badge size="lg" variant="gradient" gradient={{ from: 'violet', to: 'blue', deg: 90 }}>
                                Funcionalidades
                            </Badge>
                            <Title order={2} ta="center" fz={{ base: rem(28), md: rem(38) }}>
                                Porquê Escolher o Salu?
                            </Title>
                            <Text size="lg" c="dimmed" ta="center" maw={600}>
                                A nossa plataforma oferece tudo o que precisa para encontrar
                                e contratar serviços de qualidade.
                            </Text>
                        </Stack>
                    )}
                </Transition>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
                    {features.map((feature, index) => (
                        <Transition
                            key={feature.title}
                            mounted={visibleSections.features || false}
                            transition="slide-up"
                            duration={400 + index * 100}
                        >
                            {(styles) => (
                                <HoverCard width={280} shadow="md" position="top" openDelay={200}>
                                    <HoverCard.Target>
                                        <Card
                                            style={styles}
                                            shadow="sm"
                                            padding="xl"
                                            radius="xl"
                                            withBorder
                                            className={`card-hover ${activeFeature === index ? 'ring-2 ring-violet-400 ring-offset-2' : ''}`}
                                            onMouseEnter={() => setActiveFeature(index)}
                                        >
                                            <ThemeIcon
                                                size={70}
                                                radius="xl"
                                                variant="gradient"
                                                gradient={{ from: feature.color, to: `${feature.color}.3`, deg: 135 }}
                                                mb="lg"
                                                className={`feature-ring ${activeFeature === index ? 'active' : ''}`}
                                                style={{ color: `var(--mantine-color-${feature.color}-6)` }}
                                            >
                                                <feature.icon size={32} stroke={1.5} />
                                            </ThemeIcon>
                                            <Group gap="xs" mb="xs">
                                                <Text size="lg" fw={700}>
                                                    {feature.title}
                                                </Text>
                                                <IconInfoCircle size={16} color="gray" style={{ cursor: 'help' }} />
                                            </Group>
                                            <Text size="sm" c="dimmed" lh={1.6}>
                                                {feature.description}
                                            </Text>
                                        </Card>
                                    </HoverCard.Target>
                                    <HoverCard.Dropdown>
                                        <Group gap="xs">
                                            <IconBulb size={18} color="orange" />
                                            <Text size="sm" fw={600}>Dica</Text>
                                        </Group>
                                        <Text size="sm" c="dimmed" mt="xs">
                                            {feature.tip}
                                        </Text>
                                    </HoverCard.Dropdown>
                                </HoverCard>
                            )}
                        </Transition>
                    ))}
                </SimpleGrid>

                {/* Feature progress indicator */}
                <Group justify="center" mt="xl" gap="xs">
                    {features.map((_, index) => (
                        <Box
                            key={index}
                            w={activeFeature === index ? 30 : 10}
                            h={10}
                            style={{
                                borderRadius: 5,
                                backgroundColor: activeFeature === index ? 'var(--mantine-color-violet-6)' : 'var(--mantine-color-gray-3)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                            }}
                            onClick={() => setActiveFeature(index)}
                        />
                    ))}
                </Group>
            </Container>

            {/* How It Works Section */}
            <Box bg="gray.0" py={80} ref={howItWorksRef}>
                <Container size="lg">
                    <Transition mounted={visibleSections.howItWorks || false} transition="slide-up" duration={600}>
                        {(styles) => (
                            <Stack align="center" mb={60} style={styles}>
                                <Badge size="lg" variant="gradient" gradient={{ from: 'grape', to: 'pink', deg: 90 }}>
                                    Como Funciona
                                </Badge>
                                <Title order={2} ta="center" fz={{ base: rem(28), md: rem(38) }}>
                                    Simples e Rápido
                                </Title>
                                <Text size="lg" c="dimmed" ta="center" maw={600}>
                                    Em apenas 4 passos simples, encontre e contrate o serviço ideal.
                                </Text>
                            </Stack>
                        )}
                    </Transition>

                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
                        {howItWorks.map((step, index) => (
                            <Transition
                                key={step.step}
                                mounted={visibleSections.howItWorks || false}
                                transition="pop"
                                duration={500 + index * 150}
                            >
                                {(styles) => (
                                    <Tooltip
                                        label={step.detail}
                                        position="top"
                                        withArrow
                                        multiline
                                        w={200}
                                    >
                                        <Stack align="center" gap="md" style={styles} className="card-hover p-4 rounded-xl cursor-pointer">
                                            <Box style={{ position: 'relative' }}>
                                                <ThemeIcon
                                                    size={90}
                                                    radius="xl"
                                                    variant="gradient"
                                                    gradient={{ from: 'violet', to: 'grape', deg: 135 }}
                                                    style={{
                                                        boxShadow: '0 15px 50px rgba(102, 126, 234, 0.35)',
                                                    }}
                                                >
                                                    <step.icon size={40} stroke={1.5} />
                                                </ThemeIcon>
                                                <Badge
                                                    size="xl"
                                                    circle
                                                    color="white"
                                                    style={{
                                                        position: 'absolute',
                                                        top: -10,
                                                        right: -10,
                                                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                                        color: '#7c3aed',
                                                        fontWeight: 800,
                                                        fontSize: 18,
                                                    }}
                                                >
                                                    {step.step}
                                                </Badge>
                                            </Box>
                                            <Text size="xl" fw={700} ta="center">
                                                {step.title}
                                            </Text>
                                            <Text size="sm" c="dimmed" ta="center" lh={1.6}>
                                                {step.description}
                                            </Text>
                                        </Stack>
                                    </Tooltip>
                                )}
                            </Transition>
                        ))}
                    </SimpleGrid>

                    {/* How it works link */}
                    <Group justify="center" mt="xl">
                        <Button
                            component={Link}
                            href={route('how-it-works')}
                            variant="subtle"
                            color="violet"
                            size="lg"
                            rightSection={<IconPlayerPlay size={18} />}
                        >
                            Ver Tutorial Completo
                        </Button>
                    </Group>
                </Container>
            </Box>

            {/* Testimonials Section */}
            <Container size="lg" py={80} ref={testimonialsRef}>
                <Transition mounted={visibleSections.testimonials || false} transition="slide-up" duration={600}>
                    {(styles) => (
                        <Stack align="center" mb={50} style={styles}>
                            <Badge size="lg" variant="gradient" gradient={{ from: 'yellow', to: 'orange', deg: 90 }}>
                                Testemunhos
                            </Badge>
                            <Title order={2} ta="center" fz={{ base: rem(28), md: rem(38) }}>
                                O Que Dizem os Nossos Utilizadores
                            </Title>
                        </Stack>
                    )}
                </Transition>

                <Transition mounted={visibleSections.testimonials || false} transition="fade" duration={800}>
                    {(styles) => (
                        <Paper
                            style={styles}
                            shadow="xl"
                            radius="xl"
                            p={{ base: 'xl', md: 50 }}
                            withBorder
                            className="relative overflow-hidden"
                        >
                            <Box
                                style={{
                                    position: 'absolute',
                                    top: 20,
                                    right: 20,
                                    fontSize: 120,
                                    opacity: 0.05,
                                    fontWeight: 800,
                                    lineHeight: 1,
                                }}
                            >
                                "
                            </Box>
                            <Stack align="center" gap="lg">
                                <Group gap="xs">
                                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                                        <IconStar key={i} size={24} fill="gold" color="gold" />
                                    ))}
                                </Group>
                                <Text
                                    size="xl"
                                    ta="center"
                                    maw={600}
                                    fs="italic"
                                    lh={1.8}
                                    style={{ transition: 'all 0.5s ease' }}
                                >
                                    "{testimonials[currentTestimonial].text}"
                                </Text>
                                <Stack align="center" gap="xs">
                                    <Text fw={700} size="lg">
                                        {testimonials[currentTestimonial].name}
                                    </Text>
                                    <Group gap="xs">
                                        <Badge variant="light" color="violet">
                                            {testimonials[currentTestimonial].role}
                                        </Badge>
                                        <Group gap={4}>
                                            <IconMapPin size={14} color="gray" />
                                            <Text size="sm" c="dimmed">
                                                {testimonials[currentTestimonial].location}
                                            </Text>
                                        </Group>
                                    </Group>
                                </Stack>
                            </Stack>

                            {/* Testimonial indicators */}
                            <Group justify="center" mt="xl" gap="sm">
                                {testimonials.map((_, index) => (
                                    <Box
                                        key={index}
                                        w={currentTestimonial === index ? 30 : 10}
                                        h={10}
                                        style={{
                                            borderRadius: 5,
                                            backgroundColor: currentTestimonial === index
                                                ? 'var(--mantine-color-violet-6)'
                                                : 'var(--mantine-color-gray-3)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setCurrentTestimonial(index)}
                                    />
                                ))}
                            </Group>
                        </Paper>
                    )}
                </Transition>
            </Container>

            {/* CTA Section */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 15s ease infinite',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                py={100}
            >
                {/* Floating elements */}
                {[...Array(5)].map((_, i) => (
                    <Box
                        key={i}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            animation: `float ${10 + i * 2}s ease-in-out infinite`,
                            width: `${80 + i * 30}px`,
                            height: `${80 + i * 30}px`,
                            right: `${5 + i * 18}%`,
                            top: `${15 + (i % 2) * 50}%`,
                        }}
                    />
                ))}

                <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
                    <Transition mounted={mounted} transition="fade" duration={800}>
                        {(styles) => (
                            <Stack align="center" gap="xl" style={styles}>
                                <ThemeIcon
                                    size={90}
                                    radius="xl"
                                    color="white"
                                    variant="light"
                                    style={{ background: 'rgba(255,255,255,0.2)' }}
                                >
                                    <IconRocket size={45} color="white" />
                                </ThemeIcon>

                                <Title order={2} ta="center" c="white" fz={{ base: rem(32), md: rem(42) }}>
                                    Pronto para Começar?
                                </Title>

                                <Text size="xl" c="white" ta="center" style={{ opacity: 0.95 }} maw={550} lh={1.7}>
                                    Junte-se a milhares de angolanos que já usam o Salu para
                                    encontrar e oferecer serviços de qualidade.
                                </Text>

                                <Group gap="lg">
                                    {auth.user ? (
                                        <Tooltip label="Explore serviços disponíveis">
                                            <Button
                                                component={Link}
                                                href={route('services.index')}
                                                size="xl"
                                                radius="xl"
                                                variant="white"
                                                color="violet"
                                                rightSection={<IconArrowRight size={20} />}
                                                className="card-hover"
                                            >
                                                Ver Serviços
                                            </Button>
                                        </Tooltip>
                                    ) : (
                                        <>
                                            <Tooltip label="Encontre profissionais verificados">
                                                <Button
                                                    component={Link}
                                                    href={route('register')}
                                                    size="xl"
                                                    radius="xl"
                                                    variant="white"
                                                    color="violet"
                                                    leftSection={<IconUsers size={20} />}
                                                    className="card-hover"
                                                >
                                                    Sou Cliente
                                                </Button>
                                            </Tooltip>
                                            <Tooltip label="Comece a ganhar com seus serviços">
                                                <Button
                                                    component={Link}
                                                    href={route('register')}
                                                    size="xl"
                                                    radius="xl"
                                                    variant="outline"
                                                    color="white"
                                                    leftSection={<IconBriefcase size={20} />}
                                                    className="card-hover"
                                                    style={{ borderColor: 'rgba(255,255,255,0.5)', borderWidth: 2 }}
                                                >
                                                    Sou Prestador
                                                </Button>
                                            </Tooltip>
                                        </>
                                    )}
                                </Group>

                                {/* Trust Badges */}
                                <Group gap="xl" mt="xl">
                                    {[
                                        { icon: IconShieldCheck, text: 'Verificação KYC', tip: 'Todos os prestadores são verificados' },
                                        { icon: IconCoin, text: 'Sem Comissões', tip: '100% do valor vai para o prestador' },
                                        { icon: IconMessage, text: 'Chat em Tempo Real', tip: 'Comunicação instantânea' },
                                    ].map((badge) => (
                                        <Tooltip key={badge.text} label={badge.tip} withArrow>
                                            <Group gap="xs" style={{ cursor: 'help' }}>
                                                <badge.icon size={20} color="white" />
                                                <Text size="sm" c="white" fw={500} style={{ opacity: 0.95 }}>
                                                    {badge.text}
                                                </Text>
                                            </Group>
                                        </Tooltip>
                                    ))}
                                </Group>
                            </Stack>
                        )}
                    </Transition>
                </Container>
            </Box>

            {/* Footer */}
            <Box bg="gray.9" py={60}>
                <Container size="lg">
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl" mb="xl">
                        <Stack>
                            <Text
                                size="xl"
                                fw={800}
                                variant="gradient"
                                gradient={{ from: 'violet', to: 'grape', deg: 45 }}
                            >
                                Salu
                            </Text>
                            <Text size="sm" c="gray.5" maw={250}>
                                A plataforma líder de serviços em Angola. Conectando clientes a prestadores verificados.
                            </Text>
                            <Group gap="sm">
                                <Tooltip label="Siga-nos no Facebook">
                                    <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                                        <IconBrandFacebook size={20} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Siga-nos no Instagram">
                                    <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                                        <IconBrandInstagram size={20} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Contacte-nos no WhatsApp">
                                    <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                                        <IconBrandWhatsapp size={20} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Stack>

                        <Stack gap="xs">
                            <Text fw={600} c="white" mb="xs">Plataforma</Text>
                            <Anchor component={Link} href={route('services.index')} c="gray.5" size="sm">
                                Explorar Serviços
                            </Anchor>
                            <Anchor component={Link} href={route('how-it-works')} c="gray.5" size="sm">
                                Como Funciona
                            </Anchor>
                            <Anchor component={Link} href={route('register')} c="gray.5" size="sm">
                                Seja Prestador
                            </Anchor>
                        </Stack>

                        <Stack gap="xs">
                            <Text fw={600} c="white" mb="xs">Suporte</Text>
                            <Anchor c="gray.5" size="sm">
                                Central de Ajuda
                            </Anchor>
                            <Anchor c="gray.5" size="sm">
                                Contactar Suporte
                            </Anchor>
                            <Anchor c="gray.5" size="sm">
                                Termos de Uso
                            </Anchor>
                        </Stack>

                        <Stack gap="xs">
                            <Text fw={600} c="white" mb="xs">Contacto</Text>
                            <Group gap="xs">
                                <IconMail size={16} color="gray" />
                                <Text size="sm" c="gray.5">suporte@salu.ao</Text>
                            </Group>
                            <Group gap="xs">
                                <IconPhone size={16} color="gray" />
                                <Text size="sm" c="gray.5">+244 923 456 789</Text>
                            </Group>
                            <Group gap="xs">
                                <IconMapPin size={16} color="gray" />
                                <Text size="sm" c="gray.5">Luanda, Angola</Text>
                            </Group>
                        </Stack>
                    </SimpleGrid>

                    <Divider color="gray.7" my="xl" />

                    <Group justify="space-between" align="center">
                        <Text size="sm" c="gray.5">
                            © 2024 Salu. Todos os direitos reservados.
                        </Text>
                        <Group gap="md">
                            <Anchor c="gray.5" size="sm">Privacidade</Anchor>
                            <Anchor c="gray.5" size="sm">Termos</Anchor>
                            <Anchor c="gray.5" size="sm">Cookies</Anchor>
                        </Group>
                    </Group>
                </Container>
            </Box>
        </PublicLayout>
    );
}
