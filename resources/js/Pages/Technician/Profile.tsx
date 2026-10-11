import { Head, useForm } from '@inertiajs/react';
import { Button, Checkbox, FileInput, NumberInput, SimpleGrid, Switch, Text, Textarea, TextInput } from '@mantine/core';
import { IconFile, IconUpload } from '@tabler/icons-react';
import type { FormEvent, ReactNode } from 'react';
import PageHead from '@/components/PageHead';
import StatusBadge from '@/components/StatusBadge';
import PanelLayout from '@/layouts/PanelLayout';
import { routes } from '@/lib/routes';
import type { Category, KycInfo } from '@/types';

interface Props {
    kyc: KycInfo;
    profile: { phone: string | null; municipality: string | null; experience_years: number; bio: string | null; available: boolean; categories: number[] };
    categories: Category[];
}

export default function Profile({ kyc, profile, categories }: Props) {
    const form = useForm({
        phone: profile.phone ?? '',
        municipality: profile.municipality ?? '',
        experience_years: profile.experience_years as number | string,
        bio: profile.bio ?? '',
        categories: profile.categories,
        available: profile.available,
        kyc_document: null as File | null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        // multipart (ficheiro): o Inertia envia FormData automaticamente quando há um File.
        form.post(routes.tech.profile, { forceFormData: true, preserveScroll: true, onSuccess: () => form.setData('kyc_document', null) });
    };

    return (
        <>
            <Head title="Perfil e KYC" />
            <PageHead title="Perfil e verificação" />

            <div className="card card-b mb-6 max-w-[820px]">
                <div className="flex flex-wrap items-center gap-3">
                    <b>Estado da verificação (KYC):</b>
                    <StatusBadge status={kyc.status} />
                    {kyc.notes && <span className="text-muted">{kyc.notes}</span>}
                </div>
                {kyc.document_url && (
                    <p className="mb-0 mt-2">
                        <a href={kyc.document_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1"><IconFile size={16} /> Ver documento submetido</a>
                    </p>
                )}
            </div>

            <form onSubmit={submit} className="card card-b max-w-[820px] space-y-4">
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Telefone" withAsterisk type="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.currentTarget.value)} error={form.errors.phone} />
                    <TextInput label="Município" withAsterisk value={form.data.municipality} onChange={(e) => form.setData('municipality', e.currentTarget.value)} error={form.errors.municipality} />
                    <NumberInput label="Anos de experiência" withAsterisk min={0} max={60} allowDecimal={false} value={form.data.experience_years}
                        onChange={(v) => form.setData('experience_years', v)} error={form.errors.experience_years} />
                    <FileInput label="Documento de identificação (PDF/JPG/PNG)" placeholder="Escolher ficheiro…" accept=".pdf,.jpg,.jpeg,.png"
                        leftSection={<IconUpload size={16} />} clearable value={form.data.kyc_document}
                        onChange={(f) => form.setData('kyc_document', f)} error={form.errors.kyc_document}
                        description="Máximo 4 MB (o PHP pode limitar a 2 MB: veja o README)." />
                </SimpleGrid>

                <Textarea label="Apresentação" minRows={4} autosize placeholder="Fale da sua experiência e do tipo de trabalhos que faz."
                    value={form.data.bio} onChange={(e) => form.setData('bio', e.currentTarget.value)} error={form.errors.bio} />

                <Checkbox.Group label="Especialidades" withAsterisk error={form.errors.categories}
                    value={form.data.categories.map(String)} onChange={(v) => form.setData('categories', v.map(Number))}>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt={6}>
                        {categories.map((c) => <Checkbox key={c.id} value={String(c.id)} label={c.name} className="rounded-[10px] border border-line px-3 py-2" />)}
                    </SimpleGrid>
                </Checkbox.Group>

                <Switch label="Disponível para receber novos pedidos" checked={form.data.available} onChange={(e) => form.setData('available', e.currentTarget.checked)} />
                {Object.keys(form.errors).length > 0 && <Text c="red" size="sm">Corrija os campos assinalados.</Text>}
                <Button type="submit" loading={form.processing}>Guardar perfil</Button>
            </form>
        </>
    );
}

Profile.layout = (page: ReactNode) => <PanelLayout>{page}</PanelLayout>;
