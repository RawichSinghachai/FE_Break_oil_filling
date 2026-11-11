'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useMachineDetail } from '@/hooks/useMachineCurves';
import { usePredictionDetail } from '@/hooks/usePrediction';
import { isNotFound } from '@/lib/api';
import { COLORS, FEATURES, MAX_DETAIL_ROWS, SIDE_LABEL, VACUUM_GUN_STANDARD } from '@/lib/constants';
import { formatPct, formatShortDateTime } from '@/lib/format';
import { SIGNALS, tailCurve } from '@/lib/machines';
import type { Side } from '@/types/car';
import { FeatureChart } from '@/components/reconstruction/FeatureChart';
import { Badge } from '@/components/ui/Badge';

export function CarPage({ side, bn }: { side: Side; bn: number }) {
  const router = useRouter();
  // ทุก signal รายวินาที + meta: GET /api/machines/{bn}
  const { data: machine, error: machineError, isPending: machineLoading } = useMachineDetail(bn, side);
  // ผลตรวจ + curve input/recon ของ 3 ฟีเจอร์: GET /api/predictions/{bn}; 404 = ยังไม่มีผล (รอ predict)
  const { data: detail, error: predError } = usePredictionDetail(bn);
  const pending = isNotFound(predError);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && router.push('/');
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router]);

  // 404 จาก API หรือ select ได้ null (ไม่มีแถวของฝั่งนี้) = ไม่พบ
  const missing = isNotFound(machineError) || machine === null;
  const failed = machineError !== null && !isNotFound(machineError);

  return (
    <div className="min-h-screen bg-page">
      <div className="sticky top-0 z-2 flex flex-wrap items-center gap-3.5 border-b border-border bg-surface px-5 py-[13px]">
        <Link
          href="/"
          className="rounded-[9px] border border-border bg-surface-2 px-3.5 py-2 text-[13px] text-text hover:border-muted"
        >
          ← กลับ
        </Link>
        <span className="text-[16px] font-[680]">
          {SIDE_LABEL[side]} · bn {bn}
        </span>
        <span className="ml-3.5 flex gap-4 text-[12px] text-text-2">
          <span className="flex items-center gap-[7px]">
            <span className="h-[3px] w-3.5 rounded-sm" style={{ background: COLORS.s1 }} />
            Input
          </span>
          <span className="flex items-center gap-[7px]">
            <span className="w-3.5 border-t-2 border-dashed border-predict" />
            Predict
          </span>
        </span>
      </div>

      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-5 pb-[60px] pt-[18px]">
        <section className="rounded-card border border-border bg-surface px-[18px] py-4">
          <div className="mb-3 flex flex-wrap items-center gap-3.5">
            <span className="text-[15px] font-[650]">{bn}</span>
            {detail ? <Badge verdict={detail.record.verdict} /> : pending ? <Badge verdict="PENDING" /> : null}
            <span className="flex flex-wrap gap-4 text-[12px] tabular-nums text-muted">
              {machine && <span>{formatShortDateTime(machine.dt)}</span>}
              {machine && <span>asn {machine.asn ?? '—'}</span>}
              {machine && <span>pg{machine.pgnum}</span>}
              {machine && machine.totalRows > MAX_DETAIL_ROWS && (
                <span className="text-pending-soft">
                  แสดง {MAX_DETAIL_ROWS} จาก {machine.totalRows} แถวล่าสุด
                </span>
              )}
              <span>{side}</span>
            </span>
          </div>

          {missing ? (
            <div className="py-[26px] text-center text-[13px] text-muted">ไม่พบข้อมูลของ bn {bn} ฝั่ง {side}</div>
          ) : failed ? (
            <div className="py-[26px] text-center text-[13px] text-crit-soft">โหลดข้อมูลไม่สำเร็จ</div>
          ) : (
            <div className="grid gap-[18px] max-[980px]:grid-cols-1 min-[981px]:grid-cols-3">
              {SIGNALS.map((sig) => {
                const feature = sig.feature ? FEATURES.find((f) => f.key === sig.feature) : undefined;
                const result = feature ? detail?.record.features[feature.key] : undefined;
                const raw = machine?.series[sig.name];
                // มีผล predict → input/recon ชุดเดียวกับที่โมเดลเห็น; ไม่มี → input ดิบจาก /api/machines/{bn}
                const predicted = feature && detail ? detail.curves[feature.key] : undefined;
                const curve = predicted
                  ? tailCurve(predicted)
                  : raw
                    ? { in: raw, re: [] }
                    : undefined;
                return (
                  <div key={sig.name}>
                    <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
                      <span>
                        {side}_{sig.name}
                      </span>
                      {!feature ? (
                        <span className="text-[12px] text-muted">raw</span>
                      ) : result ? (
                        <span className={`text-[12px] tabular-nums ${result.pass ? 'text-good' : 'text-crit'}`}>
                          {formatPct(result.percent)} / {formatPct(result.threshold)}
                        </span>
                      ) : pending ? (
                        <span className="text-[12px] text-pending-soft">รอ predict</span>
                      ) : null}
                    </div>
                    {curve ? (
                      <FeatureChart
                        feature={{ key: sig.name }}
                        series={[{ id: `${side}-${bn}-${sig.name}`, label: String(bn), color: COLORS.s1, curve }]}
                        showPredict={!!feature && !!detail}
                        mode="detail"
                        standard={sig.feature === 'vac' ? VACUUM_GUN_STANDARD : undefined}
                      />
                    ) : (
                      <Empty>{machineLoading ? 'กำลังโหลด…' : ''}</Empty>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="flex h-[210px] items-center justify-center text-[12px] text-muted">{children}</div>;
}
