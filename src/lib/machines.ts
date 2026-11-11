import { MAX_DETAIL_ROWS, VACUUM_DISPLAY_MAX } from './constants';
import type { ApiMachine, ApiMachineDetail } from '@/types/api';
import type { CarCurves, CurveSet, FeatureKey, MachineCar, Side } from '@/types/car';

/**
 * รวมแถวรายวินาที (ใหม่สุดก่อน) เป็นรถ 1 คัน = (side, bn)
 * ใช้แถวที่เจอก่อน = เวลาล่าสุดของคัน → ไม่เปลี่ยนแม้โหลดแถวเก่าเพิ่ม และเรียงใหม่สุดก่อนเหมือนเดิม
 * `from` = ข้ามรถที่เจอครั้งแรกก่อน index นี้ (แถวที่ดึงทับซ้อนจากหน้าก่อน — รถนั้นเป็นของหน้าก่อน)
 */
export function groupCars(rows: ApiMachine[], from = 0): MachineCar[] {
  const seen = new Set<string>();
  const cars: MachineCar[] = [];
  rows.forEach((r, i) => {
    const key = `${r.side}-${r.bn}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (i >= from) cars.push({ key, bn: r.bn, asn: r.asn, pgnum: r.pgnum, side: r.side, dt: r.recorded_at });
  });
  return cars;
}

export interface Signal {
  /** ชื่อ signal (ต่อท้ายด้วยชื่อฝั่ง เช่น LH_FillingPressure) */
  name: string;
  /** คอลัมน์ใน /api/machines/{bn}; `{s}` = lh/rh, ไม่มี = ใช้ร่วมสองฝั่ง */
  column: string;
  /** มีผล predict (3 ฟีเจอร์ของโมเดล); ไม่มี = ข้อมูลดิบ */
  feature?: FeatureKey;
  /** ค่าที่เกินนี้แสดงผลเป็นค่านี้ (ค่าพุ่ง) */
  max?: number;
}

/** 9 signal ของหน้ารายละเอียดรถ (ตาม dashboard.html) */
export const SIGNALS: readonly Signal[] = [
  { name: 'FillingPressure', column: '{s}_fillingpressure', feature: 'pres' },
  { name: 'FillingVolume', column: '{s}_fillingvolume', feature: 'vol' },
  { name: 'VacuumGun', column: '{s}_vacuumgun', feature: 'vac', max: VACUUM_DISPLAY_MAX },
  { name: 'VacuumPump', column: '{s}_vacuumpump', max: VACUUM_DISPLAY_MAX },
  { name: 'PumpVacuumCurrent', column: '{s}_pumpvacuumcurrent' },
  { name: 'PumpDegassingCurrent', column: 'pumpdegassingcurrent' },
  { name: 'PumpSupplyCurrent', column: 'pumpsupplycurrent' },
  { name: 'PumpFillingCurrent', column: 'pumpfillingcurrent' },
  { name: 'StepNum', column: '{s}_stepnum' },
];

export interface MachineDetail {
  /** เวลาล่าสุดของ bn นี้ */
  dt: string;
  asn: number | null;
  pgnum: number;
  /** ค่าดิบ (เก่า→ใหม่) ต่อชื่อ signal — ไม่เกิน `limit` แถว (ถ้าระบุ) */
  series: Record<string, number[]>;
  /** จำนวนแถวทั้งหมดของ bn นี้ก่อนตัด */
  totalRows: number;
}

/**
 * แถวของ /api/machines/{bn} (ใหม่สุดก่อน) → meta + series ของฝั่งที่ต้องการ
 * เก็บเฉพาะแถวที่ `{side}_bn` ตรงกับ bn; ไม่มีแถว = null (ไม่พบรถคันนี้ในฝั่งนั้น)
 */
export function machineDetail(
  rows: ApiMachineDetail[],
  bn: number,
  side: Side,
  /** เกินจำนวนนี้ → เก็บเฉพาะแถวล่าสุด */
  limit?: number,
): MachineDetail | null {
  const prefix = side.toLowerCase();
  const get = (r: ApiMachineDetail, col: string) => (r as Record<string, unknown>)[col.replace('{s}', prefix)];
  const all = rows.filter((r) => get(r, '{s}_bn') === bn);
  if (all.length === 0) return null;
  // rows ใหม่สุดก่อน → slice หน้า = แถวล่าสุด
  const mine = limit !== undefined ? all.slice(0, limit) : all;

  const chrono = [...mine].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const latest = mine[0];
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
  return {
    dt: latest.recorded_at,
    asn: (get(latest, '{s}_asn') as number | null) ?? null,
    pgnum: num(get(latest, '{s}_pgnum')),
    series: Object.fromEntries(
      SIGNALS.map((s) => [
        s.name,
        chrono.map((r) => {
          const v = num(get(r, s.column));
          return s.max === undefined ? v : Math.min(v, s.max);
        }),
      ]),
    ),
    totalRows: all.length,
  };
}

/**
 * รถ 1 คันจาก bn อย่างเดียว (โหมดเปรียบเทียบ): หาฝั่งจากแถวล่าสุดที่ `lh_bn`/`rh_bn` ตรงกับ bn
 * → meta + curve input 3 ฟีเจอร์ (ไม่มี recon); ไม่พบ = null
 */
export function machineCar(rows: ApiMachineDetail[], bn: number): { car: MachineCar; curves: CarCurves } | null {
  const first = rows.find((r) => r.lh_bn === bn || r.rh_bn === bn);
  if (!first) return null;
  const side: Side = first.lh_bn === bn ? 'LH' : 'RH';
  const d = machineDetail(rows, bn, side, MAX_DETAIL_ROWS);
  if (!d) return null;
  const curve = (name: string) => ({ in: d.series[name], re: [] });
  return {
    car: { key: `${side}-${bn}`, bn, asn: d.asn, pgnum: d.pgnum, side, dt: d.dt },
    curves: { pres: curve('FillingPressure'), vol: curve('FillingVolume'), vac: curve('VacuumGun') },
  };
}

/** เก็บเฉพาะ `n` จุดล่าสุดของ input/recon (ความยาวเท่ากัน → ยังตรงกัน) — กราฟไม่ยาวเกิน MAX_DETAIL_ROWS */
export const tailCurve = (c: CurveSet, n: number = MAX_DETAIL_ROWS): CurveSet => ({
  in: c.in.slice(-n),
  re: c.re.slice(-n),
});
