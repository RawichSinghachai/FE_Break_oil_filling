'use client';

import type { ReactNode } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { MAX_COMPARE } from '@/lib/constants';
import type { MachineCar } from '@/types/car';

export interface ChipEntry {
  id: number;
  bn: number;
  color: string;
  /** รถที่โหลดแล้ว (มี side/pgnum) */
  car: MachineCar | null;
  status: 'loading' | 'ok' | 'error';
}

interface CompareChipsProps {
  entries: ChipEntry[];
  editingId: number | null;
  onEdit: (id: number) => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
  children?: ReactNode;
}

export function CompareChips({ entries, editingId, onEdit, onRemove, onAdd, children }: CompareChipsProps) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-surface-2 px-3.5 py-[13px]">
      <div className="mb-2.5 flex items-center justify-between gap-2.5">
        <span className="text-[12px] font-semibold uppercase tracking-[0.3px] text-text-2">ชุดเปรียบเทียบ</span>
        <span className="text-[12px] tabular-nums text-muted">
          {entries.length} / {MAX_COMPARE} ชุด
        </span>
      </div>
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {entries.map((e, i) => (
          <span
            key={e.id}
            className={`inline-flex items-center gap-[9px] rounded-full border bg-surface py-1.5 pl-3 pr-2 text-[12px] text-text ${
              e.id === editingId ? 'border-s1 shadow-[inset_0_0_0_1px_var(--color-s1)]' : 'border-border'
            }`}
          >
            <span className="h-[3px] w-4 flex-none rounded-sm" style={{ background: e.color }} />
            <span>
              #{i + 1}{' '}
              <b className="font-[650]">{e.bn}</b>
              {e.car ? (
                <> · pg{e.car.pgnum} · {e.car.side}</>
              ) : (
                <span className="text-muted"> · {e.status === 'error' ? 'ไม่พบ' : 'กำลังโหลด…'}</span>
              )}
            </span>
            <button
              type="button"
              title="แก้ไขชุดนี้"
              aria-label={`แก้ไขชุด #${i + 1}`}
              onClick={() => onEdit(e.id)}
              className="px-0.5 text-muted hover:text-s1"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              title="เอาออก"
              aria-label={`เอาชุด #${i + 1} ออก`}
              onClick={() => onRemove(e.id)}
              className="px-0.5 text-muted hover:text-crit"
            >
              <X size={15} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={onAdd}
          disabled={entries.length >= MAX_COMPARE}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted px-[13px] py-[7px] text-[12px] font-semibold text-text-2 hover:border-s1 hover:text-white disabled:cursor-default disabled:opacity-40"
        >
          <Plus size={13} /> เพิ่มชุด
        </button>
      </div>
      {children}
    </div>
  );
}
