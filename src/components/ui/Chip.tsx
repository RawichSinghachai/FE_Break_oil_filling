import type { ReactNode } from 'react';

export type DotTone = 'ok' | 'warn' | 'bad' | 'idle';

const DOT_CLASS: Record<DotTone, string> = {
  ok: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-crit',
  idle: 'bg-muted',
};

export function Dot({ tone }: { tone: DotTone }) {
  return <span className={`size-2 flex-none rounded-full ${DOT_CLASS[tone]}`} />;
}

interface ChipProps {
  dot?: DotTone;
  children: ReactNode;
}

/** pill เล็กๆ — health chip ใน top bar */
export function Chip({ dot, children }: ChipProps) {
  return (
    <span className="flex items-center gap-[7px] rounded-full border border-border bg-surface-2 px-[11px] py-1.5 text-[12px] text-text-2">
      {dot && <Dot tone={dot} />}
      {children}
    </span>
  );
}
