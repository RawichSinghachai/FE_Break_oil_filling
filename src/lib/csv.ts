import Papa from 'papaparse';
import { format } from 'date-fns';
import type { MachineCar } from '@/types/car';
import { formatCsvDateTime } from './format';

const HEADER = ['datetime', 'bn', 'asn', 'pgnum', 'side', 'result'];

/** result = pass | ng | pending */
export type CsvRow = MachineCar & { result: string };

/** export รายการที่ filter แล้ว — ใส่ BOM ให้ Excel อ่านไทยได้ */
export function downloadHistoryCsv(rows: CsvRow[]) {
  const data = rows.map((r) => [formatCsvDateTime(r.dt), r.bn, r.asn ?? '', r.pgnum, r.side, r.result]);
  const csv = '\uFEFF' + Papa.unparse({ fields: HEADER, data }, { newline: '\r\n' });
  const filename = `brake_oil_history_${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`;

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
