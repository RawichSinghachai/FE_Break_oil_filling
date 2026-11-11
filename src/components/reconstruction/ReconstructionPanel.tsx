'use client';

import { MAX_COMPARE, MAX_DETAIL_ROWS, SIDES } from '@/lib/constants';
import { useCompareStore, type ReconMode } from '@/stores/compareStore';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { ComparePanel } from './ComparePanel';
import { LiveSection } from './LiveSection';
import { MachineStatusLine } from './MachineStatusLine';

const MODES: { value: ReconMode; label: string }[] = [
  { value: 'live', label: 'Real-time' },
  { value: 'compare', label: 'เปรียบเทียบ' },
];

const segBtn =
  'rounded-[7px] px-[13px] py-[5px] text-[12px] font-bold text-muted aria-pressed:bg-s1 aria-pressed:text-white';
const segWrap =
  'inline-flex items-center gap-1 rounded-[9px] border border-border bg-surface-2 py-[3px] pl-2.5 pr-[3px]';

export function ReconstructionPanel() {
  const mode = useCompareStore((s) => s.mode);
  const visibleSides = useCompareStore((s) => s.visibleSides);
  const showPredict = useCompareStore((s) => s.showPredict);
  const setMode = useCompareStore((s) => s.setMode);
  const toggleSide = useCompareStore((s) => s.toggleSide);
  const togglePredict = useCompareStore((s) => s.togglePredict);

  return (
    <Card className="mb-4">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3.5">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.3px] text-text-2">
          Reconstruction overlay — 3 ฟีเจอร์{' '}
          <span className="text-[12px] font-normal normal-case tracking-normal text-muted">
            {mode === 'live' ? 'เส้นทึบ = input (สีตาม bn) · เส้นประแดง = predict' : 'เส้นทึบ = input (สีตาม bn)'}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className={segWrap}>
            <span className="mr-[3px] text-[11px] text-muted">มุมมอง</span>
            {MODES.map((m) => (
              <button key={m.value} type="button" aria-pressed={mode === m.value} onClick={() => setMode(m.value)} className={segBtn}>
                {m.label}
              </button>
            ))}
          </span>
          {mode === 'live' && (
            <span className={segWrap}>
              <span className="mr-[3px] text-[11px] text-muted">ฝั่ง</span>
              {SIDES.map((side) => (
                <button
                  key={side}
                  type="button"
                  aria-pressed={visibleSides[side]}
                  onClick={() => toggleSide(side)}
                  className={segBtn}
                >
                  {side}
                </button>
              ))}
            </span>
          )}
          {mode === 'live' && (
            <Toggle pressed={showPredict} onToggle={togglePredict}>
              แสดงผล predict
            </Toggle>
          )}
        </div>
      </div>

      <MachineStatusLine />

      {mode === 'live' ? (
        <div>
          {SIDES.filter((side) => visibleSides[side]).map((side) => (
            <LiveSection key={side} side={side} />
          ))}
        </div>
      ) : (
        <ComparePanel />
      )}

      <div className="mt-2.5 text-[12px] text-muted">
        {mode === 'live'
          ? `โหมด Real-time: cycle ปัจจุบันของแต่ละเครื่อง ไม่เกิน ${MAX_DETAIL_ROWS} จุดล่าสุด และคงไว้จนกว่ารถคันใหม่เข้า (เส้นทึบ = input, เส้นประแดง = predict) · สลับไป "เปรียบเทียบ" เพื่อเลือก bn มาซ้อนทับย้อนหลัง`
          : `โหมดเปรียบเทียบ: เริ่มจากว่าง เลือก bn ที่ต้องการมาซ้อนทับเอง (สูงสุด ${MAX_COMPARE} ชุด รวมทุกฝั่งในกราฟเดียว) · ข้อมูล input จาก /api/machines/{bn} (ไม่เกิน ${MAX_DETAIL_ROWS} แถวล่าสุดต่อชุด)`}
      </div>
    </Card>
  );
}
