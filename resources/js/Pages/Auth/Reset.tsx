import { Head, useForm } from '@inertiajs/react';
import { Button, PasswordInput, TextInput } from '@mantine/core';
import type { FormEvent, ReactNode } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import { routes } from '@/lib/routes';
import { GRADIENT } from '@/theme';

export default function Reset({ token, email }: { token: string; email: string | null }) {
    const form = useForm({ token, email: email ?? '', password: '', password_confirmation: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(routes.resetPassword, { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <>
            <Head title="Nova palavra-passe" />
            <h1 className="mb-1 text-center text-[2rem]">Nova palavra-passe</h1>
            <p className="mb-7 text-center text-muted">Escolha uma palavra-passe segura</p>
            <form onSubmit={submit} className="space-y-4">
                <TextInput label="E-mail" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.currentTarget.value)} error={form.errors.email} />
                <PasswordInput label="Nova palavra-passe" autoComplete="new-password" value={form.data.password}
                    onChange={(e) => form.setData('password', e.currentTarget.value)} error={form.errors.password} />
                <PasswordInput label="Confirmar palavra-passe" autoComplete="new-password" value={form.data.password_confirmation}
                    onChange={(e) => form.setData('password_confirmation', e.currentTarget.value)} />
                <Button type="submit" fullWidth size="lg" loading={form.processing} variant="gradient" gradient={GRADIENT}>Redefinir</Button>
            </form>
        </>
    );
}

Reset.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;
