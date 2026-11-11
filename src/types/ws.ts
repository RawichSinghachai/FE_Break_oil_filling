import type { Side } from './car';

// WS /api/ws/realtime — backend ส่งค่าดิบของทั้งสองเครื่องทุก ~1.5 วินาที

/** ค่าปัจจุบันของเครื่อง 1 ฝั่ง */
export interface RealtimeSide {
  bn: number;
  pgnum: number;
  filling_pressure: number;
  filling_volume: number;
  vacuumgun: number;
}

/** สถานะเครื่องที่ใช้ร่วมกันทั้ง LH/RH */
export interface RealtimeCommon {
  continue: boolean;
  master_on: boolean;
  machine_fault: boolean;
}

export interface RealtimeMessage {
  /** ISO 8601 */
  recorded_at: string;
  common?: RealtimeCommon | null;
  lh?: RealtimeSide | null;
  rh?: RealtimeSide | null;
}

export type LiveBySide = Record<Side, RealtimeSide | null>;

/** ค่าสดที่สะสมของรถ 1 คัน (bn) ในเครื่อง 1 ฝั่ง — 1 จุดต่อ 1 ข้อความ WebSocket */
export interface LiveTrace {
  bn: number;
  pgnum: number;
  /** recorded_at ของจุดล่าสุด (ไว้กันข้อความซ้ำ) */
  recordedAt: string;
  pres: number[];
  vol: number[];
  vac: number[];
}

export type WsStatus = 'connecting' | 'open' | 'reconnecting' | 'disabled';
