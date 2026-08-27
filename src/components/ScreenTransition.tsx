import { animate } from 'animejs'
import { useEffect, useRef, type ReactNode } from 'react'

export function ScreenTransition({
  children,
  stepKey,
}: {
  children: ReactNode
  stepKey: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }
    el.style.opacity = '0'
    el.style.transform = 'translateY(12px)'
    const anim = animate(el, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 320,
      ease: 'outQuad',
    })
    return () => {
      anim.pause()
    }
  }, [stepKey])

  return (
    <div ref={ref} className="flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  )
}
