import { Link } from '@inertiajs/react';
import { routes } from '@/lib/routes';

/**
 * Logótipo da Salu (public/images).
 * - `text`: mostra o logótipo completo (símbolo + "salu" + slogan); sem texto mostra só o símbolo.
 * - `light`: usado em fundos escuros (rodapé) — o logótipo assenta num cartão branco para manter as cores legíveis.
 */
export default function Logo({ light = false, text = true }: { light?: boolean; text?: boolean }) {
    const img = (
        <img
            src={text ? '/images/salu-logo.png' : '/images/salu-symbol.png'}
            alt="Salu — Gestão de Manutenção Doméstica"
            className={text ? 'h-[58px] w-auto' : 'h-[38px] w-auto'}
            width={text ? 52 : 43}
            height={text ? 58 : 38}
        />
    );

    return (
        <Link
            href={routes.home}
            aria-label="Salu — página inicial"
            className={`inline-flex items-center no-underline ${light ? 'rounded-xl bg-white px-3 py-2 shadow-sm' : ''}`}
        >
            {img}
        </Link>
    );
}
