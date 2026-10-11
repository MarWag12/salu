/** 1500 → "AOA 1 500,00" */
export function aoa(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    const [int, dec] = Math.abs(n).toFixed(2).split('.');
    return `${n < 0 ? '-' : ''}AOA ${int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')},${dec}`;
}

export function plural(n: number, one: string, many: string): string {
    return `${n} ${n === 1 ? one : many}`;
}

export function firstName(name: string): string {
    return name.split(' ')[0] ?? name;
}
