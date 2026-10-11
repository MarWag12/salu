export default function Stars({ rating }: { rating: number }) {
    const r = Math.round(rating || 0);

    return (
        <span className="whitespace-nowrap tracking-[1px]" title={`${(rating || 0).toFixed(1).replace('.', ',')} / 5`} aria-label={`${r} de 5 estrelas`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= r ? 'text-amber-500' : 'text-gray-300'}>★</span>
            ))}
        </span>
    );
}
