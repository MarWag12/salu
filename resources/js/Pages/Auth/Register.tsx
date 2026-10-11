import { Head, Link, useForm } from '@inertiajs/react';
import { Alert, Button, Checkbox, NumberInput, PasswordInput, SimpleGrid, Text, TextInput } from '@mantine/core';
import { IconInfoCircle, IconTool, IconUser } from '@tabler/icons-react';
import type { FormEvent, ReactNode } from 'react';
import AuthLayout from '@/layouts/AuthLayout';
import { routes } from '@/lib/routes';
import { GRADIENT } from '@/theme';
import type { Category } from '@/types';

type Tipo = 'cliente' | 'tecnico';

function RegisterForm({ tipo, categories }: { tipo: Tipo; categories: Category[] }) {
    const form = useForm({
        tipo, name: '', email: '', phone: '', municipality: '', experience_years: 0 as number | string,
        categories: [] as number[], password: '', password_confirmation: '',
    });
    const set = <K extends keyof typeof form.data>(k: K, v: (typeof form.data)[K]) => form.setData(k, v);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(routes.register(), { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <form onSubmit={submit} className="space-y-4" noValidate>
            <TextInput label="Nome completo" withAsterisk autoComplete="name" value={form.data.name} onChange={(e) => set('name', e.currentTarget.value)} error={form.errors.name} />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="E-mail" withAsterisk type="email" autoComplete="email" value={form.data.email} onChange={(e) => set('email', e.currentTarget.value)} error={form.errors.email} />
                <TextInput label="Telefone" withAsterisk type="tel" placeholder="+244 9xx xxx xxx" value={form.data.phone} onChange={(e) => set('phone', e.currentTarget.value)} error={form.errors.phone} />
            </SimpleGrid>

            {tipo === 'tecnico' && (
                <>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput label="Município" withAsterisk placeholder="Ex.: Viana" value={form.data.municipality} onChange={(e) => set('municipality', e.currentTarget.value)} error={form.errors.municipality} />
                        <NumberInput label="Anos de experiência" min={0} max={60} allowDecimal={false} value={form.data.experience_years} onChange={(v) => set('experience_years', v)} error={form.errors.experience_years} />
                    </SimpleGrid>
                    <Checkbox.Group
                        label="Especialidades" withAsterisk error={form.errors.categories}
                        value={form.data.categories.map(String)} onChange={(v) => set('categories', v.map(Number))}
                    >
                        <SimpleGrid cols={{ base: 1, sm: 2 }} mt={6}>
                            {categories.map((c) => (
                                <Checkbox key={c.id} value={String(c.id)} label={c.name} className="rounded-[10px] border border-line px-3 py-2" />
                            ))}
                        </SimpleGrid>
                    </Checkbox.Group>
                    <Alert color="blue" icon={<IconInfoCircle size={18} />}>
                        Depois de criar a conta, submeta o documento de identificação para verificação (KYC) no seu perfil.
                    </Alert>
                </>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <PasswordInput label="Palavra-passe" withAsterisk autoComplete="new-password" value={form.data.password} onChange={(e) => set('password', e.currentTarget.value)} error={form.errors.password} />
                <PasswordInput label="Confirmar" withAsterisk autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => set('password_confirmation', e.currentTarget.value)} />
            </SimpleGrid>
            <Text size="sm" c="dimmed" mt={-8}>Mínimo de 8 caracteres, com letras e números.</Text>

            <Button type="submit" fullWidth size="lg" loading={form.processing} variant="gradient" gradient={GRADIENT}>Criar conta</Button>
        </form>
    );
}

export default function Register({ tipo, categories }: { tipo: Tipo; categories: Category[] }) {
    const tab = (on: boolean) =>
        `flex items-center justify-center gap-2 rounded-xl border p-3 text-center font-semibold no-underline ${on ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted'}`;

    return (
        <>
            <Head title="Criar conta" />
            <h1 className="mb-1 text-center text-[2rem]">Criar conta</h1>
            <p className="mb-6 text-center text-muted">Junte-se à CAFPMIF em menos de um minuto</p>

            <div className="mb-5 grid grid-cols-2 gap-2.5">
                <Link href={routes.register()} className={tab(tipo === 'cliente')}><IconUser size={18} /> Sou Cliente</Link>
                <Link href={routes.register('tecnico')} className={tab(tipo === 'tecnico')}><IconTool size={18} /> Sou Técnico</Link>
            </div>

            {/* key: reinicia o formulário ao alternar entre cliente e técnico */}
            <RegisterForm key={tipo} tipo={tipo} categories={categories} />

            <p className="mb-0 mt-4 text-center text-sm">Já tem conta? <Link href={routes.login} className="font-bold no-underline">Entrar</Link></p>
        </>
    );
}

Register.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;
