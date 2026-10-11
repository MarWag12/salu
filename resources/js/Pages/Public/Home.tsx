import { Head, Link } from '@inertiajs/react';
import { Button } from '@mantine/core';
import {
    IconArrowRight, IconBriefcase, IconClock, IconLayoutGrid, IconShieldCheck, IconSparkles, IconStar, IconUsers,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import CategoryIcon from '@/components/Icon';
import SearchBox from '@/components/SearchBox';
import ServiceCard from '@/components/ServiceCard';
import PublicLayout from '@/layouts/PublicLayout';
import { routes } from '@/lib/routes';
import type { Category, Service } from '@/types';

interface Props {
    categories: Category[];
    featured: Service[];
    stats: { services: number; technicians: number; categories: number };
}

function SectionHead({ title, sub, to, cta }: { title: string; sub: string; to: string; cta: string }) {
    return (
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <h2 className="m-0 text-[2.1rem]">{title}</h2>
                <p className="m-0 mt-1 text-[1.1rem] text-muted">{sub}</p>
            </div>
            <Link href={to} className="inline-flex items-center gap-1.5 font-semibold no-underline">{cta} <IconArrowRight size={18} /></Link>
        </div>
    );
}

export default function Home({ categories, featured, stats }: Props) {
    const statCards = [
        { icon: <IconBriefcase size={24} />, value: `${stats.services}+`, label: 'Serviços Disponíveis' },
        { icon: <IconUsers size={24} />, value: `${stats.technicians}+`, label: 'Técnicos Verificados' },
        { icon: <IconLayoutGrid size={24} />, value: stats.categories, label: 'Categorias' },
    ];
    const why = [
        { icon: <IconShieldCheck size={26} />, title: 'Profissionais Verificados', text: 'Todos os técnicos passam por um processo de verificação rigoroso para garantir qualidade.' },
        { icon: <IconClock size={26} />, title: 'Resposta Rápida', text: 'O seu pedido é atribuído a um técnico em minutos, não em dias.' },
        { icon: <IconStar size={26} />, title: 'Avaliações Reais', text: 'Veja avaliações e comentários de clientes reais antes de contratar.' },
    ];

    return (
        <>
            <Head title="Serviços de manutenção doméstica" />

            <section className="bg-hero relative overflow-hidden pb-36 pt-20 text-center text-white max-sm:pb-28 max-sm:pt-12">
                <div className="container-page">
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
                        <IconSparkles size={16} /> Manutenção doméstica em Angola
                    </span>
                    <h1 className="mx-auto mb-4 mt-6 max-w-[900px] text-[clamp(2.2rem,5vw,3.7rem)] font-extrabold !text-white">
                        Encontre os Melhores <span className="text-grad">Profissionais</span> para a Sua Casa
                    </h1>
                    <p className="mx-auto mb-8 max-w-[720px] text-[1.2rem] opacity-90">
                        De reparações eléctricas a canalização e pintura, conectamo-lo aos melhores técnicos verificados em Angola.
                    </p>

                    <SearchBox hero />

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <span className="opacity-85">Popular:</span>
                        {categories.slice(0, 4).map((c) => (
                            <Link key={c.id} href={`${routes.services}?categoria=${c.slug}`}
                                className="rounded-full border border-white/45 bg-white/10 px-4 py-1 text-[.78rem] font-bold uppercase text-white no-underline hover:bg-white/20">
                                {c.name}
                            </Link>
                        ))}
                    </div>

                    <div className="mx-auto mt-12 grid max-w-[900px] gap-5 sm:grid-cols-3">
                        {statCards.map((s) => (
                            <div key={s.label} className="rounded-[20px] border border-white/25 bg-white/10 p-6 text-left backdrop-blur-sm">
                                <div className="mb-5 grid size-12 place-items-center rounded-full bg-white text-brand">{s.icon}</div>
                                <b className="block text-[2rem] leading-none">{s.value}</b>
                                <small className="text-[.95rem] opacity-90">{s.label}</small>
                            </div>
                        ))}
                    </div>
                </div>
                <svg className="absolute inset-x-0 -bottom-px block h-[90px] w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0,90 C240,10 520,0 760,10 C1040,22 1240,60 1440,40 L1440,90 Z" fill="#fafafa" />
                </svg>
            </section>

            <section className="py-14">
                <div className="container-page">
                    <SectionHead title="Explore por Categoria" sub="Encontre exactamente o que procura" to={routes.services} cta="Ver todas" />
                    {categories.length === 0 ? (
                        <p className="text-muted">Ainda não há categorias.</p>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {categories.map((c) => (
                                <Link key={c.id} href={`${routes.services}?categoria=${c.slug}`}
                                    className="rounded-[20px] border border-line bg-white px-4 py-8 text-center text-ink no-underline shadow-card transition hover:-translate-y-1 hover:shadow-[0_16px_30px_-14px_rgba(30,136,229,.35)]">
                                    <div className="mx-auto mb-5 grid size-[72px] place-items-center rounded-full bg-brand-soft text-brand"><CategoryIcon name={c.icon} size={32} /></div>
                                    <h3 className="mb-1 text-[1.3rem]">{c.name}</h3>
                                    <small className="text-base text-muted">{c.services_count} {c.services_count === 1 ? 'serviço' : 'serviços'}</small>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {featured.length > 0 && (
                <section className="pb-14">
                    <div className="container-page">
                        <SectionHead title="Serviços em Destaque" sub="Os mais procurados pelos nossos clientes" to={routes.services} cta="Ver todos" />
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {featured.map((s) => <ServiceCard key={s.id} service={s} />)}
                        </div>
                    </div>
                </section>
            )}

            <section className="pb-14">
                <div className="container-page">
                    <div className="grid items-center gap-12 rounded-[36px] border border-line bg-white p-8 sm:p-14 lg:grid-cols-2">
                        <div>
                            <span className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-[.85rem] font-bold uppercase text-brand">Porquê escolher a CAFPMIF?</span>
                            <h2 className="my-5 text-[2.3rem]">A plataforma que conecta <span className="text-brand">talentos</span> a <span className="text-brand-teal">oportunidades</span></h2>
                            <p className="mb-6 text-[1.2rem] text-muted">Somos uma plataforma segura e confiável para ligar técnicos qualificados a clientes que precisam de manutenção doméstica de qualidade.</p>
                            <Button component={Link} href={routes.register()} size="lg" variant="gradient" gradient={{ from: '#1e88e5', to: '#14b3c4', deg: 135 }} rightSection={<IconArrowRight size={18} />}>
                                Comece Agora
                            </Button>
                        </div>
                        <div>
                            {why.map((f) => (
                                <div key={f.title} className="mb-6 flex items-start gap-5">
                                    <span className="grid size-[50px] flex-none place-items-center rounded-xl bg-brand-soft text-brand">{f.icon}</span>
                                    <div><h4 className="mb-0.5 text-[1.2rem]">{f.title}</h4><p className="m-0 text-muted">{f.text}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="container-page">
                    <div className="bg-cta grid gap-12 rounded-[36px] p-8 text-white sm:p-14 lg:grid-cols-2">
                        <div>
                            <div className="mb-5 grid size-[76px] place-items-center rounded-full bg-white text-brand"><IconBriefcase size={34} /></div>
                            <h3 className="text-[1.9rem] !text-white">É um Técnico?</h3>
                            <p className="text-[1.15rem] opacity-90">Junte-se à equipa de técnicos da CAFPMIF e alcance mais clientes. Aumente a sua visibilidade e faça crescer o seu negócio.</p>
                            <Button component={Link} href={routes.register('tecnico')} fullWidth size="lg" color="white" c="brand.6" rightSection={<IconArrowRight size={18} />}>Registar como Técnico</Button>
                        </div>
                        <div>
                            <div className="mb-5 grid size-[76px] place-items-center rounded-full bg-teal-500 text-white"><IconUsers size={34} /></div>
                            <h3 className="text-[1.9rem] !text-white">Procura Serviços?</h3>
                            <p className="text-[1.15rem] opacity-90">Encontre técnicos verificados para qualquer tipo de serviço que precise. Compare preços, veja avaliações e contrate com confiança.</p>
                            <Button component={Link} href={routes.services} fullWidth size="lg" variant="outline" color="white" rightSection={<IconArrowRight size={18} />}>Explorar Serviços</Button>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

Home.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
