import { useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface ReviewNotification {
    id: number;
    type: string;
    review_type: string;
    service_id: number;
    service_name: string;
    rating: number;
    reviewer_name: string;
    has_comment: boolean;
    message: string;
    created_at: string;
}

interface NotificationCallback {
    onReviewReceived?: (data: ReviewNotification) => void;
    onOrderStatusChanged?: (data: any) => void;
    onNewMessage?: (data: any) => void;
}

export function useRealtimeNotifications(
    userId: number,
    callbacks?: NotificationCallback
) {
    const handleReviewReceived = useCallback((data: ReviewNotification) => {
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification('Nova Avaliacao Recebida', {
                body: data.message,
                icon: '/favicon.ico',
            });
        }

        // Call custom callback if provided
        callbacks?.onReviewReceived?.(data);
    }, [callbacks]);

    const handleOrderStatusChanged = useCallback((data: any) => {
        if (Notification.permission === 'granted') {
            new Notification('Actualizacao de Pedido', {
                body: data.message,
                icon: '/favicon.ico',
            });
        }

        callbacks?.onOrderStatusChanged?.(data);
    }, [callbacks]);

    useEffect(() => {
        if (!window.Echo || !userId) {
            return;
        }

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const channel = window.Echo.private(`user.${userId}`);

        channel
            .listen('.review.received', (event: ReviewNotification) => {
                handleReviewReceived(event);
            })
            .listen('.order.status.changed', (event: any) => {
                handleOrderStatusChanged(event);
            });

        return () => {
            window.Echo.leave(`user.${userId}`);
        };
    }, [userId, handleReviewReceived, handleOrderStatusChanged]);

    return {
        // Can add more methods here if needed
    };
}

export default useRealtimeNotifications;
