import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

export interface TimerStatus {
    has_timer: boolean;
    is_active: boolean;
    status?: 'active' | 'paused' | 'stopped';
    session_token?: string;
    started_at?: string;
    paused_at?: string | null;
    resumed_at?: string | null;
    stopped_at?: string | null;
    elapsed_seconds?: number;
    formatted_time?: string;
    pause_count?: number;
    is_disputed?: boolean;
}

export interface TimerStopResult {
    success: boolean;
    stopped_at: string;
    elapsed_seconds: number;
    formatted_time: string;
    hours_worked: number;
    calculated_price: number;
    original_price: number;
    price_difference: number;
    needs_additional_payment: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatSeconds(total: number): string {
    const s = Math.max(0, Math.floor(total));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function extractMessage(err: unknown): string {
    const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
    return e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? 'Erro inesperado.';
}

/**
 * Gere o estado do cronómetro de um pedido por hora.
 * - Faz polling ao servidor (fonte de verdade) a cada 15 s.
 * - Entre pedidos, incrementa localmente a cada segundo enquanto o cronómetro está activo.
 */
export function useOrderTimer(orderId: number) {
    const [status, setStatus] = useState<TimerStatus>({ has_timer: false, is_active: false });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const baseRef = useRef<{ seconds: number; at: number }>({ seconds: 0, at: Date.now() });

    const applyStatus = useCallback((next: TimerStatus) => {
        setStatus(next);
        const seconds = next.elapsed_seconds ?? 0;
        baseRef.current = { seconds, at: Date.now() };
        setElapsedSeconds(seconds);
    }, []);

    const refresh = useCallback(async () => {
        try {
            const { data } = await axios.get<TimerStatus>(`/orders/${orderId}/timer/status`);
            applyStatus(data);
            setError(null);
        } catch (err) {
            setError(extractMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [orderId, applyStatus]);

    useEffect(() => {
        refresh();
        const poll = window.setInterval(refresh, 15000);
        return () => window.clearInterval(poll);
    }, [refresh]);

    // Relógio local: só avança com o cronómetro realmente activo.
    useEffect(() => {
        if (!(status.is_active && status.status === 'active')) return;
        const tick = window.setInterval(() => {
            const delta = Math.floor((Date.now() - baseRef.current.at) / 1000);
            setElapsedSeconds(baseRef.current.seconds + delta);
        }, 1000);
        return () => window.clearInterval(tick);
    }, [status.is_active, status.status]);

    const run = useCallback(
        async <T,>(request: () => Promise<T>): Promise<T> => {
            try {
                const result = await request();
                await refresh();
                return result;
            } catch (err) {
                throw new Error(extractMessage(err));
            }
        },
        [refresh],
    );

    const start = useCallback(
        () => run(async () => (await axios.post(`/orders/${orderId}/timer/start`)).data),
        [orderId, run],
    );
    const pause = useCallback(
        (reason?: string) =>
            run(async () => (await axios.post(`/orders/${orderId}/timer/pause`, { reason })).data),
        [orderId, run],
    );
    const resume = useCallback(
        () => run(async () => (await axios.post(`/orders/${orderId}/timer/resume`)).data),
        [orderId, run],
    );
    const stop = useCallback(
        (notes?: string) =>
            run(
                async () =>
                    (await axios.post<TimerStopResult>(`/orders/${orderId}/timer/stop`, { notes })).data,
            ),
        [orderId, run],
    );
    const dispute = useCallback(
        (reason: string, disputedSeconds: number) =>
            run(
                async () =>
                    (
                        await axios.post(`/orders/${orderId}/timer/dispute`, {
                            reason,
                            disputed_seconds: Math.max(0, Math.floor(disputedSeconds)),
                        })
                    ).data,
            ),
        [orderId, run],
    );

    const formattedTime = useMemo(() => formatSeconds(elapsedSeconds), [elapsedSeconds]);

    return { status, elapsedSeconds, formattedTime, isLoading, error, refresh, start, pause, resume, stop, dispute };
}
