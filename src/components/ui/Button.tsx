import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Variant = 'default' | 'primary' | 'ghost' | 'danger'

export function Button({
  variant = 'default',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'default' && 'bg-[var(--color-bg-inset)] text-[var(--color-text)] hover:bg-[var(--color-border)]',
        variant === 'primary' && 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] hover:opacity-90',
        variant === 'ghost' && 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-bg-inset)]',
        variant === 'danger' && 'bg-transparent text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10',
        className,
      )}
      {...props}
    />
  )
}

export function IconButton({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors shrink-0',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-inset)] hover:text-[var(--color-text)]',
        className,
      )}
      {...props}
    />
  )
}
