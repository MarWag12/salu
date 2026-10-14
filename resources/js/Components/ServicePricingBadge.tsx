import { Badge, Group, type MantineSize } from '@mantine/core';
import { IconTag, IconClock, IconAdjustments } from '@tabler/icons-react';

interface ServicePricingBadgeProps {
    priceType: 'fixed' | 'hourly' | 'variable';
    priceMin: number;
    priceMax?: number;
    size?: MantineSize;
    variant?: 'filled' | 'light' | 'outline';
    showIcon?: boolean;
}

export default function ServicePricingBadge({
    priceType,
    priceMin,
    priceMax,
    size = 'md',
    variant = 'light',
    showIcon = true,
}: ServicePricingBadgeProps) {
    const formatPrice = (value: number): string => {
        return new Intl.NumberFormat('pt-AO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const getBadgeProps = () => {
        const formattedMin = formatPrice(priceMin);

        switch (priceType) {
            case 'fixed':
                return {
                    text: `${formattedMin} Kz fixo`,
                    color: 'blue',
                    icon: showIcon ? <IconTag size={14} /> : null,
                    label: 'Preço Fixo',
                };
            case 'hourly':
                return {
                    text: `${formattedMin} Kz/hora`,
                    color: 'orange',
                    icon: showIcon ? <IconClock size={14} /> : null,
                    label: 'Por Hora',
                };
            case 'variable':
                const formattedMax = priceMax ? formatPrice(priceMax) : null;
                return {
                    text: formattedMax ? `${formattedMin}-${formattedMax} Kz` : `${formattedMin}+ Kz`,
                    color: 'green',
                    icon: showIcon ? <IconAdjustments size={14} /> : null,
                    label: 'Preço Variável',
                };
            default:
                return {
                    text: `${formattedMin} Kz`,
                    color: 'gray',
                    icon: null,
                    label: 'Preço',
                };
        }
    };

    const { text, color, icon } = getBadgeProps();

    if (showIcon && icon) {
        return (
            <Badge
                size={size}
                variant={variant}
                color={color}
                leftSection={icon}
                style={{ cursor: 'default' }}
            >
                {text}
            </Badge>
        );
    }

    return (
        <Badge
            size={size}
            variant={variant}
            color={color}
            style={{ cursor: 'default' }}
        >
            {text}
        </Badge>
    );
}
