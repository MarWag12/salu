import { usePage } from '@inertiajs/react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { useEffect } from 'react';
import type { SharedProps } from '@/types';

/** Mostra as mensagens flash do Laravel (success / error) como notificações Mantine. */
export default function Flash() {
    const { flash } = usePage<SharedProps>().props;

    useEffect(() => {
        if (flash?.success) {
            notifications.show({ color: 'green', icon: <IconCircleCheck size={18} />, message: flash.success, autoClose: 5000 });
        }
        if (flash?.error) {
            notifications.show({ color: 'red', icon: <IconAlertCircle size={18} />, message: flash.error, autoClose: 7000 });
        }
    }, [flash]);

    return null;
}
