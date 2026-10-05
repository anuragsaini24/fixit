export function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return 'Date not set';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', options);
}

export function statusLabel(status) {
  return String(status || 'Unknown').replaceAll('_', ' ');
}
