'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { useNgByPgnum } from '@/hooks/useRecentPredictions';
import { COLORS, NG_DAYS, SIDE_COLOR, SIDES } from '@/lib/constants';
import type { NgByPgnumRow } from '@/types/api';

const TICK = { fill: COLORS.muted, fontSize: 11 };

function Tip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pointer-events-none rounded-lg border border-border bg-surface px-[9px] py-[7px] text-[11px] text-text shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
      <div className="mb-[3px] text-[10px] text-muted">pgnum {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5 leading-[1.55] tabular-nums">
          <span className="h-[3px] w-[11px] flex-none rounded-sm" style={{ background: p.color }} />
          {p.dataKey} · NG <b>{p.value}</b> คัน
        </div>
      ))}
    </div>
  );
}

export function NgByPgnumChart() {
  const { data, isLoading, isError } = useNgByPgnum();

  // แกน Y ปัดขึ้นเป็นช่วงละ 5 → ticks = 0, กลาง, max
  const ticks = useMemo(() => {
    const peak = (data ?? []).reduce((m: number, r: NgByPgnumRow) => Math.max(m, r.LH, r.RH), 0);
    const max = Math.max(10, Math.ceil(peak / 5) * 5);
    return [0, max / 2, max];
  }, [data]);

  if (isLoading) return <div className="py-16 text-center text-[13px] text-muted">กำลังโหลด…</div>;
  if (isError || !data) return <div className="py-16 text-center text-[13px] text-crit-soft">โหลดข้อมูลไม่สำเร็จ</div>;
  if (data.length === 0) return <div className="py-16 text-center text-[13px] text-muted">ยังไม่มีผลตรวจใน {NG_DAYS} วันล่าสุด</div>;

  return (
    <>
      <div className="mb-1.5 flex gap-[18px] text-[12px] text-text-2">
        {SIDES.map((side) => (
          <span key={side} className="flex items-center gap-[7px]">
            <span className="h-2.5 w-3.5 flex-none rounded-sm" style={{ background: SIDE_COLOR[side] }} />
            {side}
          </span>
        ))}
      </div>
      <div className="h-[250px]" role="img" aria-label="จำนวน NG ต่อ pgnum แยก LH RH">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }} barGap={4}>
            {ticks.map((v) => (
              <ReferenceLine key={v} y={v} stroke={COLORS.grid} />
            ))}
            <XAxis
              dataKey="pgnum"
              tick={TICK}
              axisLine={false}
              tickLine={false}
              height={50}
              label={{ value: 'pgnum', position: 'insideBottom', offset: 0, fill: COLORS.muted, fontSize: 11 }}
            />
            <YAxis width={40} ticks={ticks} domain={[0, ticks[2]]} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={Tip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} isAnimationActive={false} />
            {SIDES.map((side) => (
              <Bar
                key={side}
                dataKey={side}
                fill={SIDE_COLOR[side]}
                barSize={16}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
