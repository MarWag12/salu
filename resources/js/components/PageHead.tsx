import type { ReactNode } from 'react';

export default function PageHead({ title, children }: { title: ReactNode; children?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="m-0 text-[2rem]">{title}</h1>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
    );
}
