import { Head, Link, useForm } from '@inertiajs/react';
import { Button, TextInput } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import type { FormEvent, ReactNode } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import { routes } from '@/lib/routes';
import { GRADIENT } from '@/theme';

export default function Forgot() {
    const form = useForm({ email: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/recuperar-palavra-passe', { onSuccess: () => form.reset() });
    };

    return (
        <>
            <Head title="Recuperar palavra-passe" />
            <h1 className="mb-1 text-center text-[2rem]">Recuperar palavra-passe</h1>
            <p className="mb-7 text-center text-muted">Indique o seu e-mail e enviaremos as instruções</p>
            <form onSubmit={submit} className="space-y-4">
                <TextInput label="E-mail" withAsterisk type="email" value={form.data.email}
                    onChange={(e) => form.setData('email', e.currentTarget.value)} error={form.errors.email} />
                <Button type="submit" fullWidth size="lg" loading={form.processing} variant="gradient" gradient={GRADIENT}>Enviar instruções</Button>
            </form>
            <div className="mt-5 border-t border-line pt-5 text-center text-sm">
                <Link href={routes.login} className="inline-flex items-center gap-1 text-muted no-underline"><IconArrowLeft size={16} /> Voltar ao início de sessão</Link>
            </div>
        </>
    );
}

Forgot.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;
