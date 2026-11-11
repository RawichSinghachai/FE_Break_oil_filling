'use client';

import { useRecentPredictions } from '@/hooks/useRecentPredictions';
import { formatClock } from '@/lib/format';
import { useLiveStore } from '@/stores/liveStore';
import type { WsStatus } from '@/types/ws';
import { Chip, type DotTone } from '@/components/ui/Chip';

const WS_CHIP: Record<WsStatus, { tone: DotTone; label: string }> = {
  open: { tone: 'ok', label: 'Real-time เชื่อมต่อแล้ว' },
  connecting: { tone: 'warn', label: 'กำลังเชื่อมต่อ…' },
  reconnecting: { tone: 'warn', label: 'ขาดการเชื่อมต่อ — กำลังต่อใหม่' },
  disabled: { tone: 'bad', label: 'ไม่ได้ตั้งค่า WebSocket' },
};

export function TopBar() {
  const wsStatus = useLiveStore((s) => s.wsStatus);
  const lastUpdate = useLiveStore((s) => s.lastUpdate);
  const { isError, isSuccess } = useRecentPredictions();
  const ws = WS_CHIP[wsStatus];
  const apiTone: DotTone = isError ? 'bad' : isSuccess ? 'ok' : 'warn';

  return (
    <header className="mb-4 flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface px-[18px] py-3.5">
      <div>
        <h1 className="m-0 text-[16px] font-[650] tracking-[0.2px]">
          Brake Oil Filling — ระบบตรวจจับความผิดปกติ
        </h1>
        <div className="text-[12px] text-muted">
          LSTM Autoencoder · ตรวจท้ายทุก cycle · อัปเดตล่าสุด {lastUpdate ? formatClock(lastUpdate) : '—'}
        </div>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        <Chip dot={ws.tone}>{ws.label}</Chip>
        <Chip dot={apiTone}>{isError ? 'API ไม่ตอบสนอง' : 'API'}</Chip>
      </div>
    </header>
  );
}
