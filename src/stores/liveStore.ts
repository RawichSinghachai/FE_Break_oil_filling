import { create } from 'zustand';
import { MAX_DETAIL_ROWS } from '@/lib/constants';
import type { Side } from '@/types/car';
import type { LiveBySide, LiveTrace, RealtimeCommon, RealtimeMessage, RealtimeSide, WsStatus } from '@/types/ws';

/**
 * จำนวนจุดสูงสุดต่อ trace — เท่ากับหน้ารายละเอียด/เปรียบเทียบ (MAX_DETAIL_ROWS)
 * เกินแล้วเลื่อนทิ้งจุดเก่า; trace ไม่ถูกล้างจนกว่าจะได้ bn ของรถคันใหม่
 */
const MAX_TRACE_POINTS = MAX_DETAIL_ROWS;

interface LiveState {
  wsStatus: WsStatus;
  /** ค่าปัจจุบันของเครื่องแต่ละฝั่งจาก WebSocket */
  live: LiveBySide;
  /** สถานะเครื่อง (continue / master_on / machine_fault) ใช้ร่วมทั้งสองฝั่ง */
  common: RealtimeCommon | null;
  /** ค่าสดที่สะสมของ bn ปัจจุบันในแต่ละฝั่ง — เปลี่ยน bn = เริ่มใหม่ */
  trace: Record<Side, LiveTrace | null>;
  /** epoch ms ของข้อความล่าสุดที่รับได้ */
  lastUpdate: number | null;
  setWsStatus: (status: WsStatus) => void;
  handleMessage: (msg: RealtimeMessage) => void;
}

function nextTrace(prev: LiveTrace | null, cur: RealtimeSide, recordedAt: string): LiveTrace | null {
  // bn เปลี่ยน (รถคันใหม่) → ทิ้งข้อมูลคันเก่า เริ่ม trace ใหม่
  if (!prev || prev.bn !== cur.bn) {
    return {
      bn: cur.bn,
      pgnum: cur.pgnum,
      recordedAt,
      pres: [cur.filling_pressure],
      vol: [cur.filling_volume],
      vac: [cur.vacuumgun],
    };
  }
  // backend ส่งข้อความซ้ำ (recorded_at เดิม) → ไม่นับเป็นจุดใหม่
  if (prev.recordedAt === recordedAt) return null;
  return {
    ...prev,
    pgnum: cur.pgnum,
    recordedAt,
    pres: [...prev.pres, cur.filling_pressure].slice(-MAX_TRACE_POINTS),
    vol: [...prev.vol, cur.filling_volume].slice(-MAX_TRACE_POINTS),
    vac: [...prev.vac, cur.vacuumgun].slice(-MAX_TRACE_POINTS),
  };
}

export const useLiveStore = create<LiveState>((set) => ({
  wsStatus: 'connecting',
  live: { LH: null, RH: null },
  trace: { LH: null, RH: null },
  common: null,
  lastUpdate: null,
  setWsStatus: (wsStatus) => set({ wsStatus }),
  handleMessage: (msg) =>
    set((s) => ({
      // ข้อความที่ขาดฝั่งใดฝั่งหนึ่ง = คงค่าเดิมของฝั่งนั้นไว้
      live: { LH: msg.lh ?? s.live.LH, RH: msg.rh ?? s.live.RH },
      trace: {
        LH: msg.lh ? (nextTrace(s.trace.LH, msg.lh, msg.recorded_at) ?? s.trace.LH) : s.trace.LH,
        RH: msg.rh ? (nextTrace(s.trace.RH, msg.rh, msg.recorded_at) ?? s.trace.RH) : s.trace.RH,
      },
      common: msg.common ?? s.common,
      lastUpdate: Date.now(),
    })),
}));
