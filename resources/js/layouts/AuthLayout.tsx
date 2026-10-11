import { Link } from '@inertiajs/react';
import { IconBriefcase, IconShieldCheck, IconStar } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import Flash from '@/components/Flash';
import { routes } from '@/lib/routes';

const FEATURES = [
    { icon: <IconBriefcase size={26} />, title: 'Técnicos verificados', text: 'Todos passam por verificação de identidade (KYC)' },
    { icon: <IconStar size={26} />, title: 'Serviços avaliados', text: 'Avaliações reais de clientes verificados' },
    { icon: <IconShieldCheck size={26} />, title: 'Pagamentos seguros', text: 'Pagamentos registados e confirmados pela CAFPMIF' },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-auth grid min-h-screen place-items-center p-8">
            <Flash />
            <div className="grid w-[min(1240px,100%)] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
                <section className="hidden text-white lg:block">
                    <Link href={routes.home} className="mb-10 flex items-center gap-4 text-[2.6rem] font-extrabold text-white no-underline">
                        <span className="grid size-[84px] place-items-center rounded-full bg-white text-brand"><IconShieldCheck size={44} /></span>
                        CAFPMIF
                    </Link>
                    <h2 className="max-w-[620px] text-[2rem] font-semibold !text-white">A sua casa em boas mãos, em todo o país</h2>
                    <p className="mb-8 max-w-[620px] text-[1.15rem] opacity-90">
                        Conectamos clientes a técnicos de manutenção doméstica qualificados. Peça o serviço de que precisa ou ofereça os seus talentos.
                    </p>
                    {FEATURES.map((f) => (
                        <div key={f.title} className="mb-4 flex items-center gap-5">
                            <span className="grid size-[52px] flex-none place-items-center rounded-xl bg-white/20 text-white">{f.icon}</span>
                            <div>
                                <h4 className="mb-0 text-[1.1rem] !text-white">{f.title}</h4>
                                <p className="m-0 text-[.95rem] text-white/85">{f.text}</p>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="rounded-[28px] bg-white p-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,.35)] sm:p-11">{children}</section>
            </div>
        </div>
    );
}
