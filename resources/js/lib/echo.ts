import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let instance: Echo<'reverb'> | null = null;

/** O tempo real só funciona se o servidor de broadcasting estiver configurado (VITE_REVERB_* no .env). */
export function realtimeConfigured(): boolean {
    return Boolean(import.meta.env.VITE_REVERB_APP_KEY);
}

export function getEcho(): Echo<'reverb'> | null {
    if (!realtimeConfigured()) return null;

    if (!instance) {
        window.Pusher = Pusher;
        const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';
        const port = Number(import.meta.env.VITE_REVERB_PORT ?? (scheme === 'https' ? 443 : 80));

        instance = new Echo<'reverb'>({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
            wsPort: port,
            wssPort: port,
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            // Autoriza canais privados via Axios (usa o cookie XSRF, que muda após o login).
            authorizer: (channel: { name: string }) => ({
                authorize: (socketId: string, callback: (error: Error | null, data?: unknown) => void) => {
                    axios
                        .post('/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
                        .then((response) => callback(null, response.data))
                        .catch((error) => callback(error));
                },
            }),
        } as never);
    }

    return instance;
}

export function disconnectEcho(): void {
    instance?.disconnect();
    instance = null;
}
