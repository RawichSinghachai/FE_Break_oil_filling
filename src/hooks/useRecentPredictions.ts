'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, subDays } from 'date-fns';
import { fetchPredictions } from '@/lib/api';
import { NG_DAYS, POLL_RECENT_MS } from '@/lib/constants';
import type { CarRecord } from '@/types/car';
import type { NgByPgnumRow } from '@/types/api';

/**
 * ผลตรวจ NG_DAYS วันล่าสุด (รวมวันนี้) — query เดียวใช้ร่วมกันทั้ง KPI, กราฟ NG แยกรุ่น และตัวเลือก pgnum
 * backend ไม่มี endpoint สรุป จึงคำนวณฝั่ง frontend
 */
export function useRecentPredictions<T = CarRecord[]>(select?: (rows: CarRecord[]) => T) {
  const day = format(new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['predictions', 'recent', day],
    queryFn: () => fetchPredictions({ dt_from: startOfDay(subDays(new Date(), NG_DAYS - 1)).toISOString() }),
    refetchInterval: POLL_RECENT_MS,
    select,
  });
}

export interface Kpi {
  carsToday: number;
  carsYesterday: number;
  /** เปอร์เซ็นต์ เช่น 98.3 */
  passRate: number;
  passRatePrev: number;
  ngToday: number;
  ngYesterday: number;
  latest: CarRecord | null;
}

const passRateOf = (rows: CarRecord[]) =>
  rows.length ? (rows.filter((r) => r.verdict === 'PASS').length / rows.length) * 100 : 0;

export function computeKpi(rows: CarRecord[]): Kpi {
  const todayStart = startOfDay(new Date()).getTime();
  const yesterdayStart = startOfDay(subDays(new Date(), 1)).getTime();
  const at = (r: CarRecord) => new Date(r.dt).getTime();
  const today = rows.filter((r) => at(r) >= todayStart);
  const yesterday = rows.filter((r) => at(r) >= yesterdayStart && at(r) < todayStart);
  const latest = rows.reduce<CarRecord | null>((m, r) => (!m || at(r) > at(m) ? r : m), null);

  return {
    carsToday: today.length,
    carsYesterday: yesterday.length,
    passRate: passRateOf(today),
    passRatePrev: passRateOf(yesterday),
    ngToday: today.filter((r) => r.verdict === 'NG').length,
    ngYesterday: yesterday.filter((r) => r.verdict === 'NG').length,
    latest,
  };
}

export function computeNgByPgnum(rows: CarRecord[]): NgByPgnumRow[] {
  const byPg = new Map<number, NgByPgnumRow>();
  for (const r of [...rows].sort((a, b) => a.pgnum - b.pgnum)) {
    const row = byPg.get(r.pgnum) ?? { pgnum: String(r.pgnum), LH: 0, RH: 0 };
    if (r.verdict === 'NG') row[r.side] += 1;
    byPg.set(r.pgnum, row);
  }
  return [...byPg.values()];
}

export const useKpi = () => useRecentPredictions(computeKpi);
export const useNgByPgnum = () => useRecentPredictions(computeNgByPgnum);

/** pgnum ที่พบในผลตรวจช่วงล่าสุด (เรียงน้อย→มาก) ไว้เป็นตัวเลือกของตัวกรอง pgnum */
export const computePgnums = (rows: CarRecord[]) => [...new Set(rows.map((r) => r.pgnum))].sort((a, b) => a - b);
export const usePgnumOptions = () => useRecentPredictions(computePgnums);
