import { Head, Link, router } from '@inertiajs/react';
import { Button, Select } from '@mantine/core';
import { IconClipboardList, IconPlus } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import Empty from '@/components/Empty';
import OrdersTable from '@/components/OrdersTable';
import PageHead from '@/components/PageHead';
import Pagination from '@/components/Pagination';
import PanelLayout from '@/layouts/PanelLayout';
import { routes } from '@/lib/routes';
import type { Option, Order, Paginated } from '@/types';

interface Props {
    requests: Paginated<Order>;
    statuses: Option[];
    filters: { estado?: string };
}

export default function Index({ requests, statuses, filters }: Props) {
    return (
        <>
            <Head title="Os meus pedidos" />
            <PageHead title="Os meus pedidos">
                <Button component={Link} href={routes.client.newOrder()} leftSection={<IconPlus size={18} />}>Novo pedido</Button>
            </PageHead>

            <div className="card">
                <div className="flex justify-end border-b border-line p-4">
                    <Select
                        placeholder="Todos os estados" clearable data={statuses} value={filters.estado ?? null}
                        onChange={(v) => router.get(routes.client.orders, v ? { estado: v } : {}, { preserveState: true, replace: true })}
                    />
                </div>
                {requests.data.length === 0 ? (
                    <Empty icon={<IconClipboardList size={32} />} title="Nenhum pedido encontrado" />
                ) : (
                    <>
                        <OrdersTable orders={requests.data} party="technician" href={(o) => routes.client.order(o.id)} />
                        <Pagination links={requests.links} />
                    </>
                )}
            </div>
        </>
    );
}

Index.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
