import { Link, router, usePage } from '@inertiajs/react';
import { Avatar, Burger } from '@mantine/core';
import {
    IconClipboardList, IconHome, IconId, IconLogout, IconPlus, IconWorld, type TablerIcon,
} from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import Flash from '@/components/Flash';
import RealtimeListener from '@/components/RealtimeListener';
import { routes } from '@/lib/routes';
import type { Role, SharedProps } from '@/types';

type Item = { label: string; icon: TablerIcon; href: string; match: (url: string) => boolean };
type Group = { title?: string; items: Item[] };

const NAV: Record<Exclude<Role, 'admin'>, Group[]> = {
    cliente: [
        { items: [{ label: 'Dashboard', icon: IconHome, href: routes.client.dashboard, match: (u) => u === '/cliente' }] },
        {
            title: 'Pedidos',
            items: [
                { label: 'Novo pedido', icon: IconPlus, href: routes.client.newOrder(), match: (u) => u.startsWith('/cliente/pedidos/novo') },
                {
                    label: 'Os meus pedidos', icon: IconClipboardList, href: routes.client.orders,
                    match: (u) => u.startsWith('/cliente/pedidos') && !u.startsWith('/cliente/pedidos/novo'),
                },
            ],
        },
    ],
    tecnico: [
        { items: [{ label: 'Dashboard', icon: IconHome, href: routes.tech.dashboard, match: (u) => u === '/tecnico' }] },
        { title: 'Trabalho', items: [{ label: 'Os meus trabalhos', icon: IconClipboardList, href: routes.tech.jobs, match: (u) => u.startsWith('/tecnico/trabalhos') }] },
        { title: 'Conta', items: [{ label: 'Perfil e KYC', icon: IconId, href: routes.tech.profile, match: (u) => u.startsWith('/tecnico/perfil') }] },
    ],
};

/** Layout das áreas de cliente e técnico (a administração vive no Filament). */
export default function PanelLayout({ children }: { children: ReactNode }) {
    const { url, props } = usePage<SharedProps>();
    const user = props.auth?.user;
    const [open, setOpen] = useState(false);
    const groups = user && user.role !== 'admin' ? NAV[user.role] : [];
    const path = url.split('?')[0];

    return (
        <div className="min-h-screen">
            <Flash />
            <RealtimeListener />

            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:px-7">
                <div className="flex items-center gap-2">
                    <Burger opened={open} onClick={() => setOpen((o) => !o)} className="lg:hidden" aria-label="Menu" />
                    <Link href={user?.home ?? '/'} aria-label="Salu" className="flex items-center no-underline">
                        <img src="/images/salu-logo.png" alt="Salu" className="h-[46px] w-auto" />
                    </Link>
                </div>
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right leading-tight sm:block">
                            <b className="text-ink">{user.name}</b><br /><small className="text-muted">{user.role_label}</small>
                        </div>
                        <Avatar color="brand" radius="xl">{user.initials}</Avatar>
                    </div>
                )}
            </header>

            <div className="lg:grid lg:grid-cols-[300px_1fr]">
                <aside
                    className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed left-0 top-16 z-[60] h-[calc(100vh-64px)] w-[290px] overflow-y-auto border-r border-line bg-[#fafafa] p-5 pb-10 shadow-xl transition lg:sticky lg:translate-x-0 lg:shadow-none`}
                >
                    {groups.map((g, i) => (
                        <div key={i} className="mb-5">
                            {g.title && <div className="px-3 py-2 font-semibold text-muted">{g.title}</div>}
                            {g.items.map((it) => (
                                <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className={`nav-item ${it.match(path) ? 'active' : ''}`}>
                                    <it.icon size={24} stroke={1.7} /><span>{it.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                    <div className="mb-5">
                        <Link href={routes.home} className="nav-item"><IconWorld size={24} stroke={1.7} /><span>Ver site</span></Link>
                        <button type="button" className="nav-item" onClick={() => router.post(routes.logout)}>
                            <IconLogout size={24} stroke={1.7} /><span>Terminar sessão</span>
                        </button>
                    </div>
                </aside>

                {open && <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

                <main className="min-w-0 px-4 pb-14 pt-6 lg:px-9 lg:pt-9">{children}</main>
            </div>
        </div>
    );
}
