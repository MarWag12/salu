import { Badge, Tooltip } from '@mantine/core';
import { IconBolt } from '@tabler/icons-react';

interface UrgentBadgeProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'filled' | 'light' | 'outline';
    showIcon?: boolean;
    tooltip?: string;
}

export default function UrgentBadge({
    size = 'sm',
    variant = 'filled',
    showIcon = true,
    tooltip = 'Serviço Urgente - Prioridade Alta',
}: UrgentBadgeProps) {
    const badge = (
        <Badge
            size={size}
            color="orange"
            variant={variant}
            leftSection={showIcon ? <IconBolt size={12} /> : undefined}
            className="animate-pulse"
            style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
        >
            URGENTE
        </Badge>
    );

    if (tooltip) {
        return (
            <Tooltip label={tooltip} position="top">
                {badge}
            </Tooltip>
        );
    }

    return badge;
}
