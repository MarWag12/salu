import { Link } from '@inertiajs/react';
import type { PageLink } from '@/types';

/** Paginação a partir dos `links` do paginador do Laravel. */
export default function Pagination({ links }: { links: PageLink[] }) {
    if (links.length <= 3) return null;

    const label = (l: PageLink, i: number) => (i === 0 ? '‹' : i === links.length - 1 ? '›' : l.label.replace(/&[^;]+;/g, '…'));
    const base = 'rounded-lg border px-3 py-1.5 text-sm font-semibold no-underline';

    return (
        <nav className="flex flex-wrap justify-center gap-1 p-5" aria-label="Paginação">
            {links.map((l, i) =>
                l.url && !l.active ? (
                    <Link key={i} href={l.url} preserveScroll className={`${base} border-line bg-white text-body hover:bg-gray-50`}>
                        {label(l, i)}
                    </Link>
                ) : (
                    <span key={i} className={`${base} ${l.active ? 'border-brand bg-brand text-white' : 'border-line bg-gray-50 text-gray-400'}`}>
                        {label(l, i)}
                    </span>
                ),
            )}
        </nav>
    );
}
