import type { ReactNode } from 'react';

interface ToggleProps {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** สวิตช์แบบ pill (เช่น "แสดงผล predict") */
export function Toggle({ pressed, onToggle, children }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className="group inline-flex items-center gap-[9px] rounded-full border border-border bg-surface-2 py-1.5 pl-2 pr-[13px] text-[12px] text-text-2 aria-pressed:text-text"
    >
      <span className="relative h-[18px] w-[34px] flex-none rounded-full bg-baseline transition-colors group-aria-pressed:bg-s1">
        <span className="absolute left-0.5 top-0.5 size-3.5 rounded-full bg-white transition-transform group-aria-pressed:translate-x-4" />
      </span>
      {children}
    </button>
  );
}
