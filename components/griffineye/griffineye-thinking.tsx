import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'

export function GriffinEyeThinking({ message = 'GriffinEye is thinking…' }: { message?: string }) {
  return (
    <div className="griffineye-thinking" role="status" aria-live="polite">
      <span className="griffineye-thinking-icon">
        <GriffinEyeIcon size={15} />
      </span>
      <span className="griffineye-thinking-text">{message}</span>
      <span className="griffineye-shimmer" aria-hidden />
    </div>
  )
}
