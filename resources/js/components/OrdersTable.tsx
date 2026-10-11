import { Link } from '@inertiajs/react';
import { Button } from '@mantine/core';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/dayjs';
import { aoa } from '@/lib/format';
import type { Order } from '@/types';

/** Tabela de pedidos reutilizada no painel do cliente (colunas: técnico) e do técnico (colunas: cliente). */
export default function OrdersTable({ orders, party, href }: {
    orders: Order[];
    party: 'technician' | 'client';
    href: (o: Order) => string;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="tbl">
                <thead>
                    <tr>
                        <th>Código</th><th>Serviço</th><th>{party === 'technician' ? 'Técnico' : 'Cliente'}</th>
                        <th>Data</th><th>Valor</th><th>Estado</th><th />
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o) => (
                        <tr key={o.id}>
                            <td><b>{o.code}</b></td>
                            <td>{o.service?.name}</td>
                            <td>{(party === 'technician' ? o.technician?.name : o.client?.name) ?? '—'}</td>
                            <td>{fmtDate(o.scheduled_at)}</td>
                            <td>{aoa(o.price)}</td>
                            <td><StatusBadge status={o.status} label={o.status_label} /></td>
                            <td className="text-right"><Button component={Link} href={href(o)} variant="default" size="xs">Abrir</Button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
