'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function KPICard({ icon: Icon, label, value, trend, trendLabel, color = 'teal', onClick }) {
  const colorMap = {
    teal: 'bg-brand-700',
    green: 'bg-emerald-600',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500',
  };

  const iconBg = colorMap[color] || colorMap.teal;

  return (
    <div
      className={cn('kpi-card', onClick && 'cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start justify-between">
        <div className={cn('kpi-icon', iconBg)}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend !== undefined && trend !== null && (
          <div className={cn(
            'kpi-trend',
            trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'text-gray-400'
          )}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <div className="kpi-value">{value ?? '—'}</div>
        <div className="kpi-label">{label}</div>
        {trendLabel && <div className="text-xs text-gray-400 mt-0.5">{trendLabel}</div>}
      </div>
    </div>
  );
}
