import { Link } from '@inertiajs/react';
import { IconTools } from '@tabler/icons-react';
import { routes } from '@/lib/routes';

export default function Logo({ light = false, text = true }: { light?: boolean; text?: boolean }) {
    return (
        <Link href={routes.home} className={`flex items-center gap-3 text-[1.35rem] font-extrabold no-underline ${light ? 'text-white' : 'text-ink'}`}>
            <span className="grid size-[38px] place-items-center rounded-xl bg-grad text-white"><IconTools size={22} /></span>
            {text && 'CAFPMIF'}
        </Link>
    );
}
