import type { FeatureResult } from '@/types/car';

/** สัดส่วนของ threshold ที่เริ่มเตือน (สีเหลือง) */
export const WARN_RATIO = 0.6;

export type Severity = 'good' | 'warn' | 'crit';

/** threshold และผ่าน/ไม่ผ่านมาจาก backend — frontend ไม่ตัดสินเอง */
export function severityOf(r: FeatureResult): Severity {
  if (!r.pass) return 'crit';
  return r.percent >= r.threshold * WARN_RATIO ? 'warn' : 'good';
}
