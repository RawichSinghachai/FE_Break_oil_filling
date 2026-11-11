'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useHistory } from '@/hooks/useHistory';
import { useHistoryFilterStore } from '@/stores/historyFilterStore';
import type { MachineCar } from '@/types/car';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { columns } from './columns';
import { HistoryFilters } from './HistoryFilters';
import { Pagination } from './Pagination';

const EMPTY: MachineCar[] = [];

export function HistoryTable() {
  const page = useHistoryFilterStore((s) => s.page);
  const setPage = useHistoryFilterStore((s) => s.setPage);
  const h = useHistory();
  const router = useRouter();

  const { rows: pageRows, pageCount, more, loading, fetching, stale, isError, canLoadMore, loadMore } = h;
  const current = Math.min(page, pageCount);

  // จำนวนหน้าลดลง (เช่น กรอง/ข้อมูลเปลี่ยน) ขณะอยู่หน้าท้าย ๆ → ถอยมาหน้าสุดท้ายจริง
  useEffect(() => {
    if (!loading && !stale && page > pageCount) setPage(pageCount);
  }, [loading, stale, page, pageCount, setPage]);

  const busy = loading || fetching || stale;
  // ข้ามไปหน้าที่ยังไม่โหลด/เปลี่ยน filter → คงแถวล่าสุดไว้ (จางลง) จนกว่าข้อมูลใหม่มา แทนที่จะให้ตารางว่างกะพริบ
  const lastRows = useRef<MachineCar[]>(EMPTY);
  useEffect(() => {
    if (pageRows.length > 0) lastRows.current = pageRows;
  }, [pageRows]);
  const holding = pageRows.length === 0 && busy && lastRows.current.length > 0;
  const shownRows = holding ? lastRows.current : pageRows;

  const table = useReactTable({
    data: shownRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // แบ่งหน้าเองนอกตาราง — ไม่ให้ตาราง auto-reset state เมื่อ data เปลี่ยน
    autoResetPageIndex: false,
  });

  const noRows = shownRows.length === 0;

  return (
    <Card title="ประวัติรถ" hint={h.hint}>
      <HistoryFilters cars={h.exportCars} note={h.exportNote} />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="whitespace-nowrap border-b border-border px-2.5 py-[9px] text-left text-[12px] font-semibold uppercase tracking-[0.3px] text-muted"
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className={holding || stale ? 'pointer-events-none opacity-50 transition-opacity' : 'transition-opacity'}>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.original.key}
                title={`คลิกเพื่อดูสัญญาณทั้งหมดของเครื่องฝั่ง ${row.original.side}`}
                onClick={() => router.push(`/cars/${row.original.side}/${row.original.bn}`)}
                className="cursor-pointer hover:bg-surface-2"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap border-b border-border px-2.5 py-[9px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isError && <div className="py-[26px] text-center text-[13px] text-crit-soft">โหลดประวัติไม่สำเร็จ</div>}
      {!isError && noRows && busy && <div className="py-[26px] text-center text-[13px] text-muted">กำลังโหลด…</div>}
      {!isError && noRows && !busy && canLoadMore && (
        <div className="py-[26px] text-center text-[13px] text-muted">
          ยังไม่พบรายการที่ตรงเงื่อนไขในข้อมูลที่โหลดแล้ว ({h.exportCars.length} คัน)
          <div className="mt-2.5">
            <Button variant="ghost" onClick={loadMore}>
              โหลดเพิ่มแล้วค้นต่อ
            </Button>
          </div>
        </div>
      )}
      {!isError && noRows && !busy && !canLoadMore && !more && (
        <div className="py-[26px] text-center text-[13px] text-muted">
          ไม่พบข้อมูลตามเงื่อนไข
        </div>
      )}

      <Pagination
        page={current}
        pageCount={pageCount}
        more={more}
        summary={h.summary}
        onPage={setPage}
      />
    </Card>
  );
}
