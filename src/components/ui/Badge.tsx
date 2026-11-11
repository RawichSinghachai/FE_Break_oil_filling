import type { Verdict } from '@/types/car';

/** PENDING = ยังไม่มีผล predict (backend ตอบ 404) */
export type BadgeVerdict = Verdict | 'PENDING';

const LABEL: Record<BadgeVerdict, string> = { PASS: 'PASS', NG: 'NG', PENDING: 'รอ predict' };

const BIG: Record<BadgeVerdict, string> = {
  PASS: 'border border-good/55 bg-good/20 text-white',
  NG: 'border border-crit/60 bg-crit/20 text-white',
  PENDING: 'border border-warn/50 bg-warn/16 text-pending-soft',
};

const SMALL: Record<BadgeVerdict, string> = {
  PASS: 'bg-good/15 text-pass-soft',
  NG: 'bg-crit/20 text-crit-soft',
  PENDING: 'bg-warn/16 text-pending-soft',
};

interface BadgeProps {
  verdict: BadgeVerdict;
  /** lg = การ์ดเครื่อง / modal title, sm = ตาราง */
  size?: 'lg' | 'sm';
}

export function Badge({ verdict, size = 'sm' }: BadgeProps) {
  return size === 'lg' ? (
    <span className={`rounded-[7px] px-2.5 py-[3px] text-[13px] font-bold ${BIG[verdict]}`}>{LABEL[verdict]}</span>
  ) : (
    <span className={`rounded-md px-[9px] py-0.5 text-[12px] font-bold ${SMALL[verdict]}`}>{LABEL[verdict]}</span>
  );
}
