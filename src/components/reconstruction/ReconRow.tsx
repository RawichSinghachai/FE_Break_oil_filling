import { FEATURES, VACUUM_GUN_STANDARD } from '@/lib/constants';
import { formatPct } from '@/lib/format';
import type { CarCurves, FeatureResults } from '@/types/car';
import { FeatureChart, type ChartSeries } from './FeatureChart';

export interface LoadedSeries {
  id: string | number;
  label: string;
  color: string;
  curves: CarCurves;
  /** % diff / threshold จาก backend (แสดงเมื่อมีชุดเดียว) — ไม่มี = ยังไม่มีผล predict */
  features?: FeatureResults;
}

interface ReconRowProps {
  series: LoadedSeries[];
  showPredict: boolean;
  /** ตีเส้น standard ในกราฟ vacuumgun — ปิดเมื่อ plot ซ้อนหลายชุด (compare) */
  showStandard?: boolean;
}

/** แถวกราฟ 3 ฟีเจอร์ — ชุดเดียวแสดง % diff, หลายชุดแสดง "ซ้อน N" */
export function ReconRow({ series, showPredict, showStandard = false }: ReconRowProps) {
  return (
    <div className="grid gap-[18px] max-[980px]:grid-cols-1 min-[981px]:grid-cols-3">
      {FEATURES.map((f) => {
        const chartSeries: ChartSeries[] = series.map((s) => ({
          id: s.id,
          label: s.label,
          color: s.color,
          curve: s.curves[f.key],
        }));
        const single = series.length === 1 ? (series[0].features?.[f.key] ?? null) : null;
        return (
          <div key={f.key}>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
              <span>{f.name}</span>
              {single ? (
                <span className={`text-[12px] tabular-nums ${single.pass ? 'text-good' : 'text-crit'}`}>
                  {formatPct(single.percent)} <span className="text-muted">/ {formatPct(single.threshold)}</span>
                </span>
              ) : (
                <span className="text-[12px] tabular-nums text-muted">
                  {series.length === 1 ? 'รอผล predict' : `ซ้อน ${chartSeries.length}`}
                </span>
              )}
            </div>
            <FeatureChart
              feature={f}
              series={chartSeries}
              showPredict={showPredict}
              legend
              standard={showStandard && f.key === 'vac' ? VACUUM_GUN_STANDARD : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
