# Brake Oil Filling — Anomaly Dashboard (Next.js Frontend)

สร้าง frontend dashboard ด้วย **Next.js (App Router, TypeScript)** จาก mockup:
https://claude.ai/artifact/TZGnqi5VPomUjhVYSxX6uJ

**ขอบเขต:** front end อย่างเดียว — ไม่ต้องทำ backend / DB / MQTT

---

## 1. ติดตั้ง library

```bash
npm i zustand @tanstack/react-query @tanstack/react-table recharts \
  react-use-websocket @radix-ui/react-dialog lucide-react date-fns papaparse
npm i -D tailwindcss @tailwindcss/postcss @types/papaparse
```

## 2. หน้าที่ของแต่ละ library

| Library | ใช้ทำอะไร |
|---|---|
| `tailwindcss` | ย้ายตัวแปรสี/dark theme จาก `:root` ใน mockup เข้า theme config |
| `recharts` | กราฟ reconstruction (input เส้นทึบ vs predict เส้นประแดง, ซ้อนได้สูงสุด 5 ชุด/เครื่อง), bar chart NG แยก pgnum, tooltip เมื่อ hover |
| `react-use-websocket` | รับข้อมูล real-time (auto-reconnect + heartbeat): ผลตรวจล่าสุดของ LH/RH, health chip, KPI |
| `zustand` | เก็บ state จาก WebSocket และ UI state (ชุด compare แยก LH/RH, toggle predict, toggle ฝั่ง) |
| `@tanstack/react-query` | ดึงตารางประวัติรถผ่าน REST (filter + pagination ฝั่ง server), ดึง curve ของรถที่เลือกใน modal และชุด compare |
| `@tanstack/react-table` | ตารางประวัติรถ (manual pagination/filtering ตาม server) |
| `@radix-ui/react-dialog` | modal รายละเอียดรถ (3 กราฟ input vs predict) |
| `lucide-react` | ไอคอน |
| `date-fns` | format วันเวลา + preset "วันนี้ / 7 วัน" |
| `papaparse` | Export CSV ของผลที่ filter แล้ว (ทุกหน้า) ใส่ BOM ให้ Excel อ่านไทยได้ |

> ถ้าต่อไปต้องวาดเส้น live ที่อัปเดตถี่มาก (หลาย Hz) ให้เปลี่ยน `recharts` เป็น `uplot` + `uplot-react`

## 3. WebSocket

- URL อ่านจาก env `NEXT_PUBLIC_WS_URL`, REST base จาก `NEXT_PUBLIC_API_URL`
- แยก hook `useLiveStream()` ไว้จุดเดียว ส่ง message เข้า zustand store
- ประกาศ type ของ message ไว้ใน `types/` เช่น

  ```ts
  { type: 'result', side: 'LH' | 'RH', bn, pgnum, features: {...}, verdict: 'PASS' | 'NG', ... }
  { type: 'health', opcua, mqtt, db, predict, latencyMs }
  ```

  (เดา schema ไปก่อน แล้วทำ mock WebSocket server ง่ายๆ ไว้ใช้ตอน dev)
- แสดงสถานะ connected / reconnecting ใน top bar

## 4. โครงสร้าง folder

```
src/
├── app/
│   ├── layout.tsx                 # root layout, font, <Providers>
│   ├── page.tsx                   # หน้า dashboard (server component ประกอบ section ต่างๆ)
│   ├── globals.css                # tailwind + CSS variables (สี dark theme จาก mockup)
│   └── providers.tsx              # 'use client' — QueryClientProvider + เริ่ม useLiveStream
│
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx             # ชื่อระบบ + health chips + latency + สถานะ WS
│   │   └── KpiRow.tsx
│   ├── machine/
│   │   ├── MachineCard.tsx        # live card LH/RH (verdict, step, feature bars)
│   │   └── FeatureBar.tsx         # แถบ % diff + เส้น threshold
│   ├── reconstruction/
│   │   ├── ReconstructionPanel.tsx    # header + toggle ฝั่ง + toggle predict
│   │   ├── MachineSection.tsx         # 1 เครื่อง = chips + 3 กราฟ (state แยกกัน)
│   │   ├── CompareChips.tsx           # chips ชุด bn + เพิ่ม/แก้ไข/ลบ (สูงสุด 5)
│   │   ├── CompareForm.tsx
│   │   └── FeatureChart.tsx           # recharts: input vs predict + tooltip
│   ├── charts/
│   │   └── NgByPgnumChart.tsx
│   ├── history/
│   │   ├── HistoryTable.tsx
│   │   ├── HistoryFilters.tsx     # bn, asn, pgnum, ฝั่ง, preset, from/to
│   │   ├── columns.tsx            # column defs ของ @tanstack/react-table
│   │   ├── Pagination.tsx
│   │   └── ExportCsvButton.tsx
│   ├── car-detail/
│   │   └── CarDetailModal.tsx     # radix dialog + 3 กราฟ
│   └── ui/                        # primitive เล็กๆ: Chip, Badge, Toggle, Card, Button
│
├── hooks/
│   ├── useLiveStream.ts           # react-use-websocket → dispatch เข้า store (จุดเดียวที่คุย WS)
│   ├── useHistory.ts              # useQuery ตารางประวัติ (params จาก filter store)
│   ├── useCarCurves.ts            # useQuery curve ของ bn/pgnum/side
│   └── useNgByPgnum.ts
│
├── stores/
│   ├── liveStore.ts               # zustand: ผลล่าสุด LH/RH, health, KPI, สถานะ WS
│   ├── compareStore.ts            # zustand: ชุด compare แยก LH/RH, toggle predict/ฝั่ง
│   └── historyFilterStore.ts      # zustand: filter + page ของตาราง
│
├── lib/
│   ├── api.ts                     # fetch wrapper (อ่าน NEXT_PUBLIC_API_URL)
│   ├── ws.ts                      # สร้าง URL, parse/validate message
│   ├── csv.ts                     # papaparse export + BOM
│   ├── format.ts                  # date-fns helpers, format %, สี pass/warn/crit
│   ├── thresholds.ts              # threshold ต่อฟีเจอร์ (pressure 5.0, volume 5.0, vacuum 4.0)
│   └── constants.ts               # COLORS, MAX_COMPARE=5, PGNUMS, FEATURES config
│
├── types/
│   ├── ws.ts                      # WsMessage union: result | health
│   ├── car.ts                     # CarRecord, Side, Verdict, FeatureKey
│   └── api.ts                     # response types ของ history / curves / ng-by-pgnum
│
└── mocks/
    ├── mock-ws-server.mjs         # dev: WebSocket server ปลอมส่ง result/health เป็นระยะ
    └── curves.ts                  # generator curve (ย้ายมาจาก genCurves ใน mockup) ใช้ตอน dev

root: .env.example (NEXT_PUBLIC_WS_URL, NEXT_PUBLIC_API_URL), tailwind/postcss config,
      package.json มี script "dev:mock" รัน mock-ws-server คู่กับ next dev
```

## 5. ข้อกำหนด

- ภาษา UI เป็นภาษาไทยตาม mockup
- `'use client'` เฉพาะ component ที่ใช้ WebSocket / state / กราฟ — `page.tsx` และ `layout.tsx` เป็น server component
- logic ที่คุย WebSocket อยู่ใน `hooks/useLiveStream.ts` + `lib/ws.ts` เท่านั้น — component อ่านจาก store
- ค่า threshold / สี / จำนวนสูงสุด (5 ชุด) ห้าม hardcode ใน component ให้ดึงจาก `lib/constants.ts` และ `lib/thresholds.ts`
- LH และ RH แยก state และกราฟกันอิสระ (สองเครื่องทำงานพร้อมกันแต่ process เหลื่อมเวลา)
- ถ้ามี message format จริงจาก `predict.py` ให้ใช้แทน schema ที่เดาไว้ใน `types/ws.ts`
