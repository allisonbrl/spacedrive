import { HardDrive, Lock } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import type { IndexSourceInfo } from "@sd/ts-client";
import { formatBytes } from "../../routes/explorer/utils";
import {
	availabilityBadge,
	availabilityDescription,
	sourceAvailability,
} from "./sourceAvailability";
import { useI18n, type TranslateFn } from "../../i18n";

/**
 * A filesystem source on the Sources page — same card language as adapter
 * sources, because a drive is a source whose adapter is the indexer. Opens
 * the explorer at the source root; detached, unmounted and locked drives
 * browse read-only from their snapshots and say so on the card.
 */

function lastSeenLabel(lastSeenSecs: number, t?: TranslateFn): string {
	const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - lastSeenSecs);
	if (elapsed < 60) return t ? t('sources.card.lastSeen.justNow') : "just now";
	const minutes = Math.floor(elapsed / 60);
	if (minutes < 60)
		return t ? t('sources.card.lastSeen.minutes', { count: minutes }) : `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24)
		return t ? t('sources.card.lastSeen.hours', { count: hours }) : `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return t ? t('sources.card.lastSeen.days', { count: days }) : `${days}d ago`;
}

export function DriveSourceCard({
	source,
	deviceSlug,
}: {
	source: IndexSourceInfo;
	deviceSlug: string | undefined;
}) {
	const navigate = useNavigate();
	const { t, formatNumber } = useI18n();
	const name =
		source.root.split(/[/\\]/).filter(Boolean).pop() ?? source.root;
	const availability = sourceAvailability(source);
	const badge = availabilityBadge(availability, t);
	// Where the catalog is read from is a fact about the source, not the
	// drive: a mounted drive whose tracked folder is gone has no badge and
	// still serves from the copy or from nothing.
	const catalogHint =
		source.catalog === "offline_copy"
			? t('sources.card.offlineCopy')
			: source.catalog === "away"
				? t('sources.card.catalogOnDrive')
				: undefined;

	const open = () => {
		if (!deviceSlug) return;
		const sdPath = {
			Physical: { device_slug: deviceSlug, path: source.root },
		};
		navigate(`/explorer?path=${encodeURIComponent(JSON.stringify(sdPath))}`);
	};

	return (
		<button
			onClick={open}
			title={availabilityDescription(availability, undefined, t) ?? source.root}
			className="border-app-line bg-app-box hover:border-app-line/80 hover:bg-app-hover group relative rounded-lg border p-4 text-left transition-all"
		>
			<div className="mb-3 flex items-center gap-3">
				<div className="bg-app-selected/40 flex size-9 shrink-0 items-center justify-center rounded-lg">
					<HardDrive
						size={20}
						weight="bold"
						className={
							availability === "available"
								? "text-ink-dull"
								: "text-ink-faint"
						}
					/>
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="text-ink truncate text-sm font-medium">
						{name}
					</h3>
					<p className="text-ink-faint text-xs">{t('sources.card.filesystem')}</p>
				</div>
				{(badge || catalogHint) && (
					<span className="bg-app-selected/40 text-ink-faint flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
						{availability === "locked" && (
							<Lock size={10} weight="bold" />
						)}
						{[badge?.toLowerCase(), catalogHint]
							.filter(Boolean)
							.join(", ")}
					</span>
				)}
			</div>

			<div className="text-ink-faint flex items-center justify-between text-xs">
				<span>
					{source.entry_count != null
						? t('sources.card.items', { count: formatNumber(source.entry_count) })
						: t('sources.card.indexing')}
					{source.total_bytes != null &&
						` · ${formatBytes(source.total_bytes)}`}
				</span>
				<span>{lastSeenLabel(source.last_seen_secs, t)}</span>
			</div>
		</button>
	);
}
