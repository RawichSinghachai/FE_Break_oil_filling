import { create } from 'zustand';
import { MAX_COMPARE } from '@/lib/constants';
import type { Side } from '@/types/car';

/** real-time = ผลล่าสุดของแต่ละเครื่อง · compare = เลือก bn ย้อนหลังมาซ้อนทับเอง */
export type ReconMode = 'live' | 'compare';

/** backend ระบุรถด้วย bn (ฝั่ง/รุ่นมากับผลตรวจ) */
export interface CompareInput {
  bn: number;
}

export interface CompareSet extends CompareInput {
  id: number;
}

interface CompareState {
  mode: ReconMode;
  /** รายการเดียวรวมทุกฝั่ง (สูงสุด MAX_COMPARE) เริ่มจากว่าง */
  sets: CompareSet[];
  /** ใช้เฉพาะมุมมอง real-time */
  visibleSides: Record<Side, boolean>;
  showPredict: boolean;
  nextId: number;
  setMode: (mode: ReconMode) => void;
  addSet: (input: CompareInput) => void;
  updateSet: (id: number, input: CompareInput) => void;
  removeSet: (id: number) => void;
  toggleSide: (side: Side) => void;
  togglePredict: () => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  mode: 'live',
  sets: [],
  visibleSides: { LH: true, RH: true },
  showPredict: true,
  nextId: 1,

  setMode: (mode) => set({ mode }),

  addSet: (input) =>
    set((s) => {
      if (s.sets.length >= MAX_COMPARE) return s;
      return { sets: [...s.sets, { id: s.nextId, ...input }], nextId: s.nextId + 1 };
    }),

  updateSet: (id, input) =>
    set((s) => ({ sets: s.sets.map((c) => (c.id === id ? { ...c, ...input } : c)) })),

  removeSet: (id) => set((s) => ({ sets: s.sets.filter((c) => c.id !== id) })),

  // ห้ามปิดทั้งสองฝั่งพร้อมกัน
  toggleSide: (side) =>
    set((s) => {
      const other: Side = side === 'LH' ? 'RH' : 'LH';
      if (s.visibleSides[side] && !s.visibleSides[other]) return s;
      return { visibleSides: { ...s.visibleSides, [side]: !s.visibleSides[side] } };
    }),

  togglePredict: () => set((s) => ({ showPredict: !s.showPredict })),
}));
