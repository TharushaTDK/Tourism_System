export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    planned: 'bg-purple-100 text-purple-700 border-purple-200',
    in_progress: 'bg-orange-100 text-orange-700 border-orange-200',
    scheduled: 'bg-teal-100 text-teal-700 border-teal-200',
    pending_approval: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

export function formatStatusLabel(status: string): string {
  return status.split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');
}

// Turns sparse {month, revenue} rows (only months with data) into a full chronological
// 12-month series so revenue charts don't silently drop empty months.
export function buildMonthlySeries(rows: { month: string; revenue: number | string }[] | undefined): { labels: string[]; data: number[] } {
  const now = new Date();
  const map = new Map<string, number>();
  (rows || []).forEach((r) => {
    const d = new Date(r.month);
    map.set(`${d.getFullYear()}-${d.getMonth()}`, Number(r.revenue));
  });
  const labels: string[] = [];
  const data: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
    data.push(map.get(`${d.getFullYear()}-${d.getMonth()}`) || 0);
  }
  return { labels, data };
}

export function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    cultural: '🏛️',
    beach: '🏖️',
    wildlife: '🦁',
    hill_country: '🏔️',
    adventure: '🧗',
    safari: '🦒',
    train: '🚂',
    hiking: '🥾',
    wellness: '🧘',
    budget: '💰',
    family: '👨‍👩‍👧‍👦',
    honeymoon: '💑',
    luxury: '✨',
    hotel: '🏨',
    villa: '🏡',
    resort: '🌴',
    homestay: '🏠',
    festival: '🎉',
    nature: '🌿',
    sports: '⚽',
  };
  return map[category] ?? '📍';
}

export function truncate(text: string, length: number): string {
  if (!text) return '';
  return text.length <= length ? text : `${text.slice(0, length)}...`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
