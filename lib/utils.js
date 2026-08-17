import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date));
}

export function getStatusColor(status) {
  const map = {
    present: 'text-emerald-600 bg-emerald-50',
    absent: 'text-red-600 bg-red-50',
    late: 'text-amber-600 bg-amber-50',
    half_day: 'text-orange-600 bg-orange-50',
    leave: 'text-blue-600 bg-blue-50',
    holiday: 'text-purple-600 bg-purple-50',
    incoming: 'text-emerald-600 bg-emerald-50',
    outgoing: 'text-red-600 bg-red-50',
    transfer: 'text-blue-600 bg-blue-50',
    adjustment: 'text-amber-600 bg-amber-50',
    damaged: 'text-red-600 bg-red-50',
    return: 'text-purple-600 bg-purple-50',
    audit_correction: 'text-teal-600 bg-teal-50',
    pending: 'text-amber-600 bg-amber-50',
    approved: 'text-emerald-600 bg-emerald-50',
    rejected: 'text-red-600 bg-red-50',
    generated: 'text-blue-600 bg-blue-50',
    paid: 'text-emerald-600 bg-emerald-50',
    completed: 'text-emerald-600 bg-emerald-50',
    in_progress: 'text-blue-600 bg-blue-50',
    ready_to_dispatch: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    dispatched: 'text-blue-700 bg-blue-50 border-blue-200',
    delivered: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    urgent: 'text-red-700 bg-red-50 border-red-200',
    high: 'text-amber-700 bg-amber-50 border-amber-200',
    normal: 'text-blue-700 bg-blue-50 border-blue-200',
    cancelled: 'text-gray-600 bg-gray-50',
    active: 'text-emerald-600 bg-emerald-50',
    inactive: 'text-gray-600 bg-gray-50',
  };
  return map[status] || 'text-gray-600 bg-gray-50';
}

export function getRoleLabel(role) {
  const map = {
    owner_admin: 'Admin',
    manager: 'Manager',
    supervisor: 'Supervisor',
    worker: 'Worker',
    accountant: 'Accountant',
  };
  return map[role] || role;
}

export function getRoleBadgeColor(role) {
  const map = {
    owner_admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    supervisor: 'bg-teal-100 text-teal-800',
    worker: 'bg-gray-100 text-gray-800',
    accountant: 'bg-amber-100 text-amber-800',
  };
  return map[role] || 'bg-gray-100 text-gray-800';
}

export function getMovementIcon(type) {
  const map = {
    incoming: '📥',
    outgoing: '📤',
    transfer: '🔄',
    adjustment: '⚖️',
    damaged: '⚠️',
    return: '↩️',
    audit_correction: '🔍',
  };
  return map[type] || '📦';
}

export function truncate(str, len = 30) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function downloadCSV(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'export.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function monthName(month) {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[(month || 1) - 1];
}
