import { Head, Link, useForm } from '@inertiajs/react';
import { Alert, Button, Select, SimpleGrid, Textarea, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconInfoCircle } from '@tabler/icons-react';
import type { FormEvent, ReactNode } from 'react';
import PageHead from '@/components/PageHead';
import PanelLayout from '@/layouts/PanelLayout';
import { dayjs } from '@/lib/dayjs';
import { aoa } from '@/lib/format';
import { routes } from '@/lib/routes';
import { GRADIENT } from '@/theme';

interface Props {
    services: { id: number; name: string; base_price: number; category: string | null }[];
    selected: number | null;
}

export default function Create({ services, selected }: Props) {
    const form = useForm({
        service_id: selected ? String(selected) : '',
        municipality: '',
        scheduled_at: null as Date | null,
        address: '',
        description: '',
    });

    // Agrupa os serviços por categoria no seletor.
    const groups = Object.entries(
        services.reduce<Record<string, Props['services']>>((acc, s) => {
            (acc[s.category ?? 'Outros'] ||= []).push(s);
            return acc;
        }, {}),
    ).map(([group, items]) => ({ group, items: items.map((s) => ({ value: String(s.id), label: `${s.name} — ${aoa(s.base_price)}` })) }));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((d) => ({ ...d, scheduled_at: d.scheduled_at ? dayjs(d.scheduled_at).format('YYYY-MM-DDTHH:mm') : '' }));
        form.post(routes.client.orders);
    };

    return (
        <>
            <Head title="Novo pedido" />
            <PageHead title="Novo pedido de serviço">
                <Button component={Link} href={routes.client.orders} variant="default">Voltar</Button>
            </PageHead>

            <form onSubmit={submit} className="card card-b max-w-[820px] space-y-4">
                <Select label="Serviço" withAsterisk searchable placeholder="Seleccione um serviço…" data={groups}
                    value={form.data.service_id || null} onChange={(v) => form.setData('service_id', v ?? '')} error={form.errors.service_id} />
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Município" withAsterisk placeholder="Ex.: Viana" value={form.data.municipality}
                        onChange={(e) => form.setData('municipality', e.currentTarget.value)} error={form.errors.municipality} />
                    <DateTimePicker label="Data e hora pretendidas" withAsterisk placeholder="Escolha a data e a hora" valueFormat="DD/MM/YYYY HH:mm"
                        minDate={new Date()} value={form.data.scheduled_at} onChange={(v) => form.setData('scheduled_at', v as Date | null)} error={form.errors.scheduled_at} />
                </SimpleGrid>
                <TextInput label="Morada completa" withAsterisk placeholder="Rua, casa/apartamento, bairro, ponto de referência" value={form.data.address}
                    onChange={(e) => form.setData('address', e.currentTarget.value)} error={form.errors.address} />
                <Textarea label="Descreva o problema" minRows={4} autosize placeholder="Ex.: Fuga debaixo do lavatório da casa de banho…" value={form.data.description}
                    onChange={(e) => form.setData('description', e.currentTarget.value)} error={form.errors.description} />
                <Alert color="blue" icon={<IconInfoCircle size={18} />}>O preço apresentado é o valor base. O técnico poderá ajustá-lo após avaliação no local.</Alert>
                <Button type="submit" size="lg" loading={form.processing} variant="gradient" gradient={GRADIENT}>Enviar pedido</Button>
            </form>
        </>
    );
}

Create.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
