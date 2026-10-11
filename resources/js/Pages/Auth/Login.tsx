import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Checkbox, PasswordInput, TextInput } from '@mantine/core';
import { IconLock, IconMail } from '@tabler/icons-react';
import type { FormEvent, ReactNode } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import { routes } from '@/lib/routes';
import { GRADIENT } from '@/theme';

export default function Login() {
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(routes.login, { onFinish: () => form.reset('password') });
    };

    return (
        <>
            <Head title="Iniciar sessão" />
            <h1 className="mb-1 text-center text-[2rem]">Bem-vindo de volta!</h1>
            <p className="mb-7 text-center text-muted">Introduza as suas credenciais para continuar</p>

            <form onSubmit={submit} className="space-y-4" noValidate>
                <TextInput
                    label="E-mail" withAsterisk type="email" placeholder="seu@email.com" autoComplete="email" data-autofocus
                    leftSection={<IconMail size={18} />} value={form.data.email}
                    onChange={(e) => form.setData('email', e.currentTarget.value)} error={form.errors.email}
                />
                <PasswordInput
                    label="Palavra-passe" withAsterisk placeholder="Introduza a sua palavra-passe" autoComplete="current-password"
                    leftSection={<IconLock size={18} />} value={form.data.password}
                    onChange={(e) => form.setData('password', e.currentTarget.value)} error={form.errors.password}
                />
                <div className="flex items-center justify-between">
                    <Checkbox label="Manter sessão iniciada" checked={form.data.remember} onChange={(e) => form.setData('remember', e.currentTarget.checked)} />
                    <Link href={routes.forgot} className="text-sm no-underline">Esqueceu a palavra-passe?</Link>
                </div>
                <Button type="submit" fullWidth size="lg" loading={form.processing} variant="gradient" gradient={GRADIENT}>Entrar</Button>
            </form>

            <div className="my-5 flex items-center gap-4 text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">ou</div>
            <p className="m-0 text-center">Ainda não tem conta? <Link href={routes.register()} className="font-bold no-underline">Criar conta gratuita</Link></p>

            <div className="mt-5 border-t border-line pt-5 text-center text-sm text-muted">
                <Link href={routes.home} className="text-muted no-underline">Página Inicial</Link> •{' '}
                <Link href={routes.services} className="text-muted no-underline">Explorar Serviços</Link> •{' '}
                <Link href={routes.technicians} className="text-muted no-underline">Técnicos</Link>
            </div>
        </>
    );
}

Login.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;
