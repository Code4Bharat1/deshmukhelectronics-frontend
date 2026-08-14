'use client';
import { cn, getStatusColor } from '../../lib/utils';

export default function StatusBadge({ status, label, className }) {
  const displayLabel = label || status?.replace(/_/g, ' ') || '';
  return (
    <span className={cn('badge capitalize', getStatusColor(status), className)}>
      {displayLabel}
    </span>
  );
}
