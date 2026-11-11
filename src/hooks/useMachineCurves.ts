'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMachinesByBn } from '@/lib/api';
import { MAX_DETAIL_ROWS } from '@/lib/constants';
import { machineCar, machineDetail } from '@/lib/machines';
import type { Side } from '@/types/car';

/**
 * GET /api/machines/{bn} — ทุกคอลัมน์รายวินาทีของ bn (LH+RH) ใหม่สุดก่อน; ไม่พบ bn = 404
 * หน้ารายละเอียดและโหมดเปรียบเทียบใช้ query key เดียวกัน (แถวดิบ) แล้วแยกมุมมองด้วย `select` → ยิง API ครั้งเดียวต่อ bn
 */
const machineRowsOptions = (bn: number) => ({
  queryKey: ['machine-rows', bn] as const,
  queryFn: () => fetchMachinesByBn(bn),
  staleTime: 60_000,
  retry: false,
});

/** โหมดเปรียบเทียบ: รถจาก bn อย่างเดียว (หาฝั่งเอง) → meta + curve input; select ได้ null = ไม่มี bn นี้ในข้อมูล */
export const machineCarQueryOptions = (bn: number) => ({
  ...machineRowsOptions(bn),
  select: (rows: Awaited<ReturnType<typeof fetchMachinesByBn>>) => machineCar(rows, bn),
});

/** หน้ารายละเอียดรถ: ทุก signal ของฝั่งที่ระบุ (ไม่เกิน MAX_DETAIL_ROWS แถวล่าสุด); select ได้ null = ไม่มีแถวของ bn นี้ในฝั่งนั้น */
export const useMachineDetail = (bn: number, side: Side) =>
  useQuery({
    ...machineRowsOptions(bn),
    select: (rows) => machineDetail(rows, bn, side, MAX_DETAIL_ROWS),
  });
