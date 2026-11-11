'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { machineCarQueryOptions } from '@/hooks/useMachineCurves';
import { COLORS, MAX_COMPARE } from '@/lib/constants';
import { useCompareStore } from '@/stores/compareStore';
import { CompareChips, type ChipEntry } from './CompareChips';
import { CompareForm } from './CompareForm';
import { ReconRow, type LoadedSeries } from './ReconRow';

type FormState = { mode: 'add' } | { mode: 'edit'; id: number } | null;

/**
 * มุมมองเปรียบเทียบย้อนหลัง: รายการเดียวรวมทุกฝั่ง ซ้อนได้สูงสุด MAX_COMPARE ชุด
 * ข้อมูลมาจาก GET /api/machines/{bn} (ค่า input รายวินาที; ไม่พบ bn = ตอบ 404 หรือไม่มีแถว) — ไม่มีเส้น predict
 */
export function ComparePanel() {
  const sets = useCompareStore((s) => s.sets);
  const addSet = useCompareStore((s) => s.addSet);
  const updateSet = useCompareStore((s) => s.updateSet);
  const removeSet = useCompareStore((s) => s.removeSet);
  const [form, setForm] = useState<FormState>(null);

  const results = useQueries({ queries: sets.map((c) => machineCarQueryOptions(c.bn)) });

  const entries: ChipEntry[] = sets.map((c, i) => {
    const r = results[i];
    return {
      id: c.id,
      bn: c.bn,
      color: COLORS.series[i % COLORS.series.length],
      car: r?.data?.car ?? null,
      status: r?.isError || r?.data === null ? 'error' : r?.data ? 'ok' : 'loading',
    };
  });

  const loaded: LoadedSeries[] = entries.flatMap((e, i) => {
    const d = results[i]?.data;
    return d ? [{ id: e.id, label: `${e.bn} ${d.car.side}`, color: e.color, curves: d.curves }] : [];
  });
  const failed = entries.filter((e) => e.status === 'error');
  const loading = entries.some((e) => e.status === 'loading');

  const editing = form?.mode === 'edit' ? sets.find((c) => c.id === form.id) : undefined;
  const editingIndex = editing ? sets.indexOf(editing) + 1 : 0;

  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="text-[14px] font-[650]">เปรียบเทียบย้อนหลัง</span>
        <span className="text-[12px] tabular-nums text-muted">
          {sets.length} / {MAX_COMPARE} ชุด
        </span>
      </div>

      <CompareChips
        entries={entries}
        editingId={form?.mode === 'edit' ? form.id : null}
        onEdit={(id) => setForm({ mode: 'edit', id })}
        onRemove={(id) => {
          removeSet(id);
          if (form?.mode === 'edit' && form.id === id) setForm(null);
        }}
        onAdd={() => setForm({ mode: 'add' })}
      >
        {form && (
          <CompareForm
            key={form.mode === 'edit' ? form.id : 'add'}
            title={form.mode === 'add' ? 'เพิ่มชุดใหม่' : `แก้ไขชุด #${editingIndex}`}
            confirmLabel={form.mode === 'add' ? 'เพิ่มชุดนี้' : 'บันทึก'}
            initial={editing ?? { bn: 0 }}
            onConfirm={(input) => {
              if (form.mode === 'edit') updateSet(form.id, input);
              else addSet(input);
              setForm(null);
            }}
            onCancel={() => setForm(null)}
          />
        )}
      </CompareChips>

      {failed.length > 0 && (
        <div className="mb-2.5 text-[12px] text-crit-soft">ไม่พบข้อมูลของ bn: {failed.map((e) => e.bn).join(', ')}</div>
      )}

      {sets.length === 0 ? (
        <div className="pb-1.5 pt-3.5 text-[12px] text-muted">
          ยังไม่มีชุดข้อมูล — กด &quot;+ เพิ่มชุด&quot; แล้วใส่ bn เพื่อเปรียบเทียบ (ซ้อนได้สูงสุด {MAX_COMPARE} ชุด)
        </div>
      ) : loaded.length === 0 ? (
        <div className="pb-1.5 pt-3.5 text-[12px] text-muted">{loading ? 'กำลังโหลด curve…' : 'ไม่มีข้อมูลให้แสดง'}</div>
      ) : (
        <ReconRow series={loaded} showPredict={false} />
      )}
    </div>
  );
}
