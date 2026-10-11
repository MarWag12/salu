import { router, usePage } from '@inertiajs/react';
import { notifications } from '@mantine/notifications';
import { IconBell } from '@tabler/icons-react';
import { useEffect } from 'react';
import { getEcho } from '@/lib/echo';
import type { SharedProps } from '@/types';

interface OrderEvent {
    id: number;
    code: string;
    status: string;
    status_label: string;
    category_id: number | null;
    title: string;
    message: string;
}

/**
 * Laravel Echo + Reverb: recebe eventos dos pedidos em tempo real, mostra uma notificação
 * e recarrega os dados da página (Inertia). Não faz nada se o broadcasting não estiver configurado.
 */
export default function RealtimeListener() {
    const { auth, realtime } = usePage<SharedProps>().props;
    const user = auth?.user;

    useEffect(() => {
        if (!realtime || !user) return;
        const echo = getEcho();
        if (!echo) return;

        const onEvent = (e: OrderEvent) => {
            notifications.show({
                title: e.title,
                message: e.message,
                color: 'brand',
                icon: <IconBell size={18} />,
                autoClose: 8000,
            });
            router.reload();
        };

        echo.private(`users.${user.id}`).listen('.order.updated', onEvent);

        if (user.role === 'tecnico') {
            // Só interessam os novos pedidos das minhas especialidades.
            echo.private('technicians').listen('.order.updated', (e: OrderEvent) => {
                if (e.category_id && user.category_ids.includes(e.category_id)) onEvent(e);
            });
        }

        return () => {
            echo.leave(`users.${user.id}`);
            if (user.role === 'tecnico') echo.leave('technicians');
        };
    }, [realtime, user?.id, user?.role]);

    return null;
}
