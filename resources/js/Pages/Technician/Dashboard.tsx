import { Head, Link, usePage } from '@inertiajs/react';
import { Alert, Button } from '@mantine/core';
import { IconAlertCircle, IconBell, IconCash, IconCircleCheck, IconClipboardList, IconClock, IconStarFilled, IconTool } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import Empty from '@/components/Empty';
import OrdersTable from '@/components/OrdersTable';
import PageHead from '@/components/PageHead';
import StatCard from '@/components/StatCard';
import PanelLayout from '@/layouts/PanelLayout';
import { aoa, firstName } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { KycInfo, Order, SharedProps } from '@/types';

interface Props {
    kyc: KycInfo;
    stats: { available: number; assigned: number; in_progress: number; done: number; earnings: number; rating_avg: number; reviews_count: number };
    upcoming: Order[];
}

export function KycAlert({ kyc }: { kyc: KycInfo }) {
    if (kyc.status === 'pendente') {
        return (
            <Alert color="yellow" icon={<IconClock size={18} />} mb="lg">
                A sua conta aguarda verificação (KYC). <Link href={routes.tech.profile}>Submeta o seu documento de identificação</Link> para começar a receber pedidos.
            </Alert>
        );
    }
    if (kyc.status === 'rejeitado') {
        return (
            <Alert color="red" icon={<IconAlertCircle size={18} />} mb="lg">
                A verificação foi rejeitada{kyc.notes ? `: ${kyc.notes}` : '.'} <Link href={routes.tech.profile}>Submeta um novo documento</Link>.
            </Alert>
        );
    }
    return null;
}

export default function Dashboard({ kyc, stats, upcoming }: Props) {
    const user = usePage<SharedProps>().props.auth.user!;

    return (
        <>
            <Head title="Dashboard" />
            <PageHead title={`Olá, ${firstName(user.name)}`} />
            <KycAlert kyc={kyc} />

            <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Pedidos disponíveis" value={stats.available} note="Na sua área de especialidade" tone="blue" icon={<IconBell size={20} />} />
                <StatCard label="Atribuídos" value={stats.assigned} note="Por iniciar" tone="orange" icon={<IconClock size={20} />} />
                <StatCard label="Em curso" value={stats.in_progress} note="A decorrer" tone="blue" icon={<IconTool size={20} />} />
                <StatCard label="Concluídos" value={stats.done} note="Trabalhos realizados" tone="green" icon={<IconCircleCheck size={20} />} />
                <StatCard label="Recebido" value={aoa(stats.earnings)} note="Pagamentos confirmados" tone="green" icon={<IconCash size={20} />} />
                <StatCard label="Avaliação" value={stats.rating_avg.toFixed(1).replace('.', ',')} note={`${stats.reviews_count} avaliações`} tone="orange" icon={<IconStarFilled size={20} />} />
            </div>

            <div className="card">
                <div className="card-h">
                    Próximos trabalhos
                    <Button component={Link} href={routes.tech.jobs} variant="default" size="xs">Ver todos</Button>
                </div>
                {upcoming.length === 0 ? (
                    <Empty icon={<IconClipboardList size={32} />} title="Sem trabalhos agendados" />
                ) : (
                    <OrdersTable orders={upcoming} party="client" href={(o) => routes.tech.job(o.id)} />
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
