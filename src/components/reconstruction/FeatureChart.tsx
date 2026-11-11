'use client';

import { useMemo, type ReactNode } from 'react';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { COLORS } from '@/lib/constants';
import type { CurveSet } from '@/types/car';

export interface ChartSeries {
  id: string | number;
  label: string;
  color: string;
  curve: CurveSet;
}

interface FeatureChartProps {
  /** ใช้แค่ `key` เป็นป้ายใน tooltip โหมด compare */
  feature: { key: string };
  series: ChartSeries[];
  showPredict: boolean;
  /** legend ซ้อนในกราฟ (ใช้ตอน compare หลายชุด) */
  legend?: boolean;
  /** compare = แสดงทุกชุดใน tooltip, detail = input vs predict ของชุดเดียว */
  mode?: 'compare' | 'detail';
  /** เส้น standard แนวนอน (ค่าคงที่บนแกน Y) — ไม่ส่ง = ไม่ตีเส้น */
  standard?: number;
}

const TICK = { fill: COLORS.muted, fontSize: 10 };

interface YTickProps {
  x: number;
  y: number;
  textAnchor: 'start' | 'middle' | 'end' | 'inherit';
  payload: { value: number };
}

/** เพิ่มค่า standard เข้าเป็น tick ของแกน Y — tick อื่นที่ชิดเกิน (< 12% ของช่วงแกน) ถูกตัดออกกันตัวเลขทับกัน */
function withStandard(ticks: number[], standard: number | undefined, span: number): number[] {
  if (standard === undefined) return [...new Set(ticks)];
  const others = ticks.filter((t) => Math.abs(t - standard) >= span * 0.12);
  return [...new Set([...others, standard])].sort((a, b) => a - b);
}

export function FeatureChart({
  feature,
  series,
  showPredict,
  legend = false,
  mode = 'compare',
  standard,
}: FeatureChartProps) {
  // 1 จุดของ curve ≈ 1 วินาที — แกน X เป็นวินาทีนับจากจุดแรก
  const rows = useMemo(() => {
    const n = series.reduce((m, s) => Math.max(m, s.curve.in.length), 0);
    return Array.from({ length: n }, (_, i) => {
      const row: Record<string, number> = { t: i };
      series.forEach((s, k) => {
        row[`in${k}`] = s.curve.in[i];
        row[`re${k}`] = s.curve.re[i];
      });
      return row;
    });
  }, [series]);

  const xMax = Math.max(rows.length - 1, 1);
  const xTicks = useMemo(() => Array.from({ length: Math.floor(xMax / 20) + 1 }, (_, k) => k * 20), [xMax]);

  // แกน Y คำนวณจากข้อมูล (หน่วยดิบต่างกันมากในแต่ละฟีเจอร์) → 3 ticks: min / กลาง / max
  const { domain, yTicks } = useMemo(() => {
    const all: number[] = [];
    for (const s of series) {
      all.push(...s.curve.in);
      if (showPredict) all.push(...s.curve.re);
    }
    const finite = all.filter(Number.isFinite);
    const min = finite.length ? Math.min(...finite) : 0;
    const max = finite.length ? Math.max(...finite) : 1;
    // ให้เส้น standard อยู่ในช่วงแกน Y เสมอ (ไม่งั้นเส้นหลุดกราฟเมื่อข้อมูลต่ำ/สูงกว่า standard ทั้งหมด)
    const dMin = standard === undefined ? min : Math.min(min, standard);
    const dMax = standard === undefined ? max : Math.max(max, standard);
    const pad = (dMax - dMin) * 0.12 || 1;
    const round = (v: number) => (max - min >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
    return {
      domain: [dMin - pad, dMax + pad] as [number, number],
      // ข้อมูลคงที่ (min = max) จะได้ tick ซ้ำ → ต้อง dedupe ไม่งั้น recharts/React ฟ้อง duplicate key
      yTicks: withStandard([round(min), round((min + max) / 2), round(max)], standard, (dMax - dMin) + 2 * pad),
    };
  }, [series, showPredict, standard]);

  // แต่ละชุดยาวไม่เท่ากัน / ยังไม่มี recon → ค่าที่จุดนั้นอาจเป็น undefined (หรือ NaN)
  const fmt = (v: number | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(1) : null);

  const renderTip = ({ active, payload }: TooltipProps<number, string>) => {
    const row = active ? (payload?.[0]?.payload as Record<string, number> | undefined) : undefined;
    if (!row) return null;
    const sec = row.t;
    return (
      <div className="pointer-events-none max-w-[230px] rounded-lg border border-border bg-surface px-[9px] py-[7px] text-[11px] text-text shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
        <div className="mb-[3px] text-[10px] text-muted">{mode === 'compare' ? `${feature.key} · ${sec}s` : `${sec}s`}</div>
        {mode === 'detail' && series[0] ? (
          <>
            {fmt(row.in0) !== null && (
              <TipRow color={series[0].color}>
                input: <b>{fmt(row.in0)}</b>
              </TipRow>
            )}
            {showPredict && fmt(row.re0) !== null && (
              <TipRow color={COLORS.predict}>
                predict: <b>{fmt(row.re0)}</b>
              </TipRow>
            )}
          </>
        ) : (
          // ชุดที่สั้นกว่าจุดนี้ (ไม่มีค่า) ไม่แสดงในรายการ
          series.map((s, k) => {
            const input = fmt(row[`in${k}`]);
            const pred = showPredict ? fmt(row[`re${k}`]) : null;
            return input === null ? null : (
              <TipRow key={s.id} color={s.color}>
                {s.label}: <b>{input}</b>
                {pred !== null && <span style={{ color: COLORS.predict }}> · pred {pred}</span>}
              </TipRow>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="relative h-[210px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 10, bottom: 0, left: 0 }}>
          {yTicks.filter((v) => v !== standard).map((v) => (
            <ReferenceLine key={v} y={v} stroke={COLORS.grid} />
          ))}
          {standard !== undefined && (
            <ReferenceLine
              y={standard}
              stroke={COLORS.standard}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              ifOverflow="extendDomain"
            />
          )}
          <XAxis
            type="number"
            dataKey="t"
            domain={[0, xMax]}
            ticks={xTicks}
            tickFormatter={(v: number) => `${v}s`}
            tick={TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            width={40}
            ticks={yTicks}
            domain={domain}
            tick={({ x, y, payload, textAnchor }: YTickProps) => (
              <text
                x={x}
                y={y}
                dy={3.5}
                textAnchor={textAnchor}
                fontSize={TICK.fontSize}
                fill={payload.value === standard ? COLORS.standard : TICK.fill}
                fontWeight={payload.value === standard ? 600 : 400}
              >
                {payload.value}
              </text>
            )}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={renderTip}
            cursor={{ stroke: COLORS.muted, strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          {series.map((s, k) => [
            showPredict && (
              <Line
                key={`re${s.id}`}
                dataKey={`re${k}`}
                stroke={COLORS.predict}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 2.6, fill: COLORS.predict, stroke: COLORS.surface, strokeWidth: 1 }}
                isAnimationActive={false}
              />
            ),
            <Line
              key={`in${s.id}`}
              dataKey={`in${k}`}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: s.color, stroke: COLORS.surface, strokeWidth: 1 }}
              isAnimationActive={false}
            />,
          ])}
        </LineChart>
      </ResponsiveContainer>

      {legend && series.length > 0 && (
        <div className="pointer-events-none absolute left-[46px] top-[15px] rounded-[5px] border border-grid bg-surface/75 px-1 py-[3px]">
          {series.map((s) => (
            <LegendRow key={s.id} color={s.color} label={s.label} />
          ))}
          {showPredict && <LegendRow color={COLORS.predict} label="predict" dashed />}
        </div>
      )}
    </div>
  );
}

function TipRow({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 leading-[1.55] tabular-nums">
      <span className="h-[3px] w-[11px] flex-none rounded-sm" style={{ background: color }} />
      <span>{children}</span>
    </div>
  );
}

function LegendRow({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex h-[13px] items-center gap-1.5 text-[9.5px] text-text-2">
      <span
        className="w-4 flex-none"
        style={{ borderTop: `2.5px ${dashed ? 'dashed' : 'solid'} ${color}` }}
      />
      {label}
    </div>
  );
}
