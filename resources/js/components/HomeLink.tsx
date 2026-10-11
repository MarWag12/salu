import { Link } from '@inertiajs/react';
import { Button } from '@mantine/core';
import { IconLayoutDashboard } from '@tabler/icons-react';
import type { AuthUser } from '@/types';

/** Botão "A minha área". O painel do administrador é o Filament (/admin) — não é uma página Inertia. */
export default function HomeLink({ user, size = 'sm' }: { user: AuthUser; size?: 'xs' | 'sm' | 'md' }) {
    const icon = <IconLayoutDashboard size={16} />;

    return user.role === 'admin' ? (
        <Button component="a" href={user.home} size={size} leftSection={icon}>Painel de administração</Button>
    ) : (
        <Button component={Link} href={user.home} size={size} leftSection={icon}>A minha área</Button>
    );
}
