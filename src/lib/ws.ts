import { VACUUM_DISPLAY_MAX } from '@/lib/constants';
import type { RealtimeCommon, RealtimeMessage, RealtimeSide } from '@/types/ws';

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function parseSide(v: unknown): RealtimeSide | null {
  if (!isObj(v)) return null;
  if (!isNum(v.bn) || !isNum(v.pgnum)) return null;
  if (!isNum(v.filling_pressure) || !isNum(v.filling_volume) || !isNum(v.vacuumgun)) return null;
  return {
    bn: v.bn,
    pgnum: v.pgnum,
    filling_pressure: v.filling_pressure,
    filling_volume: v.filling_volume,
    // ค่าพุ่งเกินเพดานแสดงผลเป็นเพดาน — ใช้ทั้งค่าสดในการ์ดและกราฟ real-time
    vacuumgun: Math.min(v.vacuumgun, VACUUM_DISPLAY_MAX),
  };
}

/** รับ boolean หรือ 0/1 (ค่าจาก PLC/DB อาจมาเป็นตัวเลข) */
function toBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v === 1;
  return null;
}

function parseCommon(v: unknown): RealtimeCommon | null {
  if (!isObj(v)) return null;
  const cont = toBool(v.continue);
  const masterOn = toBool(v.master_on);
  const fault = toBool(v.machine_fault);
  if (cont === null || masterOn === null || fault === null) return null;
  return { continue: cont, master_on: masterOn, machine_fault: fault };
}

/** parse + validate ข้อความจาก WebSocket — คืน null ถ้าไม่ใช่ message ที่รู้จัก */
export function parseRealtimeMessage(raw: unknown): RealtimeMessage | null {
  if (typeof raw !== 'string') return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(data) || typeof data.recorded_at !== 'string') return null;
  const lh = parseSide(data.lh);
  const rh = parseSide(data.rh);
  if (!lh && !rh) return null;
  return { recorded_at: data.recorded_at, lh, rh, common: parseCommon(data.common) };
}
