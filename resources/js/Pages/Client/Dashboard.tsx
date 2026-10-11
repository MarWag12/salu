import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@mantine/core';
import { IconCircleCheck, IconClipboardList, IconClock, IconCreditCard, IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import Empty from '@/components/Empty';
import OrdersTable from '@/components/OrdersTable';
import PageHead from '@/components/PageHead';
import StatCard from '@/components/StatCard';
import PanelLayout from '@/layouts/PanelLayout';
import { firstName } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { Order, SharedProps } from '@/types';

interface Props {
    stats: { total: number; open: number; done: number; to_pay: number };
    recent: Order[];
}

export default function Dashboard({ stats, recent }: Props) {
    const user = usePage<SharedProps>().props.auth.user!;

    return (
        <>
            <Head title="Dashboard" />
            <PageHead title={`Olá, ${firstName(user.name)}`}>
                <Button component={Link} href={routes.client.newOrder()} leftSection={<IconPlus size={18} />}>Novo pedido</Button>
            </PageHead>

            <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total de pedidos" value={stats.total} note="Desde o registo" tone="blue" icon={<IconClipboardList size={20} />} />
                <StatCard label="Em aberto" value={stats.open} note="Pendentes, atribuídos ou em curso" tone="orange" icon={<IconClock size={20} />} />
                <StatCard label="Concluídos" value={stats.done} note="Serviços realizados" tone="green" icon={<IconCircleCheck size={20} />} />
                <StatCard label="Por pagar" value={stats.to_pay} note="Concluídos sem pagamento confirmado" tone="red" icon={<IconCreditCard size={20} />} />
            </div>

            <div className="card">
                <div className="card-h">
                    Pedidos recentes
                    <Button component={Link} href={routes.client.orders} variant="default" size="xs">Ver todos</Button>
                </div>
                {recent.length === 0 ? (
                    <Empty icon={<IconClipboardList size={32} />} title="Ainda não fez nenhum pedido">
                        <p>Escolha um serviço e receba um técnico em sua casa.</p>
                        <Button component={Link} href={routes.services}>Explorar serviços</Button>
                    </Empty>
                ) : (
                    <OrdersTable orders={recent} party="technician" href={(o) => routes.client.order(o.id)} />
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
