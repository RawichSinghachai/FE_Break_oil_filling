import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, hint, className = '', children }: CardProps) {
  return (
    <section className={`rounded-card border border-border bg-surface px-[18px] py-4 ${className}`}>
      {title && (
        <h2 className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.3px] text-text-2">
          {title}
          {hint && (
            <>
              {' '}
              <span className="text-[12px] font-normal normal-case tracking-normal text-muted">{hint}</span>
            </>
          )}
        </h2>
      )}
      {children}
    </section>
  );
}
