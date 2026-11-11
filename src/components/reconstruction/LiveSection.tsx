'use client';

import { useLivePrediction } from '@/hooks/usePrediction';
import { COLORS, SIDE_LABEL } from '@/lib/constants';
import { tailCurve } from '@/lib/machines';
import { useCompareStore } from '@/stores/compareStore';
import { useLiveStore } from '@/stores/liveStore';
import type { CarCurves, Side } from '@/types/car';
import { ReconRow } from './ReconRow';

/**
 * มุมมอง real-time ของ 1 เครื่อง — ขับด้วย bn จาก WebSocket
 *  - ระหว่าง cycle: plot ค่าสดที่สะสมของ bn นั้น (เฉพาะ bn ปัจจุบัน)
 *  - cycle จบ (GET /api/predictions/{bn} ได้ผล): แทนด้วย input + predict จาก backend
 *  - แสดงไม่เกิน MAX_DETAIL_ROWS จุดล่าสุด และคงข้อมูลคันเดิมไว้จนกว่า bn เปลี่ยน
 *  - bn เปลี่ยน: เริ่มรถคันใหม่ทันที (liveStore ล้าง trace, query เปลี่ยนตาม bn)
 */
export function LiveSection({ side }: { side: Side }) {
  const showPredict = useCompareStore((s) => s.showPredict);
  const trace = useLiveStore((s) => s.trace[side]);
  const bn = trace?.bn ?? null;
  const { detail, pending, isError } = useLivePrediction(bn);

  const liveCurves: CarCurves | null = trace
    ? {
        pres: { in: trace.pres, re: [] },
        vol: { in: trace.vol, re: [] },
        vac: { in: trace.vac, re: [] },
      }
    : null;

  // ได้ผล predict แล้ว → ใช้ curve จาก backend ; ยังไม่ได้ → ใช้ค่าสด (ยังไม่มีเส้น predict)
  const done = !!detail && detail.record.bn === bn;
  const curves: CarCurves | null = done
    ? { pres: tailCurve(detail.curves.pres), vol: tailCurve(detail.curves.vol), vac: tailCurve(detail.curves.vac) }
    : liveCurves;

  return (
    <div className="mt-4 border-t border-border pt-3.5 first:mt-0 first:border-t-0 first:pt-0">
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="text-[14px] font-[650]">{SIDE_LABEL[side]}</span>
        <span className="text-[12px] tabular-nums text-muted">
          {trace ? `bn ${trace.bn} · pg${trace.pgnum}` : '—'}
        </span>
        {trace && (
          <span className={`text-[12px] ${done ? 'text-good' : 'text-muted'}`}>
            {done
              ? 'ตรวจเสร็จแล้ว'
              : pending
                ? `กำลังทำงาน · รับข้อมูลแล้ว ${trace.pres.length} จุด · รอผล predict`
                : ''}
          </span>
        )}
      </div>

      {curves && trace ? (
        <ReconRow
          series={[
            {
              id: `live-${side}-${trace.bn}`,
              label: `${trace.bn} ${side}`,
              color: COLORS.series[0],
              curves,
              features: done ? detail.record.features : undefined,
            },
          ]}
          showPredict={showPredict && done}
          showStandard
        />
      ) : (
        <div className="pb-1.5 pt-3.5 text-[12px] text-muted">รอข้อมูลสดจากเครื่อง…</div>
      )}
      {isError && <div className="text-[12px] text-crit-soft">โหลดผล predict ไม่สำเร็จ</div>}
    </div>
  );
}
