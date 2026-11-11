'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { fetchVerdictMap } from '@/hooks/useHistory';
import { downloadHistoryCsv } from '@/lib/csv';
import type { MachineCar } from '@/types/car';
import { Button } from '@/components/ui/Button';

interface ExportCsvButtonProps {
  cars: MachineCar[];
  /** ขอบเขตของรายการที่ export (ว่าง = ไม่ต้องแจ้ง) */
  note: string;
}

/**
 * export รายการที่แสดงอยู่ (หน้าปัจจุบัน / ที่โหลดแล้ว) — /api/machines มีข้อมูลหลักล้านแถว จึงไม่ดึงทั้งหมดเพื่อ export
 * คอลัมน์ result ได้จาก /api/predictions (bn ที่ไม่มีผล = pending)
 */
export function ExportCsvButton({ cars, note }: ExportCsvButtonProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const onClick = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const verdicts = await fetchVerdictMap();
      downloadHistoryCsv(cars.map((c) => ({ ...c, result: verdicts.get(c.bn)?.toLowerCase() ?? 'pending' })));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ml-auto flex items-center gap-2.5">
      {failed && <span className="text-[12px] text-crit-soft">Export ไม่สำเร็จ</span>}
      {note && <span className="text-[12px] text-muted">{note}</span>}
      <Button onClick={onClick} disabled={busy || cars.length === 0} className="inline-flex items-center gap-1.5">
        <Download size={14} /> {busy ? 'กำลังเตรียมไฟล์…' : 'Export CSV'}
      </Button>
    </div>
  );
}
