import { Head, Link, usePage } from '@inertiajs/react';
import { Burger, Button } from '@mantine/core';
import { useState, type ReactNode } from 'react';
import Flash from '@/components/Flash';
import HomeLink from '@/components/HomeLink';
import Logo from '@/components/Logo';
import SearchBox from '@/components/SearchBox';
import { routes } from '@/lib/routes';
import type { SharedProps } from '@/types';

export default function PublicLayout({ children }: { children: ReactNode }) {
    const { url, props } = usePage<SharedProps>();
    const user = props.auth?.user ?? null;
    const [open, setOpen] = useState(false);

    const link = (href: string, label: string, match: string) => (
        <Link
            href={href}
            className={`font-semibold no-underline hover:text-brand ${url.startsWith(match) ? 'text-brand' : 'text-muted'}`}
            onClick={() => setOpen(false)}
        >
            {label}
        </Link>
    );

    return (
        <div className="flex min-h-screen flex-col">
            <Head><meta name="description" content="Gestão de serviços de manutenção doméstica em Angola, com técnicos verificados." /></Head>
            <Flash />

            <header className="sticky top-0 z-50 border-b border-line bg-white">
                <div className="container-page relative flex h-[70px] items-center gap-8">
                    <Logo />
                    <div className="hidden flex-1 md:flex"><SearchBox /></div>

                    <Burger opened={open} onClick={() => setOpen((o) => !o)} className="ml-auto md:hidden" aria-label="Menu" />

                    <nav
                        className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-[70px] flex-col items-stretch gap-4 border-b border-line bg-white px-5 pb-6 pt-4 md:static md:ml-auto md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0`}
                    >
                        {link(routes.services, 'Serviços', '/servicos')}
                        {link(routes.technicians, 'Técnicos', '/tecnicos')}
                        {user ? (
                            <HomeLink user={user} />
                        ) : (
                            <>
                                <Link href={routes.login} className="font-semibold text-brand no-underline">Entrar</Link>
                                <Button component={Link} href={routes.register()} size="sm">Criar Conta</Button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="mt-16 bg-ink pb-8 pt-12 text-slate-300">
                <div className="container-page">
                    <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr]">
                        <div>
                            <Logo light />
                            <p className="mt-4 max-w-[420px]">
                                Gestão de serviços de manutenção doméstica em Angola: electricidade, canalização, pintura, ar condicionado e muito mais, com técnicos verificados.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-base text-white">Plataforma</h4>
                            <Link href={routes.services} className="mb-1.5 block text-slate-300 no-underline hover:text-white">Serviços</Link>
                            <Link href={routes.technicians} className="mb-1.5 block text-slate-300 no-underline hover:text-white">Técnicos</Link>
                            <Link href={routes.register()} className="mb-1.5 block text-slate-300 no-underline hover:text-white">Criar conta</Link>
                        </div>
                        <div>
                            <h4 className="text-base text-white">Para técnicos</h4>
                            <Link href={routes.register('tecnico')} className="mb-1.5 block text-slate-300 no-underline hover:text-white">Registar como técnico</Link>
                            <Link href={routes.login} className="mb-1.5 block text-slate-300 no-underline hover:text-white">Entrar</Link>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-slate-800 pt-5 text-sm text-slate-400">
                        © {new Date().getFullYear()} CAFPMIF. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
