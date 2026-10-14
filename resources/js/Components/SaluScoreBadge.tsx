import { Badge, Tooltip, Group, Text, Progress, Stack } from '@mantine/core';
import { IconTrophy, IconStar, IconAward, IconMedal } from '@tabler/icons-react';

export interface SaluScoreBadgeProps {
    score: number;
    badge: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    showLabel?: boolean;
    showProgress?: boolean;
    breakdown?: {
        completion_rate: number;
        rating_score: number;
        cancellation_score: number;
        complaint_score: number;
        punctuality_score: number;
        response_quality: number;
    };
}

const badgeConfig = {
    bronze: {
        color: 'orange',
        label: 'Bronze',
        icon: IconMedal,
        nextLevel: 'Prata',
        nextThreshold: 60,
    },
    silver: {
        color: 'gray',
        label: 'Prata',
        icon: IconAward,
        nextLevel: 'Ouro',
        nextThreshold: 75,
    },
    gold: {
        color: 'yellow',
        label: 'Ouro',
        icon: IconTrophy,
        nextLevel: 'Platina',
        nextThreshold: 90,
    },
    platinum: {
        color: 'purple',
        label: 'Platina',
        icon: IconStar,
        nextLevel: null,
        nextThreshold: null,
    },
};

export default function SaluScoreBadge({
    score,
    badge,
    size = 'md',
    showLabel = false,
    showProgress = false,
    breakdown,
}: SaluScoreBadgeProps) {
    const badgeLevel = badge || 'bronze';
    const config = badgeConfig[badgeLevel];
    const Icon = config.icon;

    const iconSize = {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
    }[size];

    const renderTooltipContent = () => (
        <Stack gap="xs" style={{ minWidth: 250 }}>
            <Group justify="space-between">
                <Text size="sm" fw={700}>
                    Salu Score: {score}/100
                </Text>
                <Badge size="sm" color={config.color} variant="filled">
                    {config.label}
                </Badge>
            </Group>

            {config.nextThreshold && (
                <>
                    <Text size="xs" c="dimmed">
                        Progresso para {config.nextLevel}:
                    </Text>
                    <Progress
                        value={(score / config.nextThreshold) * 100}
                        size="sm"
                        color={config.color}
                    />
                    <Text size="xs" c="dimmed">
                        Faltam {config.nextThreshold - score} pontos
                    </Text>
                </>
            )}

            {breakdown && (
                <>
                    <Text size="xs" fw={600} mt="xs">
                        Breakdown:
                    </Text>
                    <Stack gap={4}>
                        <Group justify="space-between">
                            <Text size="xs">Taxa de Conclusão:</Text>
                            <Text size="xs" fw={500}>
                                {breakdown.completion_rate.toFixed(1)}%
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs">Rating Médio:</Text>
                            <Text size="xs" fw={500}>
                                {breakdown.rating_score.toFixed(1)}%
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs">Pontualidade:</Text>
                            <Text size="xs" fw={500}>
                                {breakdown.punctuality_score.toFixed(1)}%
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs">Cancelamentos:</Text>
                            <Text size="xs" fw={500}>
                                {breakdown.cancellation_score.toFixed(1)}%
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs">Reclamações:</Text>
                            <Text size="xs" fw={500}>
                                {breakdown.complaint_score.toFixed(1)}%
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs">Qualidade de Resposta:</Text>
                            <Text size="xs" fw={500}>
                                {breakdown.response_quality.toFixed(1)}%
                            </Text>
                        </Group>
                    </Stack>
                </>
            )}

            <Text size="xs" c="dimmed" mt="xs">
                Score calculado com base em performance real
            </Text>
        </Stack>
    );

    const badgeContent = (
        <Group gap={4}>
            <Icon size={iconSize} />
            <Text size={size}>{score}</Text>
            {showLabel && <Text size={size}>{config.label}</Text>}
        </Group>
    );

    const badgeElement = (
        <Badge
            size={size}
            color={config.color}
            variant="filled"
            leftSection={showProgress ? undefined : <Icon size={iconSize} />}
        >
            {showProgress ? (
                badgeContent
            ) : (
                <>
                    {score}
                    {showLabel && ` ${config.label}`}
                </>
            )}
        </Badge>
    );

    return (
        <Tooltip
            label={renderTooltipContent()}
            position="bottom"
            withArrow
            multiline
            w={280}
        >
            {badgeElement}
        </Tooltip>
    );
}
