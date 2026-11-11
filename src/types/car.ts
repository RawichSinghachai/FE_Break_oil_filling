export type Side = 'LH' | 'RH';
export type Verdict = 'PASS' | 'NG';
export type FeatureKey = 'pres' | 'vol' | 'vac';

/** ผลของ 1 ฟีเจอร์จาก backend: % diff เทียบ reconstruction, threshold, และผ่าน/ไม่ผ่าน */
export interface FeatureResult {
  percent: number;
  threshold: number;
  pass: boolean;
}

export type FeatureResults = Record<FeatureKey, FeatureResult>;

export interface FeatureConfig {
  key: FeatureKey;
  /** ชื่อที่แสดงในกราฟ / ตาราง */
  name: string;
  /** ชื่อ field จริงจากเครื่อง */
  rawName: string;
  /** key ใน `features` ของ response (/api/predictions) */
  apiKey: 'pressure' | 'volume' | 'vacuumgun';
}

/** curve ของ 1 ฟีเจอร์: in = ค่าจริง, re = ค่าที่โมเดล reconstruct (1 จุด ≈ 1 วินาที) */
export interface CurveSet {
  in: number[];
  re: number[];
}

export type CarCurves = Record<FeatureKey, CurveSet>;

/** ผลตรวจ 1 รายการ (1 แถวใน /api/predictions) */
export interface CarRecord {
  id: number;
  /** ISO 8601 (predicted_at) */
  dt: string;
  bn: number;
  /** backend ยังไม่มี asn สำหรับบางรายการ */
  asn: number | null;
  pgnum: number;
  side: Side;
  features: FeatureResults;
  verdict: Verdict;
}

/** รถ 1 คัน (side+bn) ในตารางประวัติ — รวมจากแถวรายวินาทีของ /api/machines */
export interface MachineCar {
  key: string;
  bn: number;
  asn: number | null;
  pgnum: number;
  side: Side;
  /** ISO 8601 — เวลาของแถวล่าสุดของคันนี้ (ปลาย cycle) */
  dt: string;
}
