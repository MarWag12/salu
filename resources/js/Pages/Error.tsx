import { Head, Link } from '@inertiajs/react';
import { Button } from '@mantine/core';
import type { ReactNode } from 'react';
import PublicLayout from '@/layouts/PublicLayout';

const TITLES: Record<number, [string, string]> = {
    403: ['Acesso negado', 'Não tem permissão para aceder a esta área.'],
    404: ['Página não encontrada', 'A página que procura não existe ou foi movida.'],
    500: ['Erro do servidor', 'Algo correu mal. Tente novamente dentro de instantes.'],
    503: ['Em manutenção', 'Voltamos já. Obrigado pela paciência.'],
};

export default function Error({ status, message }: { status: number; message?: string }) {
    const [title, fallback] = TITLES[status] ?? ['Erro', 'Ocorreu um erro inesperado.'];

    return (
        <>
            <Head title={title} />
            <div className="grid min-h-[70vh] place-items-center p-8 text-center">
                <div>
                    <div className="text-grad text-[6rem] font-extrabold leading-none" style={{ backgroundImage: 'var(--grad)' }}>{status}</div>
                    <h2>{title}</h2>
                    <p className="mb-5 text-muted">{message || fallback}</p>
                    <Button component={Link} href="/">Voltar ao início</Button>
                </div>
            </div>
        </>
    );
}

Error.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
