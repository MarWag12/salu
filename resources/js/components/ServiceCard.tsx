import { Link, usePage } from '@inertiajs/react';
import { Badge, Button } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import CategoryIcon from '@/components/Icon';
import { aoa } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { Service, SharedProps } from '@/types';

export default function ServiceCard({ service: s }: { service: Service }) {
    const user = usePage<SharedProps>().props.auth?.user;

    return (
        <div className="card flex flex-col gap-2.5 overflow-hidden p-0 transition hover:-translate-y-[3px] hover:shadow-lift">
            {s.image_url && <img src={s.image_url} alt={s.name} loading="lazy" className="h-40 w-full object-cover" />}
            <div className="flex flex-1 flex-col gap-2.5 p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="grid size-[52px] flex-none place-items-center rounded-[14px] bg-brand-soft text-brand">
                        <CategoryIcon name={s.category?.icon} size={26} />
                    </div>
                    {s.category && <Badge variant="light" color="blue" radius="xl">{s.category.name}</Badge>}
                </div>
                <h3 className="m-0 text-[1.15rem]">{s.name}</h3>
                <p className="m-0 flex-1 text-[.95rem] text-muted">{(s.description ?? '').slice(0, 90)}{(s.description ?? '').length > 90 ? '…' : ''}</p>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[.8rem] text-muted">A partir de</span>
                        <div className="text-[1.15rem] font-extrabold text-ink">{aoa(s.base_price)}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-muted"><IconClock size={16} /> {s.duration_label}</span>
                </div>
                <div className="flex gap-2">
                    <Button component={Link} href={routes.service(s.slug)} variant="default" size="xs" className="flex-1">Detalhes</Button>
                    {!user && <Button component={Link} href={routes.login} size="xs" className="flex-1">Pedir</Button>}
                    {user?.role === 'cliente' && (
                        <Button component={Link} href={routes.client.newOrder(s.id)} size="xs" className="flex-1">Pedir</Button>
                    )}
                </div>
            </div>
        </div>
    );
}
