import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

const VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-s1 text-white',
  ghost: 'border border-border bg-transparent text-text-2',
};

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`h-[38px] rounded-[9px] px-[18px] text-[13px] font-semibold disabled:cursor-default disabled:opacity-50 ${VARIANT[variant]} ${className}`}
      {...rest}
    />
  );
}
