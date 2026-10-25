import {
	Books,
	Database,
	EjectSimple,
	EyeSlash,
	Gauge
} from '@phosphor-icons/react';
import type {Volume} from '@sd/ts-client';
import {useLibraryMutation} from '../../../contexts/SpacedriveContext';
import {
	useContextMenu,
	type ContextMenuItem,
	type ContextMenuResult
} from '../../../hooks/useContextMenu';
import {useI18n} from '../../../i18n';
import {useAddToLibraryDialog} from '../../../routes/explorer/components/AddToLibraryModal';

interface UseVolumeContextMenuOptions {
	volume: Volume;
}

/**
 * Provides context menu functionality for volume items.
 *
 * Menu items include:
 * - Add to Library: open the setup modal with the whole drive as its scope
 * - Untrack Volume: Remove volume from library tracking
 * - Speed Test: Test read/write performance
 * - Index Volume: Trigger full volume indexing
 * - Eject Volume: Safely eject removable media
 */
export function useVolumeContextMenu({
	volume
}: UseVolumeContextMenuOptions): ContextMenuResult {
	const openAddToLibrary = useAddToLibraryDialog();
	const untrackVolume = useLibraryMutation('volumes.untrack');
	const speedTestVolume = useLibraryMutation('volumes.speed_test');
	const indexVolume = useLibraryMutation('volumes.index');
	const ejectVolume = useLibraryMutation('volumes.eject');

	const isRemovable = volume.mount_type === 'External';
	const {t} = useI18n();

	const items: ContextMenuItem[] = [
		{
			icon: Books,
			label: t('context.addToLibrary'),
			onClick: () => {
				openAddToLibrary({target: {kind: 'volume', volume}});
			},
			condition: () => !volume.is_tracked && volume.is_mounted
		},
		{
			icon: EyeSlash,
			label: t('context.untrackVolume'),
			onClick: async () => {
				try {
					await untrackVolume.mutateAsync({
						volume_id: volume.id
					});
				} catch (err) {
					console.error('Failed to untrack volume:', err);
				}
			},
			variant: 'danger' as const,
			condition: () => volume.is_tracked
		},
		{type: 'separator'},
		{
			icon: Database,
			label: t('context.reindexVolume'),
			onClick: async () => {
				try {
					const result = await indexVolume.mutateAsync({
						fingerprint: volume.fingerprint,
						scope: 'Recursive'
					});
					console.log('Volume indexed:', result.message);
				} catch (err) {
					console.error('Failed to index volume:', err);
				}
			},
			// Tracking already indexes; this is for walking a drive again after
			// it changed while nothing was watching.
			condition: () => volume.is_mounted && volume.is_tracked
		},
		{
			icon: Gauge,
			label: t('context.speedTest'),
			onClick: async () => {
				try {
					const result = await speedTestVolume.mutateAsync({
						fingerprint: volume.fingerprint
					});
					console.log(
						'Speed test complete:',
						result.read_speed_mbps,
						'MB/s read,',
						result.write_speed_mbps,
						'MB/s write'
					);
				} catch (err) {
					console.error('Failed to run speed test:', err);
				}
			},
			condition: () => volume.is_mounted
		},
		{
			icon: EjectSimple,
			label: t('context.eject'),
			onClick: async () => {
				try {
					const result = await ejectVolume.mutateAsync({
						fingerprint: volume.fingerprint
					});
					if (result.success) {
						console.log('Volume ejected successfully');
					} else {
						console.error('Eject failed:', result.message);
					}
				} catch (err) {
					console.error('Failed to eject volume:', err);
				}
			},
			keybind: '⌘E',
			condition: () => isRemovable && volume.is_mounted
		}
	];

	return useContextMenu({items});
}
