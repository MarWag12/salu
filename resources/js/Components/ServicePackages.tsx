import { Card, Group, Text, Stack, Button, Badge, SimpleGrid, List, ThemeIcon, Box, Title, Paper } from '@mantine/core';
import { IconCheck, IconClock, IconRefresh, IconStar, IconTrophy, IconCrown } from '@tabler/icons-react';

export interface ServicePackage {
    id: number;
    package_type: 'basic' | 'professional' | 'premium';
    name: string;
    description: string | null;
    price: number;
    delivery_time: string | null;
    features: string[];
    revisions_included: number;
    is_active: boolean;
}

interface ServicePackagesProps {
    packages: ServicePackage[];
    onSelectPackage?: (packageId: number) => void;
    selectedPackageId?: number | null;
}

const packageConfig = {
    basic: {
        color: 'blue',
        icon: IconCheck,
        label: 'Básico',
        recommended: false,
    },
    professional: {
        color: 'green',
        icon: IconStar,
        label: 'Profissional',
        recommended: true,
    },
    premium: {
        color: 'yellow',
        icon: IconCrown,
        label: 'Premium',
        recommended: false,
    },
};

export default function ServicePackages({ packages, onSelectPackage, selectedPackageId }: ServicePackagesProps) {
    if (!packages || packages.length === 0) {
        return null;
    }

    // Sort packages by type order: basic, professional, premium
    const typeOrder = { basic: 1, professional: 2, premium: 3 };
    const sortedPackages = [...packages].sort(
        (a, b) => typeOrder[a.package_type] - typeOrder[b.package_type]
    );

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('pt-PT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    return (
        <Paper p="xl" radius="md" withBorder>
            <Box mb="xl">
                <Title order={3} mb="xs">
                    Escolha o Pacote Ideal
                </Title>
                <Text size="sm" c="dimmed">
                    Selecione o pacote que melhor atende às suas necessidades
                </Text>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 2, md: packages.length }} spacing="lg">
                {sortedPackages.map((pkg) => {
                    const config = packageConfig[pkg.package_type];
                    const Icon = config.icon;
                    const isSelected = selectedPackageId === pkg.id;
                    const isRecommended = config.recommended;

                    return (
                        <Card
                            key={pkg.id}
                            shadow={isSelected ? 'lg' : 'sm'}
                            padding="lg"
                            radius="md"
                            withBorder
                            style={{
                                borderColor: isSelected ? `var(--mantine-color-${config.color}-6)` : undefined,
                                borderWidth: isSelected ? 2 : 1,
                                position: 'relative',
                                transition: 'all 0.2s ease',
                            }}
                            className={isSelected ? '' : 'hover:shadow-md'}
                        >
                            {isRecommended && (
                                <Badge
                                    color={config.color}
                                    variant="filled"
                                    size="sm"
                                    style={{
                                        position: 'absolute',
                                        top: -10,
                                        right: 20,
                                    }}
                                    leftSection={<IconTrophy size={12} />}
                                >
                                    Mais Popular
                                </Badge>
                            )}

                            <Stack gap="md">
                                {/* Header */}
                                <Box ta="center">
                                    <ThemeIcon
                                        size="xl"
                                        radius="xl"
                                        variant="light"
                                        color={config.color}
                                        mx="auto"
                                        mb="sm"
                                    >
                                        <Icon size={24} />
                                    </ThemeIcon>
                                    <Text fw={700} size="lg">
                                        {pkg.name}
                                    </Text>
                                    <Badge color={config.color} variant="light" size="sm" mt="xs">
                                        {config.label}
                                    </Badge>
                                </Box>

                                {/* Price */}
                                <Box ta="center" my="md">
                                    <Text size="2rem" fw={700} c={config.color}>
                                        {formatPrice(pkg.price)}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        AOA
                                    </Text>
                                </Box>

                                {/* Description */}
                                {pkg.description && (
                                    <Text size="sm" c="dimmed" ta="center">
                                        {pkg.description}
                                    </Text>
                                )}

                                {/* Delivery Time */}
                                {pkg.delivery_time && (
                                    <Group gap="xs" justify="center">
                                        <IconClock size={16} color="gray" />
                                        <Text size="sm" c="dimmed">
                                            Entrega: {pkg.delivery_time}
                                        </Text>
                                    </Group>
                                )}

                                {/* Revisions */}
                                {pkg.revisions_included > 0 && (
                                    <Group gap="xs" justify="center">
                                        <IconRefresh size={16} color="gray" />
                                        <Text size="sm" c="dimmed">
                                            {pkg.revisions_included} {pkg.revisions_included === 1 ? 'revisão' : 'revisões'}
                                        </Text>
                                    </Group>
                                )}

                                {/* Features */}
                                {pkg.features && pkg.features.length > 0 && (
                                    <List
                                        spacing="xs"
                                        size="sm"
                                        center
                                        icon={
                                            <ThemeIcon color={config.color} size={20} radius="xl" variant="light">
                                                <IconCheck size={12} />
                                            </ThemeIcon>
                                        }
                                    >
                                        {pkg.features.map((feature, index) => (
                                            <List.Item key={index}>
                                                <Text size="sm">{feature}</Text>
                                            </List.Item>
                                        ))}
                                    </List>
                                )}

                                {/* Select Button */}
                                {onSelectPackage && (
                                    <Button
                                        fullWidth
                                        color={config.color}
                                        variant={isSelected ? 'filled' : 'light'}
                                        size="md"
                                        onClick={() => onSelectPackage(pkg.id)}
                                        leftSection={isSelected ? <IconCheck size={18} /> : undefined}
                                    >
                                        {isSelected ? 'Selecionado' : 'Selecionar'}
                                    </Button>
                                )}
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {/* Comparison Note */}
            <Text size="xs" c="dimmed" ta="center" mt="xl">
                Todos os pacotes incluem suporte do prestador. Escolha com base nas suas necessidades específicas.
            </Text>
        </Paper>
    );
}
