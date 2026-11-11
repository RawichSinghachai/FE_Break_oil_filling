import { formatPct } from '@/lib/format';
import { severityOf, type Severity } from '@/lib/thresholds';
import type { FeatureConfig, FeatureResult } from '@/types/car';

const FILL: Record<Severity, string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  crit: 'bg-crit',
};

interface FeatureBarProps {
  feature: FeatureConfig;
  result: FeatureResult;
}

/** แถบ % diff เทียบ threshold: เต็มแถบ = threshold, เส้นขาว = ตำแหน่ง threshold */
export function FeatureBar({ feature, result }: FeatureBarProps) {
  const { percent, threshold, pass } = result;
  const fillPct = Math.min(percent / threshold, 1) * 100;
  const markerPct = pass ? 100 : (threshold / percent) * 100;

  return (
    <div className="my-[11px]">
      <div className="mb-[5px] flex justify-between text-[12px]">
        <span className="text-text-2">{feature.rawName}</span>
        <span className={`tabular-nums ${pass ? 'text-text' : 'text-crit-soft'}`}>
          {formatPct(percent)} <span className="text-muted">/ {formatPct(threshold)}</span>
        </span>
      </div>
      <div className="relative h-[9px] rounded-[5px] bg-surface-2">
        <div
          className={`absolute inset-y-0 left-0 rounded-[5px] ${FILL[severityOf(result)]}`}
          style={{ width: `${fillPct}%` }}
        />
        <div
          className="absolute -inset-y-[3px] w-0.5 bg-text-2/85"
          style={{ left: `calc(${markerPct}% - 2px)` }}
        />
      </div>
    </div>
  );
}
