import { format } from 'date-fns';

export const formatPct = (v: number) => `${v.toFixed(1)}%`;

/** HH:mm dd/MM/yyyy — ตารางประวัติ */
export const formatShortDateTime = (iso: string) => format(new Date(iso), 'HH:mm dd/MM/yyyy');

/** dd/MM/yyyy HH:mm — modal */
export const formatFullDateTime = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm');

export const formatClock = (ms: number) => format(new Date(ms), 'HH:mm:ss');

/** yyyy-MM-dd HH:mm:ss — CSV */
export const formatCsvDateTime = (iso: string) => format(new Date(iso), 'yyyy-MM-dd HH:mm:ss');

/** ค่าสำหรับ <input type="datetime-local"> */
export const toDatetimeLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

/** แปลงเป็น ISO 8601 ให้ backend; ค่าว่าง/ไม่ถูกต้อง = undefined */
export const fromDatetimeLocal = (v: string) => (v ? new Date(v).toISOString() : undefined);

export const formatInt = (n: number) => n.toLocaleString('en-US');

export const arrow = (n: number) => (n >= 0 ? '▲' : '▼');
