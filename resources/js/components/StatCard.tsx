import type { ReactNode } from 'react';

const TONES = { orange: 'text-accent', green: 'text-green-600', blue: 'text-brand', red: 'text-red-600' } as const;

export default function StatCard({ label, value, note, icon, tone = 'blue' }: {
    label: string;
    value: ReactNode;
    note: string;
    icon: ReactNode;
    tone?: keyof typeof TONES;
}) {
    return (
        <div className="card px-6 py-6">
            <div className="font-semibold text-muted">{label}</div>
            <div className="my-2 text-4xl font-extrabold leading-tight text-ink">{value}</div>
            <div className={`flex items-center gap-2 font-semibold ${TONES[tone]}`}>
                <span>{note}</span>
                {icon}
            </div>
        </div>
    );
}
