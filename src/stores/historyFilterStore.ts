import { create } from 'zustand';
import { startOfDay, subDays } from 'date-fns';
import type { Side } from '@/types/car';
import { toDatetimeLocal } from '@/lib/format';

/** ผลตรวจ: '' = ทั้งหมด */
export type ResultFilter = '' | 'pass' | 'ng' | 'pending';

export type RangePreset = 'all' | 'today' | '7d' | 'custom';

export interface HistoryFilters {
  /** bn / asn เป็นตัวเลข (เก็บเป็นสตริงตามช่องกรอก) */
  bn: string;
  asn: string;
  pgnum: string;
  side: Side | '';
  result: ResultFilter;
  preset: RangePreset;
  /** ค่าของ <input type="datetime-local"> */
  from: string;
  to: string;
}

const INITIAL: HistoryFilters = {
  bn: '',
  asn: '',
  pgnum: '',
  side: '',
  result: '',
  preset: 'all',
  from: '',
  to: '',
};

interface HistoryFilterState {
  filters: HistoryFilters;
  page: number;
  setFilter: (patch: Partial<HistoryFilters>) => void;
  setPreset: (preset: Exclude<RangePreset, 'custom'>) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useHistoryFilterStore = create<HistoryFilterState>((set) => ({
  filters: INITIAL,
  page: 1,

  // เปลี่ยน filter แล้วกลับไปหน้า 1 เสมอ
  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch }, page: 1 })),

  setPreset: (preset) =>
    set((s) => {
      const now = new Date();
      // "ถึง" เว้นว่าง = ถึงปัจจุบันเสมอ (ไม่ล็อกเวลาตอนกดปุ่ม ไม่งั้นรถใหม่หลังจากนั้นไม่ขึ้นตาราง)
      const range =
        preset === 'all'
          ? { from: '', to: '' }
          : { from: toDatetimeLocal(preset === 'today' ? startOfDay(now) : subDays(now, 7)), to: '' };
      return { filters: { ...s.filters, ...range, preset }, page: 1 };
    }),

  setPage: (page) => set({ page }),
  reset: () => set({ filters: INITIAL, page: 1 }),
}));
