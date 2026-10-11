import { Badge } from '@mantine/core';

const COLORS: Record<string, string> = {
    pendente: 'yellow',
    atribuido: 'blue',
    em_curso: 'indigo',
    concluido: 'green',
    cancelado: 'red',
    aprovado: 'green',
    rejeitado: 'red',
    confirmado: 'green',
    aberta: 'red',
    resolvida: 'green',
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
    return (
        <Badge color={COLORS[status] ?? 'gray'} variant="light" radius="xl">
            {label ?? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </Badge>
    );
}
