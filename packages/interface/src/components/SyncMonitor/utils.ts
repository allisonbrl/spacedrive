import type { TranslateFn } from '../../i18n';

/**
 * Formats a date to time ago (e.g., "2m ago", "1h ago")
 */
export function timeAgo(date: string | Date | undefined, t?: TranslateFn): string {
	if (!date) return '—';

	const now = new Date();
	const past = typeof date === 'string' ? new Date(date) : date;

	// Check if date is valid
	if (isNaN(past.getTime())) return '—';

	const diffMs = now.getTime() - past.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffDays > 0) return t ? t('sync.time.days', { count: diffDays }) : `${diffDays}d ago`;
	if (diffHours > 0) return t ? t('sync.time.hours', { count: diffHours }) : `${diffHours}h ago`;
	if (diffMinutes > 0) return t ? t('sync.time.minutes', { count: diffMinutes }) : `${diffMinutes}m ago`;
	return t ? t('sync.time.justNow') : 'just now';
}
