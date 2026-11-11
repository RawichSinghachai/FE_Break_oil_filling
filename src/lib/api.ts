import type { CarCurves, CarRecord, FeatureKey, FeatureResults } from '@/types/car';
import type {
  ApiMachineDetail,
  ApiMachinePage,
  ApiPrediction,
  ApiPredictionDetail,
  MachineParams,
  PredictionDetail,
  PredictionParams,
} from '@/types/api';
import { FEATURES, VACUUM_DISPLAY_MAX } from './constants';

/** ว่าง = same-origin (ผ่าน rewrites `/api/*` ใน next.config.ts) */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`${path} ${status}`);
  }
}

/** 404 จาก /api/predictions/{bn} = รถคันนี้ยังไม่มีผล predict */
export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;

async function getJson<T>(path: string, params: object = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const query = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`${API_URL}${path}${query}`);
  if (!res.ok) throw new ApiError(res.status, path);
  return res.json() as Promise<T>;
}

function toRecord(p: ApiPrediction): CarRecord {
  const features = Object.fromEntries(
    FEATURES.map((f) => {
      const { percent, threshold, pass } = p.features[f.apiKey];
      return [f.key, { percent, threshold, pass }];
    }),
  ) as FeatureResults;

  return {
    id: p.id,
    dt: p.predicted_at,
    bn: p.bn,
    asn: p.asn,
    pgnum: p.pgnum,
    side: p.side,
    features,
    verdict: p.overall_pass ? 'PASS' : 'NG',
  };
}

function toDetail(p: ApiPredictionDetail): PredictionDetail {
  const curves = Object.fromEntries(
    FEATURES.map((f) => {
      const column = p.features[f.apiKey].column;
      // vacuumgun: ค่าพุ่งเกินเพดานแสดงผลเป็นเพดาน (ผล % / threshold ยังเป็นของ backend)
      const cap = (a: number[]) => (f.key === 'vac' ? a.map((v) => Math.min(v, VACUUM_DISPLAY_MAX)) : a);
      return [f.key, { in: cap(p.input[column] ?? []), re: cap(p.recon[column] ?? []) }];
    }),
  ) as Record<FeatureKey, CarCurves[FeatureKey]>;
  return { record: toRecord(p), curves };
}

/** GET /api/predictions — ไม่ส่ง limit = ดึงทั้งหมดตาม filter (ใหม่สุดก่อน) */
export async function fetchPredictions(params: PredictionParams = {}): Promise<CarRecord[]> {
  return (await getJson<ApiPrediction[]>('/api/predictions', params)).map(toRecord);
}

/** GET /api/predictions/{bn} — ผลตรวจ + curve input/recon */
export async function fetchPredictionByBn(bn: number): Promise<PredictionDetail> {
  return toDetail(await getJson<ApiPredictionDetail>(`/api/predictions/${bn}`));
}

/** GET /api/machines — แถวรายวินาที ใหม่สุดก่อน + total (limit สูงสุด 1000, ไม่ส่ง = 50) */
export function fetchMachines(params: MachineParams = {}): Promise<ApiMachinePage> {
  return getJson<ApiMachinePage>('/api/machines', params);
}

/** GET /api/machines/{bn} — ทุกคอลัมน์ของ bn นั้น (LH+RH) ใหม่สุดก่อน ไม่จำกัดจำนวน; ไม่พบ = 404 */
export function fetchMachinesByBn(bn: number): Promise<ApiMachineDetail[]> {
  return getJson<ApiMachineDetail[]>(`/api/machines/${bn}`);
}
