'use client';

import { usePredictionStatus, type PredictionStatus } from '@/hooks/usePrediction';
import { Badge } from '@/components/ui/Badge';

const VERDICT = { pass: 'PASS', ng: 'NG', pending: 'PENDING' } as const;

/** tag ผลของรถ 1 คัน — ถาม GET /api/predictions/{bn}; 404 = "รอ predict" */
export function ResultCell({ bn }: { bn: number }) {
  const status: PredictionStatus = usePredictionStatus(bn);
  if (status === 'loading') return <span className="text-[12px] text-muted">…</span>;
  if (status === 'error') {
    return (
      <span className="text-[12px] text-muted" title="โหลดผลไม่สำเร็จ">
        —
      </span>
    );
  }
  return <Badge verdict={VERDICT[status]} />;
}
