import { Head, Link, usePage } from '@inertiajs/react';
import { Alert, Badge, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import ServiceCard from '@/components/ServiceCard';
import PublicLayout from '@/layouts/PublicLayout';
import { aoa } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { Service, SharedProps } from '@/types';

export default function ServiceShow({ service, related }: { service: Service; related: Service[] }) {
    const user = usePage<SharedProps>().props.auth?.user;

    return (
        <>
            <Head title={service.name} />
            <div className="container-page py-14">
                <p><Link href={routes.services} className="inline-flex items-center gap-1 no-underline"><IconArrowLeft size={16} /> Todos os serviços</Link></p>

                <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="card overflow-hidden">
                        {service.image_url && <img src={service.image_url} alt={service.name} className="h-64 w-full object-cover" />}
                        <div className="p-8">
                            {service.category && <Badge variant="light" radius="xl">{service.category.name}</Badge>}
                            <h1 className="mt-3 text-[2.2rem]">{service.name}</h1>
                            <p className="text-[1.1rem] text-muted">{service.description}</p>
                            <dl className="kv mt-6">
                                <dt>Preço base</dt><dd className="text-[1.15rem] font-extrabold">{aoa(service.base_price)}</dd>
                                <dt>Duração estimada</dt><dd>{service.duration_label}</dd>
                                <dt>Categoria</dt><dd>{service.category?.name}</dd>
                            </dl>
                            <p className="mt-6 text-[.9rem] text-muted">O preço final pode ser ajustado pelo técnico após avaliação no local. Será sempre apresentado antes do pagamento.</p>
                        </div>
                    </div>

                    <div className="card card-b space-y-4">
                        <h3>Pedir este serviço</h3>
                        <p className="text-muted">Indique a morada e a data e atribuímos um técnico verificado.</p>
                        {!user && (
                            <>
                                <Button component={Link} href={routes.login} fullWidth size="lg">Entrar para pedir</Button>
                                <Button component={Link} href={routes.register()} fullWidth variant="default">Criar conta gratuita</Button>
                            </>
                        )}
                        {user?.role === 'cliente' && <Button component={Link} href={routes.client.newOrder(service.id)} fullWidth size="lg">Pedir agora</Button>}
                        {user && user.role !== 'cliente' && <Alert color="blue">Apenas contas de cliente podem pedir serviços.</Alert>}
                    </div>
                </div>

                {related.length > 0 && (
                    <>
                        <h2 className="mt-12">Outros serviços de {service.category?.name}</h2>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {related.map((s) => <ServiceCard key={s.id} service={s} />)}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

ServiceShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
