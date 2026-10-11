import dayjs from 'dayjs';
import 'dayjs/locale/pt';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt');

const TZ = 'Africa/Luanda';

/** Formata uma data ISO no fuso de Luanda. */
export function fmtDate(iso: string | null | undefined, format = 'DD/MM/YYYY HH:mm'): string {
    return iso ? dayjs(iso).tz(TZ).format(format) : '—';
}

export { dayjs };
