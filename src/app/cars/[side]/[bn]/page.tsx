import { notFound } from 'next/navigation';
import { CarPage } from '@/components/car-page/CarPage';
import type { Side } from '@/types/car';

interface PageProps {
  params: Promise<{ side: string; bn: string }>;
}

export const metadata = { title: 'รายละเอียดรถ — Brake Oil Filling' };

/** หน้าเต็มของรถ 1 คัน (1 ฝั่ง): /cars/LH/2151 */
export default async function CarRoute({ params }: PageProps) {
  const { side, bn } = await params;
  const upper = side.toUpperCase();
  if ((upper !== 'LH' && upper !== 'RH') || !/^\d+$/.test(bn)) notFound();
  return <CarPage side={upper as Side} bn={Number(bn)} />;
}
