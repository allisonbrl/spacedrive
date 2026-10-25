import type {VolumeState} from '@sd/ts-client';
import type {TranslationKey} from '../../i18n';

/**
 * What stands between the library and a source's files right now, as the
 * sidebar, the Storage page and a source's detail all say it.
 *
 * `locked` and `unmounted` come from the volume index's state of the drive
 * under the source; `offline` is a detached source the index has no state
 * for (a drive that vanished, a replica whose owner is away). A mounted
 * drive and an adapter, whose origin is a service, are `available`.
 */
export type SourceAvailability =
	| 'available'
	| 'unmounted'
	| 'locked'
	| 'offline';

const defaultTranslate = (
	key: TranslationKey,
	variables?: Record<string, string | number>
) => {
	const values: Partial<Record<TranslationKey, string>> = {
		'source.availability.locked': 'Locked',
		'source.availability.unmounted': 'Unmounted',
		'source.availability.offline': 'Offline',
		'source.availability.lockedDescription':
			'{{volume}} is locked: its encryption key is not loaded. Files stay listed from the last index and cannot be opened until the key is loaded.',
		'source.availability.unmountedDescription':
			'{{volume}} is not mounted. Files stay listed from the last index and cannot be opened until it mounts.',
		'source.availability.offlineDescription':
			'The drive is not connected. Files stay listed from the last index.',
		'source.availability.announce': '{{source}} is {{state}}'
	};
	return (values[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name) =>
		String(variables?.[name] ?? '')
	);
};

export function sourceAvailability(source: {
	attached: boolean;
	volume_state?: VolumeState | null;
}): SourceAvailability {
	switch (source.volume_state) {
		case 'Locked':
			return 'locked';
		case 'Unmounted':
			return 'unmounted';
		case 'Mounted':
			return 'available';
		default:
			return source.attached ? 'available' : 'offline';
	}
}

/** The badge a row or card wears, or nothing while the source is available. */
export function availabilityBadge(
	availability: SourceAvailability,
	t: (key: TranslationKey) => string = defaultTranslate
): string | undefined {
	switch (availability) {
		case 'locked':
			return t('source.availability.locked');
		case 'unmounted':
			return t('source.availability.unmounted');
		case 'offline':
			return t('source.availability.offline');
		default:
			return undefined;
	}
}

/**
 * One sentence saying what the state means for the files, naming the
 * volume when the caller knows it. The index stays browsable in every
 * case: a locked or unmounted source still lists what it indexed.
 */
export function availabilityDescription(
	availability: SourceAvailability,
	volumeName: string | undefined,
	t: (
		key: TranslationKey,
		variables?: Record<string, string | number>
	) => string = defaultTranslate
): string | undefined {
	const volume = volumeName ?? 'Its volume';
	switch (availability) {
		case 'locked':
			return t('source.availability.lockedDescription', {volume});
		case 'unmounted':
			return t('source.availability.unmountedDescription', {volume});
		case 'offline':
			return t('source.availability.offlineDescription');
		default:
			return undefined;
	}
}
