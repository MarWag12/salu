import { useState, useEffect } from 'react';
import { Button, Paper, Text, Group, CloseButton } from '@mantine/core';
import { IconDownload, IconX } from '@tabler/icons-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Check if user already dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const now = new Date();
            const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

            // Show again after 7 days
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show after 30 seconds or on second visit
            const visitCount = parseInt(localStorage.getItem('visit-count') || '0') + 1;
            localStorage.setItem('visit-count', visitCount.toString());

            if (visitCount >= 2) {
                setTimeout(() => {
                    setShowPrompt(true);
                }, 30000); // Show after 30 seconds
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('[PWA] User accepted the install prompt');
        } else {
            console.log('[PWA] User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
        setShowPrompt(false);
    };

    if (!showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <Paper
            shadow="lg"
            p="md"
            style={{
                position: 'fixed',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                maxWidth: '90%',
                width: 400,
                animation: 'slideUp 0.3s ease-out',
            }}
        >
            <style>
                {`
                    @keyframes slideUp {
                        from {
                            transform: translateX(-50%) translateY(100px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(-50%) translateY(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>

            <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">
                    Instalar Salu
                </Text>
                <CloseButton
                    onClick={handleDismiss}
                    size="sm"
                    icon={<IconX size={14} />}
                />
            </Group>

            <Text size="sm" c="dimmed" mb="md">
                Adicione o Salu à tela inicial para acesso rápido e funcionalidade offline!
            </Text>

            <Group>
                <Button
                    onClick={handleInstall}
                    leftSection={<IconDownload size={16} />}
                    fullWidth
                    color="green"
                >
                    Instalar
                </Button>
            </Group>
        </Paper>
    );
}
