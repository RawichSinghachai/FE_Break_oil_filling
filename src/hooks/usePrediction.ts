'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError, fetchPredictionByBn, isNotFound } from '@/lib/api';
import { POLL_PREDICTION_MS } from '@/lib/constants';

/** ผลตรวจที่จบแล้วไม่เปลี่ยน → cache นาน; 404 (ยังไม่มีผล/ไม่มี bn) ไม่ retry */
export const predictionQueryOptions = (bn: number) => ({
  queryKey: ['prediction', bn] as const,
  queryFn: () => fetchPredictionByBn(bn),
  staleTime: 5 * 60_000,
  retry: false,
});

/** ผลตรวจ + curve ของ bn เดียว — ส่ง null เพื่อปิด query */
export function usePredictionDetail(bn: number | null) {
  return useQuery({
    ...predictionQueryOptions(bn ?? 0),
    enabled: bn !== null,
  });
}

/**
 * ผลตรวจของ bn ที่กำลังวิ่งอยู่ — backend ตอบ 404 จนกว่า cycle จะจบและ predict เสร็จ
 * จึง poll ซ้ำจนได้ผล (ได้แล้วหยุด) ; `pending` = ยังรอผล (404 ไม่นับเป็น error)
 */
export function useLivePrediction(bn: number | null) {
  const query = useQuery({
    ...predictionQueryOptions(bn ?? 0),
    enabled: bn !== null,
    refetchInterval: (q) => (q.state.data ? false : POLL_PREDICTION_MS),
  });
  const notFound = query.error instanceof ApiError && query.error.status === 404;
  return {
    detail: query.data,
    pending: !query.data && (query.isPending || notFound),
    isError: !!query.error && !notFound,
  };
}

export type PredictionStatus = 'loading' | 'pass' | 'ng' | 'pending' | 'error';

/**
 * สถานะผลของ bn จาก GET /api/predictions/{bn}: 404 = ยังไม่มีผล (pending)
 * ที่ยัง pending จะถามซ้ำทุก 10 วินาที เผื่อ predict เสร็จทีหลัง
 */
export function usePredictionStatus(bn: number): PredictionStatus {
  const q = useQuery({
    ...predictionQueryOptions(bn),
    refetchInterval: (query) => (isNotFound(query.state.error) ? 10_000 : false),
  });
  if (q.data) return q.data.record.verdict === 'PASS' ? 'pass' : 'ng';
  if (isNotFound(q.error)) return 'pending';
  return q.isError ? 'error' : 'loading';
}
