import { Card, Group, Text, Avatar, Stack, Button, Badge, SimpleGrid, Paper, Box, ThemeIcon } from '@mantine/core';
import { IconStar, IconCheck, IconClock, IconArrowRight, IconSparkles, IconTrendingUp } from '@tabler/icons-react';
import { Link, router } from '@inertiajs/react';
import SaluScoreBadge from './SaluScoreBadge';

interface Provider {
    id: number;
    display_name: string;
    rating: number | null;
    total_reviews: number;
    completed_services: number;
    average_response_time_minutes: number;
    salu_score: number;
    salu_badge: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
}

interface RecommendedProvidersProps {
    providers: Provider[];
    serviceId: number;
}

export default function RecommendedProviders({ providers, serviceId }: RecommendedProvidersProps) {
    if (!providers || providers.length === 0) {
        return null;
    }

    const formatResponseTime = (minutes: number): string => {
        if (minutes < 60) {
            return `~${minutes}min`;
        }
        const hours = Math.floor(minutes / 60);
        return `~${hours}h`;
    };

    const handleProviderClick = (providerId: number) => {
        // Track click for analytics
        router.post(route('recommendations.click', { provider: providerId }), {}, {
            preserveState: true,
            preserveScroll: true,
            only: [],
        });
    };

    return (
        <Paper p="xl" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <Group mb="lg">
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <IconSparkles size={20} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                    <Text fw={700} size="lg">Prestadores Recomendados</Text>
                    <Text size="sm" c="dimmed">Sugeridos com base em desempenho e qualidade</Text>
                </Box>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {providers.map((provider) => (
                    <Card
                        key={provider.id}
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleProviderClick(provider.id)}
                        component={Link}
                        href={route('providers.show', provider.id)}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <Stack gap="md">
                            <Group>
                                <Avatar color="blue" radius="xl" size="lg">
                                    {provider.display_name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box style={{ flex: 1 }}>
                                    <Group gap="xs" mb={4}>
                                        <Text fw={600} size="sm" lineClamp={1}>
                                            {provider.display_name}
                                        </Text>
                                    </Group>
                                    {provider.salu_score > 0 && (
                                        <SaluScoreBadge
                                            score={provider.salu_score}
                                            badge={provider.salu_badge}
                                            size="xs"
                                        />
                                    )}
                                </Box>
                            </Group>

                            <Stack gap="xs">
                                <Group gap="xs">
                                    <IconStar size={14} color="#fab005" fill="#fab005" />
                                    <Text size="xs" c="dimmed">
                                        {provider.rating ? (
                                            <>
                                                {Number(provider.rating).toFixed(1)} ({provider.total_reviews})
                                            </>
                                        ) : (
                                            'Sem avaliações'
                                        )}
                                    </Text>
                                </Group>

                                <Group gap="xs">
                                    <IconCheck size={14} color="#51cf66" />
                                    <Text size="xs" c="dimmed">
                                        {provider.completed_services} serviços concluídos
                                    </Text>
                                </Group>

                                <Group gap="xs">
                                    <IconClock size={14} color="#339af0" />
                                    <Text size="xs" c="dimmed">
                                        Resposta: {formatResponseTime(provider.average_response_time_minutes)}
                                    </Text>
                                </Group>
                            </Stack>

                            <Button
                                variant="light"
                                size="xs"
                                fullWidth
                                rightSection={<IconArrowRight size={14} />}
                            >
                                Ver Perfil
                            </Button>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>

            <Group justify="center" mt="lg">
                <Badge
                    size="sm"
                    variant="light"
                    color="blue"
                    leftSection={<IconTrendingUp size={12} />}
                >
                    Algoritmo baseado em desempenho real
                </Badge>
            </Group>
        </Paper>
    );
}
