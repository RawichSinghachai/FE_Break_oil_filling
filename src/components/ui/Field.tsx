import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

/** label เล็กตัวพิมพ์ใหญ่ + control (input / select) */
export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label htmlFor={htmlFor} className="text-[11px] uppercase tracking-[0.3px] text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
