interface PaginationProps {
  page: number;
  pageCount: number;
  /** true = ยังมีข้อมูลที่ไม่ได้โหลด (pageCount เป็นค่าต่ำสุดรวมหน้าสมมติ +1 → ไม่รู้หน้าสุดท้าย) */
  more?: boolean;
  /** ข้อความสรุปด้านซ้าย */
  summary: string;
  onPage: (page: number) => void;
}

/** ≤ 7 หน้าแสดงครบ; มากกว่านั้น: 1 … (cur-1) cur (cur+1) … N */
function pageItems(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  let lo = Math.max(2, page - 1);
  let hi = Math.min(count - 1, page + 1);
  if (page <= 3) [lo, hi] = [2, 4];
  if (page >= count - 2) [lo, hi] = [count - 3, count - 1];
  const out: (number | 'gap')[] = [1];
  if (lo > 2) out.push('gap');
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < count - 1) out.push('gap');
  out.push(count);
  return out;
}

const BTN =
  'rounded-lg border border-border bg-surface-2 px-3 py-[7px] text-[12px] text-text-2 enabled:hover:border-muted disabled:cursor-default disabled:opacity-40';

export function Pagination({ page, pageCount, more = false, summary, onPage }: PaginationProps) {
  // หน้าสุดท้าย "ที่รู้แน่" — ถ้ายังมีข้อมูลเหลือ pageCount รวมหน้าสมมติ 1 หน้า
  const knownPages = more ? pageCount - 1 : pageCount;

  return (
    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
      <span className="text-[12px] tabular-nums text-muted">{summary}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" title="หน้าแรก" className={BTN} disabled={page <= 1} onClick={() => onPage(1)}>
          ⏮
        </button>
        <button type="button" className={BTN} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ◀ ก่อนหน้า
        </button>
        <span className="flex items-center gap-1">
          {pageItems(page, pageCount).map((it, i) =>
            it === 'gap' ? (
              <span key={`gap${i}`} className="min-w-[18px] text-center text-[12px] text-muted">
                …
              </span>
            ) : (
              <button
                key={it}
                type="button"
                aria-current={it === page ? 'page' : undefined}
                onClick={() => onPage(it)}
                className="inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface-2 text-[12px] tabular-nums text-text-2 hover:border-muted aria-[current=page]:border-s1/55 aria-[current=page]:bg-s1/18 aria-[current=page]:text-white"
              >
                {it}
              </button>
            ),
          )}
        </span>
        <button type="button" className={BTN} disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          ถัดไป ▶
        </button>
        <button
          type="button"
          title={more ? 'ยังไม่ทราบหน้าสุดท้าย (กำลังกรองด้วยผล)' : 'หน้าสุดท้าย'}
          className={BTN}
          disabled={more || page >= pageCount}
          onClick={() => onPage(pageCount)}
        >
          ⏭
        </button>
        <span className="ml-1.5 flex items-center gap-1.5 text-[12px] text-muted">
          ไปหน้า
          <select
            aria-label="ไปหน้า"
            className="ctl !h-[30px] !min-w-16 !py-1 !pl-2.5 !pr-7 tabular-nums"
            value={page}
            onChange={(e) => onPage(Number(e.target.value))}
          >
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          / {knownPages}
          {more ? '+' : ''}
        </span>
      </div>
    </div>
  );
}
