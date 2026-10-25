import type {DirectorySortBy, MediaSortBy, SortField} from '@sd/ts-client';
import type {TranslateFn, TranslationKey} from '../../i18n';

export type ExplorerSortBy = DirectorySortBy | MediaSortBy;
export type ExplorerViewMode = 'grid' | 'list' | 'media' | 'column';

export interface SortOption {
	value: ExplorerSortBy;
	label: string;
}

/**
 * The orders a view offers. Every view sorts by capture time now that the
 * listing reads it from the image facet; the media view adds birth time and
 * drops the type order, which means nothing in a roll.
 */
const english: TranslateFn = (key) =>
	(
		({
			'explorer.sort.name': 'Name',
			'explorer.sort.dateModified': 'Date Modified',
			'explorer.sort.dateTaken': 'Date Taken',
			'explorer.sort.dateCreated': 'Date Created',
			'explorer.sort.size': 'Size',
			'explorer.sort.type': 'Type'
		}) as Partial<Record<TranslationKey, string>>
	)[key] ?? key;

export function sortOptionsFor(
	viewMode: ExplorerViewMode,
	t: TranslateFn = english
): SortOption[] {
	if (viewMode === 'media') {
		return [
			{value: 'datetaken', label: t('explorer.sort.dateTaken')},
			{value: 'modified', label: t('explorer.sort.dateModified')},
			{value: 'created', label: t('explorer.sort.dateCreated')},
			{value: 'name', label: t('explorer.sort.name')},
			{value: 'size', label: t('explorer.sort.size')}
		];
	}
	return [
		{value: 'name', label: t('explorer.sort.name')},
		{value: 'modified', label: t('explorer.sort.dateModified')},
		{value: 'datetaken', label: t('explorer.sort.dateTaken')},
		{value: 'size', label: t('explorer.sort.size')},
		{value: 'type', label: t('explorer.sort.type')}
	];
}

/**
 * The order to keep when a view changes: the current one when the new view
 * offers it, otherwise the view's first option, so a roll opens by capture
 * time and a folder falls back to its name.
 */
export function coerceSortBy(
	viewMode: ExplorerViewMode,
	sortBy: string | null | undefined
): ExplorerSortBy {
	const options = sortOptionsFor(viewMode);
	const kept = options.find((option) => option.value === sortBy);
	return kept ? kept.value : options[0]!.value;
}

/** The search sort field an explorer order maps to. */
export function searchSortField(sortBy: string | null | undefined): SortField {
	switch (sortBy) {
		case 'name':
			return 'Name';
		case 'size':
			return 'Size';
		case 'modified':
			return 'ModifiedAt';
		case 'created':
			return 'CreatedAt';
		case 'datetaken':
			return 'CapturedAt';
		default:
			return 'Relevance';
	}
}
