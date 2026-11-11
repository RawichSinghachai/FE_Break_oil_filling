'use client';

import { useEffect, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { parseRealtimeMessage, resolveWsUrl } from '@/lib/ws';
import { useLiveStore } from '@/stores/liveStore';

/** จุดเดียวที่คุยกับ WebSocket (/api/ws/realtime) — ส่ง message เข้า liveStore, component อื่นอ่านจาก store */
export function useLiveStream() {
  const handleMessage = useLiveStore((s) => s.handleMessage);
  const setWsStatus = useLiveStore((s) => s.setWsStatus);
  const hasOpened = useRef(false);
  // หาหลัง mount (ต้องรู้ location ของเบราว์เซอร์) — SSR / render แรก = null ยังไม่ต่อ
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  useEffect(() => setWsUrl(resolveWsUrl() || null), []);

  // backend push เองทุก ~1.5 วินาที จึงไม่ต้องใช้ heartbeat (ping/pong)
  const { readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      hasOpened.current = true;
    },
    onMessage: (e) => {
      const msg = parseRealtimeMessage(e.data);
      if (msg) handleMessage(msg);
    },
    shouldReconnect: () => true,
    reconnectAttempts: Number.MAX_SAFE_INTEGER,
    reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
  });

  useEffect(() => {
    if (!wsUrl) setWsStatus('connecting');
    else if (readyState === ReadyState.OPEN) setWsStatus('open');
    else setWsStatus(hasOpened.current ? 'reconnecting' : 'connecting');
  }, [wsUrl, readyState, setWsStatus]);
}
