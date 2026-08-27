import { animate } from 'animejs'
import { useRef, type ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

export function PrimaryButton({
  variant = 'primary',
  fullWidth = true,
  className = '',
  children,
  onClick,
  ...rest
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)

  const base =
    'touch-target inline-flex items-center justify-center gap-2 rounded-xl px-4 text-lg font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-primary text-white shadow-sm hover:bg-primary-dark'
      : variant === 'secondary'
        ? 'border-2 border-primary bg-white text-primary'
        : 'bg-transparent text-header-icon'

  return (
    <button
      ref={ref}
      type="button"
      className={`${base} ${styles} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={(event) => {
        const el = ref.current
        if (
          el &&
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          animate(el, {
            scale: [1, 0.97, 1],
            duration: 180,
            ease: 'outQuad',
          })
        }
        onClick?.(event)
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
