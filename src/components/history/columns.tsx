import { createColumnHelper } from '@tanstack/react-table';
import { formatShortDateTime } from '@/lib/format';
import type { MachineCar } from '@/types/car';
import { ResultCell } from './ResultCell';

const col = createColumnHelper<MachineCar>();

export const columns = [
  col.accessor('dt', { header: 'วันเวลา', cell: (c) => formatShortDateTime(c.getValue()) }),
  col.accessor('bn', { header: 'bn' }),
  col.accessor('asn', { header: 'asn', cell: (c) => c.getValue() ?? '—' }),
  col.accessor('pgnum', { header: 'pgnum' }),
  col.accessor('side', { header: 'ฝั่ง', cell: (c) => <span className="text-[11px] text-muted">{c.getValue()}</span> }),
  col.display({ id: 'result', header: 'ผล', cell: (c) => <ResultCell bn={c.row.original.bn} /> }),
];
