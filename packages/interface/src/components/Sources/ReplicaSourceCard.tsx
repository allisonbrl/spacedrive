import {HardDrive, Lock} from '@phosphor-icons/react';
import {useNavigate} from 'react-router-dom';
import type {SourceInfo} from '@sd/ts-client';
import {formatBytes} from '../../routes/explorer/utils';
import {
	availabilityBadge,
	availabilityDescription,
	sourceAvailability
} from './sourceAvailability';
import {useI18n, type TranslateFn} from '../../i18n';

/**
 * A paired device's source, replicated through the peer-mount plane — same
 * card language as local drives, labelled with the owning device. Opens the
 * explorer routed through that device's slug, which is what serves the
 * listing from the replicated index. The owner's volume state rides along
 * in the replica, so a locked dataset on the owner reads as locked here
 * rather than as a replica that stopped updating.
 */

function syncedLabel(iso: string, t?: TranslateFn): string {
	const elapsed = Math.max(0, Date.now() - new Date(iso).getTime());
	const minutes = Math.floor(elapsed / 60000);
	if (minutes < 1) return t ? t('sources.card.synced.justNow') : 'synced just now';
	if (minutes < 60)
		return t ? t('sources.card.synced.minutes', {count: minutes}) : `synced ${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24)
		return t ? t('sources.card.synced.hours', {count: hours}) : `synced ${hours}h ago`;
	const days = Math.floor(hours / 24);
	return t ? t('sources.card.synced.days', {count: days}) : `synced ${days}d ago`;
}

export function ReplicaSourceCard({
	source,
	deviceSlug
}: {
	source: SourceInfo;
	deviceSlug: string | undefined;
}) {
	const navigate = useNavigate();
	const {t, formatNumber} = useI18n();
	const availability = sourceAvailability(source);
	const badge = availabilityBadge(availability, t);

	const open = () => {
		if (!deviceSlug || !source.root) return;
		const sdPath = {
			Physical: {device_slug: deviceSlug, path: source.root}
		};
		navigate(`/explorer?path=${encodeURIComponent(JSON.stringify(sdPath))}`);
	};

	return (
		<button
			onClick={open}
			title={
				availabilityDescription(availability, undefined, t) ??
				source.root ??
				source.name
			}
			className="border-app-line bg-app-box hover:border-app-line/80 hover:bg-app-hover group relative rounded-lg border p-4 text-left transition-all"
		>
			<div className="mb-3 flex items-center gap-3">
				<div className="bg-app-selected/40 flex size-9 shrink-0 items-center justify-center rounded-lg">
					<HardDrive
						size={20}
						weight="bold"
						className={
							availability === 'available'
								? 'text-ink-dull'
								: 'text-ink-faint'
						}
					/>
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="text-ink truncate text-sm font-medium">
						{source.name}
					</h3>
					<p className="text-ink-faint text-xs">
						{source.device_label ?? t('sources.card.pairedDevice')}
					</p>
				</div>
				{badge && (
					<span className="bg-app-selected/40 text-ink-faint flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium">
						{availability === 'locked' && (
							<Lock size={10} weight="bold" />
						)}
						{badge.toLowerCase()}
					</span>
				)}
				<span className="bg-app-selected/40 text-ink-faint rounded-full px-2 py-0.5 text-[10px] font-medium">
					{t('sources.card.replica')}
				</span>
			</div>

			<div className="text-ink-faint flex items-center justify-between text-xs">
				<span>
					{t('sources.card.items', {count: formatNumber(source.item_count)})}
					{source.total_bytes != null &&
						` · ${formatBytes(source.total_bytes)}`}
				</span>
				<span>
					{source.last_synced
						? syncedLabel(source.last_synced, t)
						: t('sources.card.neverSynced')}
				</span>
			</div>
		</button>
	);
}
