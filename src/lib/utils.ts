export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function uid(): string {
  return crypto.randomUUID();
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const shortDateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });
const relFmt = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export const formatDate = (ms: number) => dateFmt.format(ms);
export const formatDateTime = (ms: number) => dateTimeFmt.format(ms);
export const formatShortDate = (ms: number) => shortDateFmt.format(ms);
export const formatMonth = (ms: number) => monthFmt.format(ms).replace('.', '');

export function formatRelative(ms: number, now = Date.now()): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (abs < min) return 'agora mesmo';
  if (abs < hour) return relFmt.format(Math.round(diff / min), 'minute');
  if (abs < day) return relFmt.format(Math.round(diff / hour), 'hour');
  if (abs < 30 * day) return relFmt.format(Math.round(diff / day), 'day');
  if (abs < 365 * day) return relFmt.format(Math.round(diff / (30 * day)), 'month');
  return relFmt.format(Math.round(diff / (365 * day)), 'year');
}

export function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.max(0, Math.round(ms / 1000))} s`;
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Data local no formato YYYY-MM-DD. */
export function isoDay(d: Date | number = new Date()): string {
  const date = typeof d === 'number' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Segunda-feira da semana de `d` (00:00 local). */
export function startOfWeek(d: Date | number = new Date()): Date {
  const date = new Date(typeof d === 'number' ? d : d.getTime());
  date.setHours(0, 0, 0, 0);
  const dow = (date.getDay() + 6) % 7; // 0 = segunda
  date.setDate(date.getDate() - dow);
  return date;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfDay(d: Date | number = new Date()): Date {
  const r = new Date(typeof d === 'number' ? d : d.getTime());
  r.setHours(0, 0, 0, 0);
  return r;
}

export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
