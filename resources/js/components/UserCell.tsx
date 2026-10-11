import { Avatar } from '@mantine/core';

export default function UserCell({ initials, name, sub }: { initials: string; name: string; sub?: string | null }) {
    return (
        <div className="flex items-center gap-3">
            <Avatar color="brand" variant="gradient" gradient={{ from: '#1e88e5', to: '#14b3c4', deg: 135 }} radius="xl">{initials}</Avatar>
            <div className="leading-tight">
                <b className="block text-ink">{name}</b>
                {sub && <span className="text-sm text-muted">{sub}</span>}
            </div>
        </div>
    );
}
