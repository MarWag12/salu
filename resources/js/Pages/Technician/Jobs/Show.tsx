import { Head, Link, useForm } from '@inertiajs/react';
import { Badge, Button, NumberInput } from '@mantine/core';
import { IconCheck, IconPlayerPlay } from '@tabler/icons-react';
import type { FormEvent, ReactNode } from 'react';
import PageHead from '@/components/PageHead';
import Stars from '@/components/Stars';
import StatusBadge from '@/components/StatusBadge';
import UserCell from '@/components/UserCell';
import PanelLayout from '@/layouts/PanelLayout';
import { fmtDate } from '@/lib/dayjs';
import { aoa } from '@/lib/format';
import { confirmAction } from '@/lib/swal';
import { routes } from '@/lib/routes';
import type { Order } from '@/types';

export default function Show({ order }: { order: Order }) {
    const base = routes.tech.job(order.id);
    const start = useForm({});
    const complete = useForm({ price: order.price as number | string });
    const payments = order.payments ?? [];

    const doStart = async (e: FormEvent) => {
        e.preventDefault();
        if (await confirmAction({ title: 'Iniciar este trabalho?', confirmText: 'Iniciar' })) start.post(`${base}/iniciar`, { preserveScroll: true });
    };
    const doComplete = async (e: FormEvent) => {
        e.preventDefault();
        const ok = await confirmAction({ title: 'Marcar como concluído?', text: `Valor final: ${aoa(Number(complete.data.price) || 0)}`, confirmText: 'Concluir' });
        if (ok) complete.post(`${base}/concluir`, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Trabalho ${order.code}`} />
            <PageHead title={<>Trabalho {order.code} <span className="align-middle"><StatusBadge status={order.status} label={order.status_label} /></span></>}>
                <Button component={Link} href={routes.tech.jobs} variant="default">Voltar</Button>
            </PageHead>

            <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <div className="card">
                        <div className="card-h">Detalhes do serviço</div>
                        <div className="card-b">
                            <dl className="kv">
                                <dt>Serviço</dt><dd>{order.service?.name} <Badge variant="light" radius="xl">{order.service?.category}</Badge></dd>
                                <dt>Data agendada</dt><dd>{fmtDate(order.scheduled_at, 'DD/MM/YYYY [às] HH:mm')}</dd>
                                <dt>Morada</dt><dd>{order.address} — {order.municipality}</dd>
                                <dt>Descrição</dt><dd>{order.description || '—'}</dd>
                                <dt>Valor</dt><dd className="font-extrabold">{aoa(order.price)}</dd>
                            </dl>
                        </div>
                    </div>
                    {order.review && (
                        <div className="card">
                            <div className="card-h">Avaliação do cliente</div>
                            <div className="card-b"><Stars rating={order.review.rating} /><p className="mb-0 mt-2">{order.review.comment || 'Sem comentário.'}</p></div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {order.client && (
                        <div className="card">
                            <div className="card-h">Cliente</div>
                            <div className="card-b"><UserCell initials={order.client.initials} name={order.client.name} sub={order.client.phone || 'Sem telefone'} /></div>
                        </div>
                    )}

                    {order.status === 'atribuido' && (
                        <div className="card"><div className="card-h">Acção</div><div className="card-b">
                            <form onSubmit={doStart}>
                                <Button type="submit" fullWidth size="lg" loading={start.processing} leftSection={<IconPlayerPlay size={18} />}>Iniciar trabalho</Button>
                            </form>
                        </div></div>
                    )}

                    {order.status === 'em_curso' && (
                        <div className="card"><div className="card-h">Concluir trabalho</div><div className="card-b">
                            <form onSubmit={doComplete} className="space-y-3">
                                <NumberInput label="Valor final (AOA)" min={0} decimalScale={2} fixedDecimalScale thousandSeparator=" " decimalSeparator=","
                                    hideControls value={complete.data.price} onChange={(v) => complete.setData('price', v)} error={complete.errors.price}
                                    description="Ajuste apenas se o valor combinado no local for diferente." />
                                <Button type="submit" color="green" fullWidth size="lg" loading={complete.processing} leftSection={<IconCheck size={18} />}>Marcar como concluído</Button>
                            </form>
                        </div></div>
                    )}

                    {order.status === 'concluido' && (
                        <div className="card"><div className="card-h">Pagamento</div><div className="card-b">
                            {payments.length === 0
                                ? <span className="text-muted">O cliente ainda não registou o pagamento.</span>
                                : payments.map((p) => <StatusBadge key={p.id} status={p.status} label={p.status === 'confirmado' ? 'Confirmado' : 'A aguardar confirmação'} />)}
                        </div></div>
                    )}
                </div>
            </div>
        </>
    );
}

Show.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
