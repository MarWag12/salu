import { Head, router } from '@inertiajs/react';
import { Button, Select, TextInput } from '@mantine/core';
import { IconBriefcase, IconLayoutGrid, IconSearch, IconSortDescending } from '@tabler/icons-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import Empty from '@/components/Empty';
import Pagination from '@/components/Pagination';
import ServiceCard from '@/components/ServiceCard';
import PublicLayout from '@/layouts/PublicLayout';
import { plural } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { Category, Paginated, Service } from '@/types';

interface Props {
    services: Paginated<Service>;
    categories: Category[];
    filters: { q?: string; categoria?: string; ordem?: string };
}

export default function Services({ services, categories, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [categoria, setCategoria] = useState<string | null>(filters.categoria ?? null);
    const [ordem, setOrdem] = useState<string | null>(filters.ordem ?? null);

    const apply = (next: { q?: string; categoria?: string | null; ordem?: string | null } = {}) => {
        const params = { q, categoria, ordem, ...next };
        router.get(routes.services, Object.fromEntries(Object.entries(params).filter(([, v]) => v)), { preserveState: true, replace: true });
    };
    const submit = (e: FormEvent) => { e.preventDefault(); apply(); };

    return (
        <>
            <Head title="Serviços" />
            <section className="bg-page-hero container-page mt-6 px-4 py-12 text-center text-white">
                <div className="mx-auto mb-5 grid size-[72px] place-items-center rounded-full bg-white text-brand"><IconBriefcase size={34} /></div>
                <h1 className="text-[2.8rem] !text-white max-sm:text-[2rem]">Serviços de Manutenção</h1>
                <p className="mx-auto max-w-[720px] text-[1.15rem] opacity-95">Escolha o serviço de que precisa, compare preços e peça um técnico verificado ao domicílio.</p>
            </section>

            <div className="container-page">
                <form onSubmit={submit} className="my-8 grid items-center gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_6px_20px_-14px_rgba(0,0,0,.25)] md:grid-cols-[2fr_1fr_1fr_auto]">
                    <TextInput placeholder="Pesquisar serviços…" value={q} onChange={(e) => setQ(e.currentTarget.value)} leftSection={<IconSearch size={18} />} />
                    <Select
                        placeholder="Todas as Categorias" clearable leftSection={<IconLayoutGrid size={18} />}
                        data={categories.map((c) => ({ value: c.slug, label: c.name }))}
                        value={categoria} onChange={(v) => { setCategoria(v); apply({ categoria: v }); }}
                    />
                    <Select
                        placeholder="Ordem alfabética" clearable leftSection={<IconSortDescending size={18} />}
                        data={[{ value: 'preco', label: 'Menor preço' }]}
                        value={ordem} onChange={(v) => { setOrdem(v); apply({ ordem: v }); }}
                    />
                    <Button type="submit">Filtrar</Button>
                </form>

                <p className="text-muted">{plural(services.total, 'serviço encontrado', 'serviços encontrados')}</p>

                {services.data.length === 0 ? (
                    <div className="card"><Empty icon={<IconSearch size={32} />} title="Nenhum serviço encontrado">Tente outra pesquisa ou categoria.</Empty></div>
                ) : (
                    <>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {services.data.map((s) => <ServiceCard key={s.id} service={s} />)}
                        </div>
                        <Pagination links={services.links} />
                    </>
                )}
            </div>
        </>
    );
}

Services.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
