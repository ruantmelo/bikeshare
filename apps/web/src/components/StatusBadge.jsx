import { statusLabel } from '@/lib/utils'

const styles = {
  available: 'bg-green-500/15 text-green-400 border-green-500/30',
  in_use: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  unregistered: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.unregistered}`}>
      {statusLabel(status)}
    </span>
  )
}
