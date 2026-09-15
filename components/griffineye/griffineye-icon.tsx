import { Eye } from 'lucide-react'

export function GriffinEyeIcon({
  size = 16,
  className,
}: {
  size?: number
  className?: string
}) {
  return <Eye size={size} strokeWidth={2} className={className} aria-hidden />
}
