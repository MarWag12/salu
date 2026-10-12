import '@fontsource-variable/plus-jakarta-sans';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '../css/app.css';
import './bootstrap';
import './lib/dayjs';

import { createInertiaApp } from '@inertiajs/react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { theme } from './theme';

createInertiaApp({
    title: (title) => (title ? `${title} — Salu` : 'Salu'),
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <MantineProvider theme={theme} defaultColorScheme="light">
                <DatesProvider settings={{ locale: 'pt' }}>
                    <Notifications position="top-right" />
                    <App {...props} />
                </DatesProvider>
            </MantineProvider>,
        );
    },
    progress: { color: '#1e88e5' },
});
