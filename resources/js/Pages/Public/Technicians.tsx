import { Head, router } from '@inertiajs/react';
import { Avatar, Badge, Button, Select, TextInput } from '@mantine/core';
import { IconAward, IconCircleCheck, IconLayoutGrid, IconMapPin, IconSearch, IconSortDescending, IconUsers } from '@tabler/icons-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import Empty from '@/components/Empty';
import Pagination from '@/components/Pagination';
import Stars from '@/components/Stars';
import PublicLayout from '@/layouts/PublicLayout';
import { plural } from '@/lib/format';
import { routes } from '@/lib/routes';
import { GRADIENT } from '@/theme';
import type { Category, Paginated, TechnicianCard } from '@/types';

interface Props {
    technicians: Paginated<TechnicianCard>;
    categories: Category[];
    totals: { technicians: number; categories: number };
    filters: { q?: string; categoria?: string; ordem?: string };
}

export default function Technicians({ technicians, categories, totals, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [categoria, setCategoria] = useState<string | null>(filters.categoria ?? null);
    const [ordem, setOrdem] = useState<string | null>(filters.ordem ?? null);

    const apply = (next: { categoria?: string | null; ordem?: string | null } = {}) => {
        const params = { q, categoria, ordem, ...next };
        router.get(routes.technicians, Object.fromEntries(Object.entries(params).filter(([, v]) => v)), { preserveState: true, replace: true });
    };
    const submit = (e: FormEvent) => { e.preventDefault(); apply(); };

    return (
        <>
            <Head title="Técnicos" />
            <section className="bg-page-hero container-page mt-6 px-4 py-12 text-center text-white">
                <div className="mx-auto mb-5 grid size-[72px] place-items-center rounded-full bg-white text-brand"><IconUsers size={34} /></div>
                <h1 className="text-[2.8rem] !text-white max-sm:text-[2rem]">Técnicos de Manutenção</h1>
                <p className="mx-auto mb-6 max-w-[720px] text-[1.15rem] opacity-95">Encontre profissionais qualificados e verificados para todas as suas necessidades. Filtre por categoria e escolha o melhor técnico para si.</p>
                <div className="flex justify-center gap-12">
                    <div><b className="block text-[1.6rem]">{totals.technicians}+</b><span className="opacity-90">Técnicos</span></div>
                    <div><b className="block text-[1.6rem]">{totals.categories}</b><span className="opacity-90">Categorias</span></div>
                </div>
            </section>

            <div className="container-page">
                <form onSubmit={submit} className="my-8 grid items-center gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_6px_20px_-14px_rgba(0,0,0,.25)] md:grid-cols-[2fr_1fr_1fr_auto]">
                    <TextInput placeholder="Pesquisar técnicos…" value={q} onChange={(e) => setQ(e.currentTarget.value)} leftSection={<IconSearch size={18} />} />
                    <Select placeholder="Todas as Categorias" clearable leftSection={<IconLayoutGrid size={18} />}
                        data={categories.map((c) => ({ value: c.slug, label: c.name }))}
                        value={categoria} onChange={(v) => { setCategoria(v); apply({ categoria: v }); }} />
                    <Select placeholder="Melhor Avaliação" clearable leftSection={<IconSortDescending size={18} />}
                        data={[{ value: 'experiencia', label: 'Mais experiência' }]}
                        value={ordem} onChange={(v) => { setOrdem(v); apply({ ordem: v }); }} />
                    <Button type="submit">Filtrar</Button>
                </form>

                <p className="text-muted">{plural(technicians.total, 'técnico encontrado', 'técnicos encontrados')}</p>

                {technicians.data.length === 0 ? (
                    <div className="card"><Empty icon={<IconUsers size={32} />} title="Nenhum técnico encontrado" /></div>
                ) : (
                    <>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {technicians.data.map((t) => (
                                <div key={t.id} className="card flex flex-col gap-2.5 p-6 transition hover:-translate-y-[3px] hover:shadow-lift">
                                    <div className="flex items-center gap-4">
                                        <Avatar size={64} radius="xl" variant="gradient" gradient={GRADIENT} color="white">{t.initials}</Avatar>
                                        <div>
                                            <h3 className="m-0 text-[1.15rem]">{t.name}</h3>
                                            <div className="flex items-center gap-1 text-muted"><IconMapPin size={15} /> {t.municipality || 'Luanda'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Stars rating={t.rating_avg} />
                                        <span className="text-[.85rem] text-muted">({t.reviews_count})</span>
                                        <Badge ml="auto" color="green" variant="light" radius="xl" leftSection={<IconCircleCheck size={13} />}>Verificado</Badge>
                                    </div>
                                    <p className="m-0 text-[.95rem] text-muted">{(t.bio ?? '').slice(0, 100)}{(t.bio ?? '').length > 100 ? '…' : ''}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {t.categories.map((c) => <Badge key={c.id} variant="light" radius="xl">{c.name}</Badge>)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[.9rem] text-muted">
                                        <IconAward size={16} /> {t.experience_years} {t.experience_years === 1 ? 'ano' : 'anos'} de experiência
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination links={technicians.links} />
                    </>
                )}
            </div>
        </>
    );
}

Technicians.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
