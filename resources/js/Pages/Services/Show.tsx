import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Container,
    Grid,
    Card,
    Group,
    Badge,
    Text,
    Image,
    Stack,
    Paper,
    Button,
    Breadcrumbs,
    Anchor,
    Title,
    Divider,
    SimpleGrid,
    Modal,
    ActionIcon,
    Box,
    ThemeIcon,
    Avatar,
    Textarea,
    Switch,
    Tooltip,
    Progress,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    IconStar,
    IconStarFilled,
    IconMapPin,
    IconClock,
    IconEye,
    IconCalendar,
    IconSparkles,
    IconChevronLeft,
    IconChevronRight,
    IconX,
    IconCopy,
    IconMessage,
    IconCheck,
    IconHeart,
    IconHeartFilled,
    IconSend,
    IconPhone,
    IconBrandWhatsapp,
    IconShieldCheck,
    IconUser,
    IconShoppingCart,
    IconUserCircle,
    IconArrowLeft,
    IconMail,
} from '@tabler/icons-react';
import PublicLayout from '@/Layouts/PublicLayout';
import { PageProps } from '@/types';
import ServicePricingBadge from '@/Components/ServicePricingBadge';
import SaluScoreBadge from '@/Components/SaluScoreBadge';
import RecommendedProviders from '@/Components/RecommendedProviders';
import ServicePackages, { ServicePackage } from '@/Components/ServicePackages';

interface Category {
    id: number;
    name: string;
}

interface Provider {
    id: number;
    name: string;
    description: string | null;
    rating: number | null;
    total_reviews: number;
    completed_services: number;
    is_verified: boolean;
    member_since: string;
    working_hours: Record<string, any> | null;
    email: string;
    phone: string | null;
    whatsapp: string | null;
    location: string | null;
    // Salu Score fields
    salu_score: number;
    salu_badge: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
}

interface GalleryImage {
    id: number;
    url: string;
    thumb: string;
}

interface Service {
    id: number;
    name: string;
    description: string;
    category: Category;
    provider: Provider;
    price_type: 'fixed' | 'hourly' | 'variable';
    price_type_label: string;
    price_min: number;
    supports_urgent?: boolean;
    price_max: number | null;
    formatted_price: string;
    location: string | null;
    delivery_time: string | null;
    tags: string[];
    is_featured: boolean;
    cover_url: string | null;
    gallery: GalleryImage[];
    view_count: number;
    created_at: string;
    packages?: ServicePackage[];
}

interface RelatedService {
    id: number;
    name: string;
    description: string;
    category: Category;
    provider: { name: string; rating: number | null };
    formatted_price: string;
    location: string | null;
    is_featured: boolean;
    cover_url: string | null;
}

interface Review {
    id: number;
    rating: number;
    comment: string;
    reviewer_name: string;
    reviewer_avatar: string | null;
    is_verified: boolean;
    is_anonymous: boolean;
    provider_response: string | null;
    provider_responded_at: string | null;
    created_at: string;
    created_at_human: string;
}

interface ReviewStats {
    total: number;
    average: number;
    distribution: Record<number, number>;
}

interface RecommendedProvider {
    id: number;
    display_name: string;
    rating: number | null;
    total_reviews: number;
    completed_services: number;
    average_response_time_minutes: number;
    salu_score: number;
    salu_badge: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
}

interface Props extends PageProps {
    service: Service;
    relatedServices: RelatedService[];
    canContact: boolean;
    isInWishlist: boolean;
    isOwnService: boolean;
    serviceReviews: Review[];
    serviceReviewStats: ReviewStats;
    providerReviews: Review[];
    providerReviewStats: ReviewStats;
    recommendedProviders: RecommendedProvider[];
}

export default function Show({
    service,
    relatedServices,
    canContact,
    isInWishlist,
    isOwnService,
    serviceReviews,
    serviceReviewStats,
    providerReviews,
    providerReviewStats,
    recommendedProviders,
}: Props) {
    const { auth, errors } = usePage<PageProps>().props;
    const [selectedImage, setSelectedImage] = useState(service.cover_url);
    const [lightboxOpened, { open: openLightbox, close: closeLightbox }] = useDisclosure(false);
    const [contactModalOpened, { open: openContactModal, close: closeContactModal }] = useDisclosure(false);
    const [hireModalOpened, { open: openHireModal, close: closeHireModal }] = useDisclosure(false);
    const [hireConfirmed, setHireConfirmed] = useState(false);
    const [hireRequirements, setHireRequirements] = useState('');
    const [hireUrgent, setHireUrgent] = useState(false);
    const [hireLoading, setHireLoading] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [inWishlist, setInWishlist] = useState(isInWishlist);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

    const contactForm = useForm({
        message: '',
    });

    const allImages = [
        ...(service.cover_url ? [{ url: service.cover_url, thumb: service.cover_url }] : []),
        ...service.gallery,
    ];

    // Show SweetAlert2 when there's an error
    useEffect(() => {
        if (errors.error) {
            Swal.fire({
                title: '⚠️ Erro ao Contratar Serviço',
                html: `
                    <div style="text-align: left; padding: 0 20px;">
                        <p style="font-size: 16px; margin-bottom: 20px; font-weight: 500;">
                            ${errors.error}
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #5dba40;">
                            <p style="font-size: 14px; color: #495057; margin: 0;">
                                <strong>💡 Como Resolver:</strong><br/>
                                Recarregue sua carteira para continuar. Você será redirecionado para a página de recarga.
                            </p>
                        </div>
                    </div>
                `,
                icon: 'error',
                iconColor: '#dc3545',
                confirmButtonText: '💰 Recarregar Carteira Agora',
                confirmButtonColor: '#5dba40',
                showCancelButton: true,
                cancelButtonText: 'Voltar Depois',
                cancelButtonColor: '#6c757d',
                width: '550px',
                padding: '2em',
                customClass: {
                    confirmButton: 'btn-confirm-wallet',
                    cancelButton: 'btn-cancel-wallet',
                },
                buttonsStyling: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    router.visit(route('wallet.top-up'));
                }
            });
        }
    }, [errors]);

    const handleContact = () => {
        // Track click with CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(route('services.track-click', service.id), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken || '',
                'Accept': 'application/json',
            },
        });

        if (!canContact) {
            router.visit(route('login'));
            return;
        }

        openContactModal();
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!contactForm.data.message.trim()) {
            notifications.show({
                title: 'Erro',
                message: 'Por favor, escreva uma mensagem.',
                color: 'red',
            });
            return;
        }

        contactForm.post(route('services.contact', service.id), {
            onSuccess: () => {
                closeContactModal();
                contactForm.reset();
                notifications.show({
                    title: 'Mensagem enviada',
                    message: 'A sua mensagem foi enviada ao prestador.',
                    color: 'green',
                });
            },
            onError: () => {
                notifications.show({
                    title: 'Erro',
                    message: 'Não foi possível enviar a mensagem. Tente novamente.',
                    color: 'red',
                });
            },
        });
    };

    const handleWishlistToggle = () => {
        if (!auth.user) {
            router.visit(route('login'));
            return;
        }

        setWishlistLoading(true);

        if (inWishlist) {
            router.delete(route('wishlist.destroy', service.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setInWishlist(false);
                    notifications.show({
                        title: 'Removido dos desejos',
                        message: 'O serviço foi removido da sua lista de desejos.',
                        color: 'blue',
                    });
                },
                onFinish: () => setWishlistLoading(false),
            });
        } else {
            router.post(route('wishlist.store', service.id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setInWishlist(true);
                    notifications.show({
                        title: 'Adicionado aos desejos',
                        message: 'O serviço foi adicionado à sua lista de desejos.',
                        color: 'green',
                    });
                },
                onFinish: () => setWishlistLoading(false),
            });
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleHireService = () => {
        if (!auth.user) {
            router.visit(route('login'));
            return;
        }
        openHireModal();
    };

    const handleConfirmHire = () => {
        setHireLoading(true);
        router.post(route('orders.create-from-service', service.id), {
            requirements: hireRequirements || undefined,
            is_urgent: hireUrgent,
            payment_method: 'wallet',
        }, {
            onSuccess: () => {
                setHireConfirmed(true);
                setHireLoading(false);
            },
            onError: () => {
                setHireLoading(false);
                notifications.show({
                    title: 'Erro',
                    message: 'Não foi possível criar o pedido. Tente novamente.',
                    color: 'red',
                });
            },
        });
    };

    const handleCloseHireModal = () => {
        closeHireModal();
        setHireConfirmed(false);
        setHireRequirements('');
        setHireUrgent(false);
    };

    const formatWhatsAppLink = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        return `https://wa.me/${cleaned}`;
    };

    const breadcrumbItems = [
        { title: 'Serviços', href: route('services.index') },
        { title: service.category.name, href: route('services.index', { category_id: service.category.id }) },
        { title: service.name, href: '#' },
    ].map((item, index) => (
        <Anchor component={Link} href={item.href} key={index} size="sm">
            {item.title}
        </Anchor>
    ));

    const renderStars = (rating: number) => {
        return (
            <Group gap={2}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Box key={star} style={{ color: star <= Math.round(rating) ? '#fab005' : '#dee2e6' }}>
                        {star <= Math.round(rating) ? (
                            <IconStarFilled size={16} />
                        ) : (
                            <IconStar size={16} />
                        )}
                    </Box>
                ))}
            </Group>
        );
    };

    return (
        <PublicLayout>
            <Head title={service.name} />

            <Container size="xl" py="xl">
                <Breadcrumbs mb="lg">{breadcrumbItems}</Breadcrumbs>

                {/* Owner Banner */}
                {isOwnService && (
                    <Paper p="md" mb="lg" bg="blue.0" radius="md" style={{ border: '1px solid var(--mantine-color-blue-3)' }}>
                        <Group>
                            <ThemeIcon size="lg" variant="light" color="blue">
                                <IconUser size={20} />
                            </ThemeIcon>
                            <Box style={{ flex: 1 }}>
                                <Text fw={600} c="blue.8">Este e o seu proprio servico</Text>
                                <Text size="sm" c="dimmed">
                                    Voce esta a visualizar a pagina publica do seu servico. As visualizacoes nao sao contabilizadas.
                                </Text>
                            </Box>
                            <Button
                                variant="light"
                                color="blue"
                                component={Link}
                                href={route('provider.services.edit', service.id)}
                            >
                                Editar Servico
                            </Button>
                        </Group>
                    </Paper>
                )}

                <Grid gutter="xl">
                    {/* Main Content */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        {/* Gallery */}
                        <Card shadow="sm" padding={0} radius="md" withBorder mb="lg">
                            <Box
                                pos="relative"
                                style={{ aspectRatio: '16/9', cursor: 'pointer' }}
                                onClick={() => {
                                    setGalleryIndex(0);
                                    openLightbox();
                                }}
                            >
                                <Image
                                    src={selectedImage || '/images/placeholder-service.jpg'}
                                    alt={service.name}
                                    h="100%"
                                    fallbackSrc="https://placehold.co/800x450?text=Serviço"
                                    style={{ objectFit: 'cover' }}
                                />
                                {service.is_featured && (
                                    <Badge
                                        pos="absolute"
                                        top={16}
                                        left={16}
                                        size="lg"
                                        variant="filled"
                                        color="yellow"
                                        leftSection={<IconSparkles size={14} />}
                                    >
                                        Destaque
                                    </Badge>
                                )}
                                <Tooltip label={inWishlist ? 'Remover dos desejos' : 'Adicionar aos desejos'}>
                                    <ActionIcon
                                        variant="filled"
                                        color={inWishlist ? 'red' : 'white'}
                                        pos="absolute"
                                        top={16}
                                        right={16}
                                        size="lg"
                                        radius="xl"
                                        loading={wishlistLoading}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleWishlistToggle();
                                        }}
                                        style={{
                                            backgroundColor: inWishlist ? undefined : 'rgba(255,255,255,0.9)',
                                            color: inWishlist ? undefined : '#e03131',
                                        }}
                                    >
                                        {inWishlist ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
                                    </ActionIcon>
                                </Tooltip>
                            </Box>
                            {allImages.length > 1 && (
                                <Group gap="xs" p="md">
                                    {allImages.map((image, index) => (
                                        <Box
                                            key={index}
                                            w={80}
                                            h={60}
                                            style={{
                                                cursor: 'pointer',
                                                borderRadius: 8,
                                                overflow: 'hidden',
                                                border: selectedImage === image.url ? '2px solid var(--mantine-color-blue-6)' : '2px solid transparent',
                                            }}
                                            onClick={() => setSelectedImage(image.url)}
                                        >
                                            <Image
                                                src={image.thumb || image.url}
                                                alt=""
                                                h="100%"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        </Box>
                                    ))}
                                </Group>
                            )}
                        </Card>

                        {/* Details */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                            <Group justify="space-between" align="flex-start" mb="md">
                                <Box>
                                    <Badge variant="light" color="blue" mb="xs">
                                        {service.category.name}
                                    </Badge>
                                    <Title order={2}>{service.name}</Title>
                                </Box>
                                <Box ta="right">
                                    <Text size="sm" c="dimmed" mb="xs">
                                        {service.price_type_label}
                                    </Text>
                                    <ServicePricingBadge
                                        priceType={service.price_type}
                                        priceMin={service.price_min}
                                        priceMax={service.price_max || undefined}
                                        size="lg"
                                        variant="filled"
                                    />
                                    {service.price_type === 'hourly' && (
                                        <Text size="xs" c="dimmed" mt="xs">
                                            (Tempo mínimo: 1 hora)
                                        </Text>
                                    )}
                                    {service.price_type === 'variable' && (
                                        <Text size="xs" c="dimmed" mt="xs">
                                            (Preço após avaliação)
                                        </Text>
                                    )}
                                </Box>
                            </Group>

                            <Group gap="xl" mb="lg">
                                {service.location && (
                                    <Group gap={4}>
                                        <IconMapPin size={16} color="gray" />
                                        <Text size="sm" c="dimmed">
                                            {service.location}
                                        </Text>
                                    </Group>
                                )}
                                {service.delivery_time && (
                                    <Group gap={4}>
                                        <IconClock size={16} color="gray" />
                                        <Text size="sm" c="dimmed">
                                            {service.delivery_time}
                                        </Text>
                                    </Group>
                                )}
                                <Group gap={4}>
                                    <IconEye size={16} color="gray" />
                                    <Text size="sm" c="dimmed">
                                        {service.view_count} visualizações
                                    </Text>
                                </Group>
                                <Group gap={4}>
                                    <IconCalendar size={16} color="gray" />
                                    <Text size="sm" c="dimmed">
                                        Publicado em {service.created_at}
                                    </Text>
                                </Group>
                            </Group>

                            <Divider my="md" />

                            <Title order={4} mb="sm">
                                Descrição
                            </Title>
                            <Text style={{ whiteSpace: 'pre-wrap' }} c="dimmed">
                                {service.description}
                            </Text>

                            {service.tags.length > 0 && (
                                <>
                                    <Divider my="md" />
                                    <Title order={4} mb="sm">
                                        Tags
                                    </Title>
                                    <Group gap="xs">
                                        {service.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline" color="gray">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </Group>
                                </>
                            )}
                        </Card>

                        {/* Service Packages */}
                        {service.packages && service.packages.length > 0 && (
                            <Box mb="lg">
                                <ServicePackages
                                    packages={service.packages}
                                    onSelectPackage={setSelectedPackageId}
                                    selectedPackageId={selectedPackageId}
                                />
                            </Box>
                        )}

                        {/* Recommended Providers */}
                        {recommendedProviders.length > 0 && (
                            <Box mb="lg">
                                <RecommendedProviders
                                    providers={recommendedProviders}
                                    serviceId={service.id}
                                />
                            </Box>
                        )}

                        {/* Service Reviews Section */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                            <Group justify="space-between" mb="lg">
                                <Title order={3}>Avaliações deste Serviço</Title>
                                {serviceReviewStats.total > 0 && (
                                    <Badge size="lg" variant="light" color="teal">
                                        {serviceReviewStats.total} avaliações
                                    </Badge>
                                )}
                            </Group>

                            {serviceReviewStats.total > 0 ? (
                                <>
                                    {/* Rating Summary */}
                                    <Paper p="md" bg="teal.0" radius="md" mb="xl">
                                        <Grid>
                                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                                <Stack align="center" gap="xs">
                                                    <Text size="3rem" fw={700} c="teal">
                                                        {serviceReviewStats.average.toFixed(1)}
                                                    </Text>
                                                    {renderStars(serviceReviewStats.average)}
                                                    <Text size="sm" c="dimmed">
                                                        {serviceReviewStats.total} avaliações
                                                    </Text>
                                                </Stack>
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 8 }}>
                                                <Stack gap="xs">
                                                    {[5, 4, 3, 2, 1].map((star) => {
                                                        const count = serviceReviewStats.distribution[star] || 0;
                                                        const percentage = serviceReviewStats.total > 0 ? (count / serviceReviewStats.total) * 100 : 0;
                                                        return (
                                                            <Group key={star} gap="xs">
                                                                <Group gap={2} w={60}>
                                                                    <Text size="sm">{star}</Text>
                                                                    <IconStarFilled size={12} color="#fab005" />
                                                                </Group>
                                                                <Progress
                                                                    value={percentage}
                                                                    color="yellow"
                                                                    size="sm"
                                                                    style={{ flex: 1 }}
                                                                />
                                                                <Text size="sm" c="dimmed" w={30}>
                                                                    {count}
                                                                </Text>
                                                            </Group>
                                                        );
                                                    })}
                                                </Stack>
                                            </Grid.Col>
                                        </Grid>
                                    </Paper>

                                    {/* Reviews List */}
                                    <Stack gap="md">
                                        {serviceReviews.map((review) => (
                                            <Paper key={review.id} p="md" withBorder radius="md">
                                                <Group justify="space-between" mb="sm">
                                                    <Group gap="sm">
                                                        <Avatar
                                                            src={review.reviewer_avatar}
                                                            radius="xl"
                                                            color="teal"
                                                        >
                                                            {review.is_anonymous ? (
                                                                <IconUser size={20} />
                                                            ) : (
                                                                review.reviewer_name.charAt(0).toUpperCase()
                                                            )}
                                                        </Avatar>
                                                        <Box>
                                                            <Group gap="xs">
                                                                <Text fw={500}>{review.reviewer_name}</Text>
                                                                {review.is_verified && (
                                                                    <Tooltip label="Compra Verificada">
                                                                        <Badge size="xs" color="green" variant="filled">
                                                                            Verificado
                                                                        </Badge>
                                                                    </Tooltip>
                                                                )}
                                                            </Group>
                                                            <Text size="xs" c="dimmed">
                                                                {review.created_at_human}
                                                            </Text>
                                                        </Box>
                                                    </Group>
                                                    {renderStars(review.rating)}
                                                </Group>

                                                {review.comment && (
                                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {review.comment}
                                                    </Text>
                                                )}

                                                {review.provider_response && (
                                                    <Paper p="sm" bg="blue.0" radius="sm" mt="md">
                                                        <Group gap="xs" mb="xs">
                                                            <Avatar size="sm" color="blue" radius="xl">
                                                                {service.provider.name.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <Text size="sm" fw={500}>
                                                                Resposta de {service.provider.name}
                                                            </Text>
                                                            {review.provider_responded_at && (
                                                                <Text size="xs" c="dimmed">
                                                                    {review.provider_responded_at}
                                                                </Text>
                                                            )}
                                                        </Group>
                                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {review.provider_response}
                                                        </Text>
                                                    </Paper>
                                                )}
                                            </Paper>
                                        ))}
                                    </Stack>
                                </>
                            ) : (
                                <Paper p="xl" bg="gray.0" radius="md" ta="center">
                                    <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                        <IconStar size={24} />
                                    </ThemeIcon>
                                    <Text c="dimmed">
                                        Este serviço ainda não tem avaliações.
                                    </Text>
                                    <Text size="sm" c="dimmed" mt="xs">
                                        Seja o primeiro a avaliar após contratar este serviço!
                                    </Text>
                                </Paper>
                            )}
                        </Card>

                        {/* Provider Reviews Section */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="lg">
                                <Title order={3}>Avaliações do Prestador</Title>
                                {providerReviewStats.total > 0 && (
                                    <Badge size="lg" variant="light" color="blue">
                                        {providerReviewStats.total} avaliações
                                    </Badge>
                                )}
                            </Group>

                            {providerReviewStats.total > 0 ? (
                                <>
                                    {/* Rating Summary */}
                                    <Paper p="md" bg="gray.0" radius="md" mb="xl">
                                        <Grid>
                                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                                <Stack align="center" gap="xs">
                                                    <Text size="3rem" fw={700} c="blue">
                                                        {providerReviewStats.average.toFixed(1)}
                                                    </Text>
                                                    {renderStars(providerReviewStats.average)}
                                                    <Text size="sm" c="dimmed">
                                                        {providerReviewStats.total} avaliações
                                                    </Text>
                                                </Stack>
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 8 }}>
                                                <Stack gap="xs">
                                                    {[5, 4, 3, 2, 1].map((star) => {
                                                        const count = providerReviewStats.distribution[star] || 0;
                                                        const percentage = providerReviewStats.total > 0 ? (count / providerReviewStats.total) * 100 : 0;
                                                        return (
                                                            <Group key={star} gap="xs">
                                                                <Group gap={2} w={60}>
                                                                    <Text size="sm">{star}</Text>
                                                                    <IconStarFilled size={12} color="#fab005" />
                                                                </Group>
                                                                <Progress
                                                                    value={percentage}
                                                                    color="yellow"
                                                                    size="sm"
                                                                    style={{ flex: 1 }}
                                                                />
                                                                <Text size="sm" c="dimmed" w={30}>
                                                                    {count}
                                                                </Text>
                                                            </Group>
                                                        );
                                                    })}
                                                </Stack>
                                            </Grid.Col>
                                        </Grid>
                                    </Paper>

                                    {/* Reviews List */}
                                    <Stack gap="md">
                                        {providerReviews.map((review) => (
                                            <Paper key={review.id} p="md" withBorder radius="md">
                                                <Group justify="space-between" mb="sm">
                                                    <Group gap="sm">
                                                        <Avatar
                                                            src={review.reviewer_avatar}
                                                            radius="xl"
                                                            color="blue"
                                                        >
                                                            {review.is_anonymous ? (
                                                                <IconUser size={20} />
                                                            ) : (
                                                                review.reviewer_name.charAt(0).toUpperCase()
                                                            )}
                                                        </Avatar>
                                                        <Box>
                                                            <Group gap="xs">
                                                                <Text fw={500}>{review.reviewer_name}</Text>
                                                                {review.is_verified && (
                                                                    <Tooltip label="Compra Verificada">
                                                                        <Badge size="xs" color="green" variant="filled">
                                                                            Verificado
                                                                        </Badge>
                                                                    </Tooltip>
                                                                )}
                                                            </Group>
                                                            <Text size="xs" c="dimmed">
                                                                {review.created_at_human}
                                                            </Text>
                                                        </Box>
                                                    </Group>
                                                    {renderStars(review.rating)}
                                                </Group>

                                                {review.comment && (
                                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {review.comment}
                                                    </Text>
                                                )}

                                                {review.provider_response && (
                                                    <Paper p="sm" bg="blue.0" radius="sm" mt="md">
                                                        <Group gap="xs" mb="xs">
                                                            <Avatar size="sm" color="blue" radius="xl">
                                                                {service.provider.name.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <Text size="sm" fw={500}>
                                                                Resposta de {service.provider.name}
                                                            </Text>
                                                            {review.provider_responded_at && (
                                                                <Text size="xs" c="dimmed">
                                                                    {review.provider_responded_at}
                                                                </Text>
                                                            )}
                                                        </Group>
                                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                            {review.provider_response}
                                                        </Text>
                                                    </Paper>
                                                )}
                                            </Paper>
                                        ))}
                                    </Stack>

                                    {providerReviewStats.total > providerReviews.length && (
                                        <Button
                                            variant="light"
                                            fullWidth
                                            mt="lg"
                                            component={Link}
                                            href={route('providers.show', service.provider.id)}
                                        >
                                            Ver todas as {providerReviewStats.total} avaliações
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Paper p="xl" bg="gray.0" radius="md" ta="center">
                                    <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                        <IconStar size={24} />
                                    </ThemeIcon>
                                    <Text c="dimmed">
                                        Este prestador ainda não tem avaliações.
                                    </Text>
                                </Paper>
                            )}
                        </Card>
                    </Grid.Col>

                    {/* Sidebar */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="lg" style={{ position: 'sticky', top: 80 }}>
                            {/* Provider Card */}
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Title order={4}>Sobre o Prestador</Title>
                                    {service.provider.is_verified && (
                                        <Tooltip label="Prestador Verificado">
                                            <Badge
                                                color="blue"
                                                variant="filled"
                                                leftSection={<IconShieldCheck size={12} />}
                                            >
                                                Verificado
                                            </Badge>
                                        </Tooltip>
                                    )}
                                </Group>

                                <Group mb="md">
                                    <Avatar color="blue" radius="xl" size="lg">
                                        {service.provider.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box style={{ flex: 1 }}>
                                        <Group gap="xs" mb={4}>
                                            <Link
                                                href={route('providers.show', service.provider.id)}
                                                className="no-underline hover:underline"
                                            >
                                                <Text fw={600}>{service.provider.name}</Text>
                                            </Link>
                                            {service.provider.salu_score > 0 && (
                                                <SaluScoreBadge
                                                    score={service.provider.salu_score}
                                                    badge={service.provider.salu_badge}
                                                    size="sm"
                                                />
                                            )}
                                        </Group>
                                        {service.provider.rating ? (
                                            <Group gap={4}>
                                                <IconStarFilled size={14} color="#fab005" />
                                                <Text size="sm">
                                                    {Number(service.provider.rating).toFixed(1)} ({service.provider.total_reviews} avaliações)
                                                </Text>
                                            </Group>
                                        ) : (
                                            <Text size="sm" c="dimmed">Sem avaliações</Text>
                                        )}
                                    </Box>
                                </Group>

                                {service.provider.description && (
                                    <Text size="sm" c="dimmed" mb="md" lineClamp={3}>
                                        {service.provider.description}
                                    </Text>
                                )}

                                <Stack gap="xs" mb="lg">
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Serviços Concluídos</Text>
                                        <Text size="sm" fw={600}>{service.provider.completed_services}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Membro desde</Text>
                                        <Text size="sm" fw={600}>{service.provider.member_since}</Text>
                                    </Group>
                                </Stack>

                                <Divider my="md" label="Contacto" labelPosition="center" />

                                {/* Contact Info */}
                                <Stack gap="sm" mb="lg">
                                    {service.provider.email && (
                                        <Group gap="xs">
                                            <ThemeIcon size="sm" variant="light" color="violet">
                                                <IconMail size={14} />
                                            </ThemeIcon>
                                            <Text size="sm">
                                                <a href={`mailto:${service.provider.email}`} className="text-violet-600 no-underline hover:underline">
                                                    {service.provider.email}
                                                </a>
                                            </Text>
                                        </Group>
                                    )}
                                    {service.provider.phone && (
                                        <Group gap="xs">
                                            <ThemeIcon size="sm" variant="light" color="blue">
                                                <IconPhone size={14} />
                                            </ThemeIcon>
                                            <Text size="sm">
                                                <a href={`tel:${service.provider.phone}`} className="text-blue-600 no-underline hover:underline">
                                                    {service.provider.phone}
                                                </a>
                                            </Text>
                                        </Group>
                                    )}
                                    {service.provider.whatsapp && (
                                        <Group gap="xs">
                                            <ThemeIcon size="sm" variant="light" color="green">
                                                <IconBrandWhatsapp size={14} />
                                            </ThemeIcon>
                                            <Text size="sm">
                                                <a
                                                    href={formatWhatsAppLink(service.provider.whatsapp)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 no-underline hover:underline"
                                                >
                                                    WhatsApp
                                                </a>
                                            </Text>
                                        </Group>
                                    )}
                                    {service.provider.location && (
                                        <Group gap="xs">
                                            <ThemeIcon size="sm" variant="light" color="gray">
                                                <IconMapPin size={14} />
                                            </ThemeIcon>
                                            <Text size="sm" c="dimmed">{service.provider.location}</Text>
                                        </Group>
                                    )}
                                </Stack>

                                {isOwnService ? (
                                    <Stack gap="sm">
                                        <Button
                                            fullWidth
                                            size="lg"
                                            color="blue"
                                            component={Link}
                                            href={route('provider.services.edit', service.id)}
                                        >
                                            Editar Servico
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="light"
                                            component={Link}
                                            href={route('provider.services.index')}
                                        >
                                            Ver Todos os Servicos
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Stack gap="sm">
                                        <Button
                                            fullWidth
                                            size="lg"
                                            color="teal"
                                            leftSection={<IconShoppingCart size={20} />}
                                            onClick={handleHireService}
                                        >
                                            Contratar Servico
                                        </Button>
                                        <Button
                                            fullWidth
                                            size="md"
                                            variant="light"
                                            leftSection={<IconMessage size={20} />}
                                            onClick={handleContact}
                                        >
                                            Enviar Mensagem
                                        </Button>
                                        {service.provider.whatsapp && (
                                            <Button
                                                fullWidth
                                                variant="light"
                                                color="green"
                                                leftSection={<IconBrandWhatsapp size={20} />}
                                                component="a"
                                                href={formatWhatsAppLink(service.provider.whatsapp)}
                                                target="_blank"
                                            >
                                                Contactar via WhatsApp
                                            </Button>
                                        )}
                                        <Button
                                            fullWidth
                                            variant="light"
                                            color={inWishlist ? 'red' : 'pink'}
                                            leftSection={inWishlist ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
                                            onClick={handleWishlistToggle}
                                            loading={wishlistLoading}
                                        >
                                            {inWishlist ? 'Remover dos Desejos' : 'Adicionar aos Desejos'}
                                        </Button>
                                    </Stack>
                                )}
                            </Card>

                            {/* Evaluate Card */}
                            {!isOwnService && auth.user && (
                                <Card shadow="sm" padding="lg" radius="md" withBorder>
                                    <Title order={4} mb="md">Avaliar</Title>
                                    <Text size="sm" c="dimmed" mb="md">
                                        Ja contratou este servico? Avalie a sua experiencia!
                                    </Text>
                                    <Button
                                        variant="light"
                                        fullWidth
                                        color="yellow"
                                        leftSection={<IconStar size={16} />}
                                        component={Link}
                                        href={route('reviews.create', service.id)}
                                    >
                                        Avaliar Servico
                                    </Button>
                                </Card>
                            )}

                            {/* Share Card */}
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Title order={4} mb="md">Partilhar</Title>
                                <Button
                                    variant="light"
                                    fullWidth
                                    leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                    color={copied ? 'green' : 'blue'}
                                    onClick={handleCopyLink}
                                >
                                    {copied ? 'Link Copiado!' : 'Copiar Link'}
                                </Button>
                            </Card>
                        </Stack>
                    </Grid.Col>
                </Grid>

                {/* Related Services */}
                {relatedServices.length > 0 && (
                    <Box mt={60}>
                        <Title order={3} mb="lg">Serviços Relacionados</Title>
                        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="lg">
                            {relatedServices.map((related) => (
                                <Card
                                    key={related.id}
                                    shadow="sm"
                                    padding="lg"
                                    radius="md"
                                    withBorder
                                    component={Link}
                                    href={route('services.show', related.id)}
                                    className="hover:shadow-lg transition-shadow no-underline"
                                >
                                    <Card.Section pos="relative">
                                        <Image
                                            src={related.cover_url || '/images/placeholder-service.jpg'}
                                            height={120}
                                            alt={related.name}
                                            fallbackSrc="https://placehold.co/400x200?text=Serviço"
                                        />
                                        {related.is_featured && (
                                            <Badge
                                                pos="absolute"
                                                top={8}
                                                left={8}
                                                variant="filled"
                                                color="yellow"
                                                size="sm"
                                            >
                                                Destaque
                                            </Badge>
                                        )}
                                    </Card.Section>

                                    <Text fw={600} mt="md" lineClamp={1}>
                                        {related.name}
                                    </Text>
                                    <Text fw={700} c="blue">
                                        {related.formatted_price} AOA
                                    </Text>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Box>
                )}
            </Container>

            {/* Contact Modal */}
            <Modal
                opened={contactModalOpened}
                onClose={closeContactModal}
                title={
                    <Group gap="sm">
                        <Avatar color="blue" radius="xl" size="sm">
                            {service.provider.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                            <Text fw={600} size="sm">Contactar {service.provider.name}</Text>
                            <Text size="xs" c="dimmed">{service.name}</Text>
                        </div>
                    </Group>
                }
                size="md"
                centered
            >
                <form onSubmit={handleSendMessage}>
                    <Stack gap="md">
                        <Textarea
                            label="Mensagem"
                            placeholder={`Olá! Estou interessado no serviço "${service.name}". Gostaria de saber mais informações...`}
                            minRows={4}
                            maxRows={8}
                            maxLength={2000}
                            value={contactForm.data.message}
                            onChange={(e) => contactForm.setData('message', e.target.value)}
                            error={contactForm.errors.message}
                            required
                        />
                        <Text size="xs" c="dimmed">
                            Apresente-se e explique o que precisa. Seja claro e específico para obter uma resposta mais rápida.
                        </Text>
                        <Group justify="flex-end">
                            <Button variant="light" onClick={closeContactModal}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                leftSection={<IconSend size={16} />}
                                loading={contactForm.processing}
                            >
                                Enviar Mensagem
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {/* Lightbox Modal */}
            <Modal
                opened={lightboxOpened}
                onClose={closeLightbox}
                size="xl"
                padding={0}
                withCloseButton={false}
                centered
                styles={{
                    body: { backgroundColor: 'black' },
                    content: { backgroundColor: 'black' },
                }}
            >
                <Box pos="relative">
                    <ActionIcon
                        variant="filled"
                        color="dark"
                        pos="absolute"
                        top={16}
                        right={16}
                        style={{ zIndex: 10 }}
                        onClick={closeLightbox}
                    >
                        <IconX size={20} />
                    </ActionIcon>

                    {allImages.length > 1 && (
                        <>
                            <ActionIcon
                                variant="filled"
                                color="dark"
                                pos="absolute"
                                top="50%"
                                left={16}
                                style={{ zIndex: 10, transform: 'translateY(-50%)' }}
                                onClick={() => setGalleryIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                            >
                                <IconChevronLeft size={20} />
                            </ActionIcon>
                            <ActionIcon
                                variant="filled"
                                color="dark"
                                pos="absolute"
                                top="50%"
                                right={16}
                                style={{ zIndex: 10, transform: 'translateY(-50%)' }}
                                onClick={() => setGalleryIndex((prev) => (prev + 1) % allImages.length)}
                            >
                                <IconChevronRight size={20} />
                            </ActionIcon>
                        </>
                    )}

                    <Image
                        src={allImages[galleryIndex]?.url}
                        alt={service.name}
                        fit="contain"
                        h="80vh"
                    />

                    {allImages.length > 1 && (
                        <Text ta="center" c="white" py="sm">
                            {galleryIndex + 1} / {allImages.length}
                        </Text>
                    )}
                </Box>
            </Modal>

            {/* Hire Service Modal */}
            <Modal
                opened={hireModalOpened}
                onClose={handleCloseHireModal}
                title={!hireConfirmed ? "Contratar Serviço" : "Contratação Confirmada!"}
                size="md"
                centered
            >
                {!hireConfirmed ? (
                    <Stack gap="lg">
                        {/* Service Summary */}
                        <Paper p="md" bg="gray.0" radius="md">
                            <Group gap="md">
                                <Avatar color="teal" radius="md" size="lg">
                                    <IconShoppingCart size={24} />
                                </Avatar>
                                <Box style={{ flex: 1 }}>
                                    <Text fw={600}>{service.name}</Text>
                                    <Text size="sm" c="dimmed">{service.provider.name}</Text>
                                    <Text fw={700} c="teal" size="lg">{service.formatted_price} AOA</Text>
                                </Box>
                            </Group>
                        </Paper>

                        <Textarea
                            label="Requisitos do pedido"
                            description="Descreva o que precisa (opcional)"
                            placeholder="Ex.: reparação de uma torneira na cozinha, disponível amanhã de manhã"
                            minRows={3}
                            maxLength={2000}
                            autosize
                            value={hireRequirements}
                            onChange={(e) => setHireRequirements(e.currentTarget.value)}
                        />

                        {service.supports_urgent && (
                            <Switch
                                label="Pedido urgente"
                                description="Acresce uma taxa de urgência definida pelo prestador"
                                checked={hireUrgent}
                                onChange={(e) => setHireUrgent(e.currentTarget.checked)}
                            />
                        )}

                        <Text size="sm" c="dimmed">
                            O valor é pago com o saldo da sua carteira e fica retido em segurança até confirmar a
                            conclusão do serviço. Se o saldo for insuficiente, recarregue a carteira primeiro.
                        </Text>

                        <Divider />

                        <Group justify="flex-end">
                            <Button variant="light" onClick={handleCloseHireModal}>
                                Cancelar
                            </Button>
                            <Button
                                color="teal"
                                leftSection={<IconCheck size={18} />}
                                onClick={handleConfirmHire}
                                loading={hireLoading}
                            >
                                Confirmar Contratação
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Stack gap="lg" align="center" py="md">
                        <ThemeIcon size={80} radius="xl" color="teal" variant="light">
                            <IconCheck size={40} />
                        </ThemeIcon>

                        <Stack gap="xs" align="center">
                            <Text fw={600} size="lg" ta="center">
                                Pedido criado com sucesso!
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                                O prestador foi notificado. Entre em contacto para combinar os detalhes do serviço e pagamento.
                            </Text>
                        </Stack>

                        <Divider w="100%" />

                        <Text fw={500} size="sm">O que deseja fazer agora?</Text>

                        <Stack gap="sm" w="100%">
                            <Button
                                fullWidth
                                leftSection={<IconMessage size={18} />}
                                onClick={() => {
                                    handleCloseHireModal();
                                    openContactModal();
                                }}
                            >
                                Enviar Mensagem ao Prestador
                            </Button>
                            <Button
                                fullWidth
                                variant="light"
                                leftSection={<IconUserCircle size={18} />}
                                component={Link}
                                href={route('providers.show', service.provider.id)}
                            >
                                Ver Perfil do Prestador
                            </Button>
                            <Button
                                fullWidth
                                variant="light"
                                color="yellow"
                                leftSection={<IconStar size={18} />}
                                component={Link}
                                href={route('reviews.create', service.id)}
                            >
                                Avaliar Prestador
                            </Button>
                            <Button
                                fullWidth
                                variant="subtle"
                                leftSection={<IconArrowLeft size={18} />}
                                onClick={handleCloseHireModal}
                            >
                                Voltar ao Serviço
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Modal>
        </PublicLayout>
    );
}
