import type { SourceInfo } from "@sd/ts-client";
import { useNavigate } from "react-router-dom";
import { useAdapterIcons } from "../../hooks/useAdapterIcons";
import { SourceTypeIcon } from "./SourceTypeIcon";
import { SourceStatusBadge } from "./SourceStatusBadge";
import { useI18n, type TranslateFn } from "../../i18n";

interface SourceCardProps {
	source: SourceInfo;
}

function formatRelative(
	iso: string,
	t?: TranslateFn,
	formatDateFn?: (d: Date | string | number) => string
): string {
	const date = new Date(iso);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHr = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHr / 24);

	if (diffMin < 1) return t ? t('sources.card.lastSeen.justNow') : "just now";
	if (diffMin < 60)
		return t ? t('sources.card.lastSeen.minutes', { count: diffMin }) : `${diffMin}m ago`;
	if (diffHr < 24)
		return t ? t('sources.card.lastSeen.hours', { count: diffHr }) : `${diffHr}h ago`;
	if (diffDay < 30)
		return t ? t('sources.card.lastSeen.days', { count: diffDay }) : `${diffDay}d ago`;
	return formatDateFn ? formatDateFn(date) : date.toLocaleDateString();
}

export function SourceCard({ source }: SourceCardProps) {
	const navigate = useNavigate();
	const { getIcon } = useAdapterIcons();
	const { t, formatDate, formatNumber } = useI18n();

	return (
		<button
			onClick={() => navigate(`/sources/${source.id}`)}
			className="border-app-line bg-app-box hover:border-app-line/80 hover:bg-app-hover group relative rounded-lg border p-4 text-left transition-all"
		>
			<div className="mb-3 flex items-center gap-3">
				<SourceTypeIcon
					type={source.data_type}
					svg={source.adapter_id ? getIcon(source.adapter_id) : null}
					size="md"
				/>
				<div className="min-w-0 flex-1">
					<h3 className="text-ink truncate text-sm font-medium">
						{source.name}
					</h3>
					<p className="text-ink-faint text-xs">{source.adapter_id ?? source.data_type}</p>
				</div>
				<SourceStatusBadge status={source.status} />
			</div>

			<div className="text-ink-faint flex items-center justify-between text-xs">
				<span>
					{t('sources.card.items', { count: formatNumber(source.item_count) })}
				</span>
				<span>
					{source.last_synced
						? formatRelative(source.last_synced, t, formatDate)
						: t('sources.card.neverSyncedCapital')}
				</span>
			</div>
		</button>
	);
}
