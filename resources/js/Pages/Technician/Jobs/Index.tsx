import { Head, router } from '@inertiajs/react';
import { Alert, Button, Select } from '@mantine/core';
import { IconBell, IconClipboardList, IconClock } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import Empty from '@/components/Empty';
import OrdersTable from '@/components/OrdersTable';
import PageHead from '@/components/PageHead';
import Pagination from '@/components/Pagination';
import PanelLayout from '@/layouts/PanelLayout';
import { fmtDate } from '@/lib/dayjs';
import { aoa } from '@/lib/format';
import { confirmAction } from '@/lib/swal';
import { routes } from '@/lib/routes';
import type { KycInfo, Option, Order, Paginated } from '@/types';

interface Props {
    kyc: KycInfo;
    available: Order[];
    mine: Paginated<Order>;
    statuses: Option[];
    filters: { estado?: string };
}

export default function Index({ kyc, available, mine, statuses, filters }: Props) {
    const accept = async (o: Order) => {
        const ok = await confirmAction({ title: `Aceitar o pedido ${o.code}?`, text: `${o.service?.name} em ${o.municipality}`, confirmText: 'Aceitar' });
        if (ok) router.post(`${routes.tech.jobs}/${o.id}/aceitar`);
    };

    return (
        <>
            <Head title="Os meus trabalhos" />
            <PageHead title="Os meus trabalhos" />

            {!kyc.approved && (
                <Alert color="yellow" icon={<IconClock size={18} />} mb="lg">Só poderá aceitar pedidos depois de a sua verificação (KYC) ser aprovada.</Alert>
            )}

            <div className="card mb-6">
                <div className="card-h">Pedidos disponíveis para si</div>
                {available.length === 0 ? (
                    <Empty icon={<IconBell size={32} />} title="Sem pedidos disponíveis">Mostramos aqui os pedidos por atribuir nas suas especialidades.</Empty>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="tbl">
                            <thead><tr><th>Código</th><th>Serviço</th><th>Local</th><th>Data</th><th>Valor</th><th /></tr></thead>
                            <tbody>
                                {available.map((o) => (
                                    <tr key={o.id}>
                                        <td><b>{o.code}</b></td><td>{o.service?.name}</td><td>{o.municipality}</td>
                                        <td>{fmtDate(o.scheduled_at)}</td><td>{aoa(o.price)}</td>
                                        <td className="text-right"><Button size="xs" onClick={() => accept(o)}>Aceitar</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-h">Atribuídos a mim</div>
                <div className="flex justify-end border-b border-line p-4">
                    <Select placeholder="Todos os estados" clearable data={statuses} value={filters.estado ?? null}
                        onChange={(v) => router.get(routes.tech.jobs, v ? { estado: v } : {}, { preserveState: true, replace: true })} />
                </div>
                {mine.data.length === 0 ? (
                    <Empty icon={<IconClipboardList size={32} />} title="Nenhum trabalho" />
                ) : (
                    <>
                        <OrdersTable orders={mine.data} party="client" href={(o) => routes.tech.job(o.id)} />
                        <Pagination links={mine.links} />
                    </>
                )}
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
