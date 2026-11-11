import type { CarCurves, CarRecord, Side } from './car';

// REST contract ของ backend (FastAPI — ดู http://localhost:8001/docs)
//   GET /api/predictions?side&pgnum&bn&asn&overall_pass&dt_from&dt_to&limit&offset -> ApiPrediction[]
//   GET /api/predictions/{bn}                                                       -> ApiPredictionDetail (404 = ยังไม่มีผล)
//   GET /api/machines?side&pgnum&bn&asn&dt_from&dt_to&limit(1-1000, default 50)&offset -> ApiMachinePage (items รายวินาที ใหม่สุดก่อน + total/total_pages)
//   WS  /api/ws/realtime                                                            -> RealtimeMessage (types/ws.ts)

export interface ApiFeature {
  mae: number;
  pass: boolean;
  /** ชื่อ column ใน input/recon เช่น lh_fillingvolume */
  column: string;
  /** % diff */
  percent: number;
  threshold: number;
  input_value: number;
  recon_value: number;
}

export interface ApiPrediction {
  id: number;
  side: Side;
  pgnum: number;
  bn: number;
  asn: number | null;
  /** ISO 8601 */
  predicted_at: string;
  /** จำนวนจุดของ curve */
  length: number;
  overall_pass: boolean;
  features: { volume: ApiFeature; pressure: ApiFeature; vacuumgun: ApiFeature };
}

/** /api/predictions/{bn} = ApiPrediction + curve ดิบ (key = ชื่อ column) */
export interface ApiPredictionDetail extends ApiPrediction {
  input: Record<string, number[]>;
  recon: Record<string, number[]>;
}

/** ไม่ส่ง limit = ดึงทั้งหมด (frontend แบ่งหน้าเอง) */
export interface PredictionParams {
  side?: Side;
  pgnum?: number;
  bn?: number;
  asn?: number;
  /** true = ผ่าน, false = NG */
  overall_pass?: boolean;
  /** ISO 8601 */
  dt_from?: string;
  dt_to?: string;
  limit?: number;
  offset?: number;
}

/** 1 แถวของ /api/machines = ค่าดิบของเครื่อง 1 ฝั่ง ณ 1 วินาที */
export interface ApiMachine {
  id: number;
  side: Side;
  pgnum: number;
  bn: number;
  asn: number | null;
  filling_pressure: number;
  filling_volume: number;
  vacuumgun: number;
  /** ISO 8601 */
  recorded_at: string;
}

/** GET /api/machines — แบ่งหน้าตามจำนวน "แถว" (ไม่ใช่จำนวนรถ) */
export interface ApiMachinePage {
  items: ApiMachine[];
  /** จำนวนแถวทั้งหมดตาม filter */
  total: number;
  limit: number;
  offset: number;
  page: number;
  total_pages: number;
}

export interface MachineParams {
  side?: Side;
  pgnum?: number;
  bn?: number;
  asn?: number;
  /** ISO 8601 */
  dt_from?: string;
  dt_to?: string;
  limit?: number;
  offset?: number;
}

export interface PredictionDetail {
  record: CarRecord;
  curves: CarCurves;
}

export interface NgByPgnumRow {
  pgnum: string;
  LH: number;
  RH: number;
}

type SideColumns<P extends 'lh' | 'rh'> = {
  [K in `${P}_${'asn' | 'bn' | 'pgnum' | 'fillingpressure' | 'fillingvolume' | 'vacuumgun' | 'vacuumpump' | 'pumpvacuumcurrent' | 'stepnum'}`]: number | null;
};

/**
 * 1 แถวของ GET /api/machines/{bn} = ทุกคอลัมน์ของตาราง machine ณ 1 วินาที (ทั้ง LH และ RH)
 * คอลัมน์ pump*current ที่ไม่มี prefix ใช้ร่วมกันทั้งสองฝั่ง; ยังมี l0–l6 (ข้อมูลสถานที่) ที่ไม่ได้ใช้
 */
export type ApiMachineDetail = SideColumns<'lh'> &
  SideColumns<'rh'> & {
    id: number;
    continue: boolean;
    master_on: boolean;
    machine_fault: boolean;
    pumpdegassingcurrent: number | null;
    pumpsupplycurrent: number | null;
    pumpfillingcurrent: number | null;
    /** ISO 8601 */
    recorded_at: string;
  };
