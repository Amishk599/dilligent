import type { ButtonHTMLAttributes } from 'react';
import Chevron from './Chevron';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'sm';
  withChevron?: boolean;
}

const VARIANT_CLASSES: Record<'primary' | 'secondary', string> = {
  primary: 'bg-text-primary text-text-on-dark hover:opacity-90',
  secondary: 'bg-bg-cream text-text-primary border border-border-subtle hover:bg-white',
};

const SIZE_CLASSES: Record<'md' | 'sm', string> = {
  md: 'rounded-[11px] px-5 py-2.5 text-sm',
  sm: 'rounded-[9px] px-3 py-1.5 text-xs',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  withChevron = true,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
      {withChevron && <Chevron />}
    </button>
  );
}
