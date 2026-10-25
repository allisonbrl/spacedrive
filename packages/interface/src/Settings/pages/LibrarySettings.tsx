import {Slider} from '@spacedrive/primitives';
import {useState} from 'react';
import {useI18n} from '../../i18n';
import {libraryDefaults} from '../../routes/explorer/components/addToLibrary';
import {
	Section,
	SectionRows,
	SelectSettingItem,
	SettingItem,
	SettingsEmptyState,
	SettingsPageContent,
	SettingsSkeleton,
	ToggleSettingItem
} from '../Layout';
import {useLibraryConfig} from '../useConfig';

function ThumbnailQualityItem({
	value,
	onCommit
}: {
	value: number;
	onCommit: (value: number) => void;
}) {
	const {t} = useI18n();
	// Once touched the slider drives itself, so committing a value doesn't
	// snap the handle back while the config query catches up.
	const [local, setLocal] = useState<number | null>(null);
	const shown = local ?? value;

	return (
		<SettingItem
			label={t('settings.library.media.quality')}
			description={t('settings.library.media.qualityDescription')}
		>
			<div className="flex w-44 items-center gap-3">
				<Slider
					className="flex-1"
					min={1}
					max={100}
					step={1}
					value={[shown]}
					onValueChange={([next]) => setLocal(next)}
					onValueCommit={([next]) => onCommit(next)}
				/>
				<span className="text-ink-dull w-7 text-right text-xs tabular-nums">
					{shown}
				</span>
			</div>
		</SettingItem>
	);
}

export function LibrarySettings() {
	const {t} = useI18n();
	const {libraryId, config, isLoading, update} = useLibraryConfig();

	if (!libraryId) {
		return (
			<SettingsPageContent>
				<Section
					title={t('settings.library.title')}
					description={t('settings.library.description')}
				>
					<SettingsEmptyState
						title={t('settings.library.empty')}
						description={t('settings.library.emptyDescription')}
					/>
				</Section>
			</SettingsPageContent>
		);
	}

	if (isLoading || !config) return <SettingsSkeleton />;

	const adding = libraryDefaults(config.adding);

	return (
		<SettingsPageContent>
			<Section
				title={t('settings.library.media.title')}
				description={t('settings.library.media.description')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.library.media.generate')}
						description={t(
							'settings.library.media.generateDescription'
						)}
						value={config.generate_thumbnails}
						onChange={(generate_thumbnails) =>
							update({generate_thumbnails})
						}
					/>
					<ThumbnailQualityItem
						value={config.thumbnail_quality}
						onCommit={(thumbnail_quality) =>
							update({thumbnail_quality})
						}
					/>
					<ToggleSettingItem
						label={t('settings.library.media.ai')}
						description={t('settings.library.media.aiDescription')}
						value={config.enable_ai_tagging}
						onChange={(enable_ai_tagging) =>
							update({enable_ai_tagging})
						}
					/>
				</SectionRows>
			</Section>

			<Section
				title={t('settings.library.sync.title')}
				description={t('settings.library.sync.description')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.library.sync.enabled')}
						description={t(
							'settings.library.sync.enabledDescription'
						)}
						value={config.sync_enabled}
						onChange={(sync_enabled) => update({sync_enabled})}
					/>
					<ToggleSettingItem
						label={t('settings.library.sync.encryption')}
						description={t(
							'settings.library.sync.encryptionDescription'
						)}
						value={config.encryption_enabled}
						onChange={(encryption_enabled) =>
							update({encryption_enabled})
						}
					/>
				</SectionRows>
			</Section>

			<Section
				title={t('settings.library.adding.title')}
				description={t('settings.library.adding.description')}
			>
				<SectionRows>
					<SelectSettingItem
						label={t('settings.library.adding.store')}
						description={t(
							'settings.library.adding.storeDescription'
						)}
						value={adding.placement}
						onChange={(placement) => update({adding: {placement}})}
						options={[
							{
								value: 'in_library',
								label: t('settings.library.adding.inLibrary')
							},
							{
								value: 'on_source',
								label: t('settings.library.adding.onSource')
							}
						]}
					/>
					<ToggleSettingItem
						label={t('settings.library.adding.offline')}
						description={t(
							'settings.library.adding.offlineDescription'
						)}
						value={adding.keep_offline_copy}
						onChange={(keep_offline_copy) =>
							update({adding: {keep_offline_copy}})
						}
					/>
					<ToggleSettingItem
						label={t('settings.library.adding.everything')}
						description={t(
							'settings.library.adding.everythingDescription'
						)}
						value={adding.unfiltered}
						onChange={(unfiltered) =>
							update({adding: {unfiltered}})
						}
					/>
					<ToggleSettingItem
						label={t('settings.library.adding.identify')}
						description={t(
							'settings.library.adding.identifyDescription'
						)}
						value={adding.identify_content}
						onChange={(identify_content) =>
							update({adding: {identify_content}})
						}
					/>
				</SectionRows>
			</Section>

			<Section
				title={t('settings.library.tracking.title')}
				description={t('settings.library.tracking.description')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.library.tracking.system')}
						description={t(
							'settings.library.tracking.systemDescription'
						)}
						value={config.auto_track_system_volumes}
						onChange={(auto_track_system_volumes) =>
							update({auto_track_system_volumes})
						}
					/>
					<ToggleSettingItem
						label={t('settings.library.tracking.external')}
						description={t(
							'settings.library.tracking.externalDescription'
						)}
						value={config.auto_track_external_volumes}
						onChange={(auto_track_external_volumes) =>
							update({auto_track_external_volumes})
						}
					/>
				</SectionRows>
			</Section>
		</SettingsPageContent>
	);
}
