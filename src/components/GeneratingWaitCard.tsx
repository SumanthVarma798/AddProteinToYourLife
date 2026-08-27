type Props = {
  message?: string
}

export function GeneratingWaitCard({
  message = 'Generating protein dishes...',
}: Props) {
  return (
    <div
      className="animate-pulse-card rounded-xl border border-primary/30 bg-primary/10 px-4 py-4 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-base font-semibold text-primary">{message}</p>
      <p className="mt-1 text-sm text-primary/80">Please wait a moment...</p>
    </div>
  )
}
