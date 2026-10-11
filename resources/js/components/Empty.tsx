import type { ReactNode } from 'react';

export default function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
    return (
        <div className="px-4 py-14 text-center">
            <div className="mx-auto mb-4 grid size-[72px] place-items-center rounded-full bg-[#f1f1f1] text-gray-600">{icon}</div>
            <b className="text-xl text-ink">{title}</b>
            {children && <div className="mt-1 text-muted">{children}</div>}
        </div>
    );
}
