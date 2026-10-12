import { Head, Link, router, useForm } from '@inertiajs/react';
import { Badge, Button, Rating, Select, Text, Textarea, TextInput } from '@mantine/core';
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
import type { Option, Order } from '@/types';

interface Props {
    order: Order;
    abilities: { cancel: boolean; pay: boolean; review: boolean; dispute: boolean };
    methods: Option[];
}

function PayCard({ order, methods }: { order: Order; methods: Option[] }) {
    const form = useForm({ method: methods[0]?.value ?? 'numerario', reference: '' });
    const submit = (e: FormEvent) => { e.preventDefault(); form.post(`${routes.client.order(order.id)}/pagar`, { preserveScroll: true }); };

    return (
        <form onSubmit={submit} className="space-y-3">
            <p className="text-muted">Registe o pagamento de <b>{aoa(order.price)}</b>. A Salu irá confirmá-lo.</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Método" allowDeselect={false} data={methods} value={form.data.method} onChange={(v) => form.setData('method', v ?? '')} error={form.errors.method} />
                <TextInput label="Referência / n.º de transferência" placeholder="Opcional para numerário" value={form.data.reference}
                    onChange={(e) => form.setData('reference', e.currentTarget.value)} error={form.errors.reference} />
            </div>
            <Button type="submit" loading={form.processing}>Registar pagamento</Button>
        </form>
    );
}

function ReviewCard({ order }: { order: Order }) {
    const form = useForm({ rating: 0, comment: '' });
    const submit = (e: FormEvent) => { e.preventDefault(); form.post(`${routes.client.order(order.id)}/avaliar`, { preserveScroll: true }); };

    return (
        <form onSubmit={submit} className="space-y-3">
            <Rating size="xl" value={form.data.rating} onChange={(v) => form.setData('rating', v)} />
            {form.errors.rating && <Text c="red" size="sm">{form.errors.rating}</Text>}
            <Textarea placeholder="Como correu o serviço? (opcional)" minRows={3} autosize value={form.data.comment}
                onChange={(e) => form.setData('comment', e.currentTarget.value)} error={form.errors.comment} />
            <Button type="submit" loading={form.processing} disabled={form.data.rating < 1}>Enviar avaliação</Button>
        </form>
    );
}

function DisputeForm({ order }: { order: Order }) {
    const form = useForm({ reason: '' });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(`${routes.client.order(order.id)}/disputa`, { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            <Textarea placeholder="Descreva o problema (mín. 10 caracteres)" minRows={3} autosize value={form.data.reason}
                onChange={(e) => form.setData('reason', e.currentTarget.value)} error={form.errors.reason} />
            <Button type="submit" variant="default" fullWidth loading={form.processing}>Abrir disputa</Button>
        </form>
    );
}

function CancelForm({ order }: { order: Order }) {
    const form = useForm({ cancel_reason: '' });

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const ok = await confirmAction({ title: 'Cancelar este pedido?', text: 'Esta acção não pode ser anulada.', confirmText: 'Sim, cancelar', cancelText: 'Manter pedido', danger: true });
        if (ok) form.post(`${routes.client.order(order.id)}/cancelar`, { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            <TextInput placeholder="Motivo (opcional)" value={form.data.cancel_reason} onChange={(e) => form.setData('cancel_reason', e.currentTarget.value)} error={form.errors.cancel_reason} />
            <Button type="submit" color="red" variant="outline" fullWidth loading={form.processing}>Cancelar pedido</Button>
        </form>
    );
}

export default function Show({ order, abilities, methods }: Props) {
    const t = order.technician;
    const disputes = order.disputes ?? [];
    const payments = order.payments ?? [];

    return (
        <>
            <Head title={`Pedido ${order.code}`} />
            <PageHead title={<>Pedido {order.code} <span className="align-middle"><StatusBadge status={order.status} label={order.status_label} /></span></>}>
                <Button component={Link} href={routes.client.orders} variant="default">Voltar</Button>
            </PageHead>

            <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <div className="card">
                        <div className="card-h">Detalhes</div>
                        <div className="card-b">
                            <dl className="kv">
                                <dt>Serviço</dt><dd>{order.service?.name} <Badge variant="light" radius="xl">{order.service?.category}</Badge></dd>
                                <dt>Data agendada</dt><dd>{fmtDate(order.scheduled_at, 'DD/MM/YYYY [às] HH:mm')}</dd>
                                <dt>Morada</dt><dd>{order.address} — {order.municipality}</dd>
                                <dt>Descrição</dt><dd>{order.description || '—'}</dd>
                                <dt>Valor</dt><dd className="font-extrabold">{aoa(order.price)}</dd>
                                {order.cancel_reason && (<><dt>Motivo do cancelamento</dt><dd>{order.cancel_reason}</dd></>)}
                            </dl>
                        </div>
                    </div>

                    {order.status === 'concluido' && (
                        <>
                            <div className="card">
                                <div className="card-h">Pagamento</div>
                                <div className="card-b">
                                    {payments.map((p) => (
                                        <p key={p.id}>
                                            <b>{p.method_label}</b> — {aoa(p.amount)}{' '}
                                            <StatusBadge status={p.status} label={p.status === 'confirmado' ? 'Confirmado' : 'A aguardar confirmação'} />
                                            {p.reference && <><br /><span className="text-muted">Ref.: {p.reference}</span></>}
                                        </p>
                                    ))}
                                    {abilities.pay && <PayCard order={order} methods={methods} />}
                                </div>
                            </div>

                            {(order.review || abilities.review) && (
                                <div className="card">
                                    <div className="card-h">A sua avaliação</div>
                                    <div className="card-b">
                                        {order.review ? (
                                            <>
                                                <Stars rating={order.review.rating} />
                                                <p className="mb-0 mt-2">{order.review.comment || 'Sem comentário.'}</p>
                                            </>
                                        ) : <ReviewCard order={order} />}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <div className="card-h">Técnico</div>
                        <div className="card-b">
                            {t ? (
                                <>
                                    <UserCell initials={t.initials} name={t.name} sub={t.phone} />
                                    <div className="mt-2"><Stars rating={t.rating_avg} /> <span className="text-muted">({t.reviews_count})</span></div>
                                </>
                            ) : <p className="m-0 text-muted">Ainda estamos a atribuir um técnico ao seu pedido.</p>}
                        </div>
                    </div>

                    {abilities.cancel && (
                        <div className="card"><div className="card-h">Cancelar pedido</div><div className="card-b"><CancelForm order={order} /></div></div>
                    )}

                    {abilities.dispute && (
                        <div className="card">
                            <div className="card-h">Algum problema?</div>
                            <div className="card-b">
                                {disputes.map((d) => (
                                    <p key={d.id}>
                                        <StatusBadge status={d.status} /> {d.reason}
                                        {d.resolution && <><br /><span className="text-muted"><b>Resolução:</b> {d.resolution}</span></>}
                                    </p>
                                ))}
                                <DisputeForm order={order} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Show.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
