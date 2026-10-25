import {useI18n} from '../../i18n';
import {
	Section,
	SectionRows,
	SettingsEmptyState,
	SettingsPageContent,
	SettingsSkeleton,
	ToggleSettingItem
} from '../Layout';
import {useLibraryConfig} from '../useConfig';

export function IndexerSettings() {
	const {t} = useI18n();
	const {libraryId, config, isLoading, update} = useLibraryConfig();

	if (!libraryId) {
		return (
			<SettingsPageContent>
				<Section
					title={t('settings.indexer.title')}
					description={t('settings.indexer.description')}
				>
					<SettingsEmptyState
						title={t('settings.library.empty')}
						description={t('settings.indexer.emptyDescription')}
					/>
				</Section>
			</SettingsPageContent>
		);
	}

	if (isLoading || !config) return <SettingsSkeleton />;

	const indexer = config.indexer;

	return (
		<SettingsPageContent>
			<Section
				title={t('settings.indexer.exclusions')}
				description={t('settings.indexer.exclusionsDescription')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.indexer.system')}
						description={t('settings.indexer.systemDescription')}
						value={indexer.no_system_files}
						onChange={(no_system_files) =>
							update({no_system_files})
						}
					/>
					<ToggleSettingItem
						label={t('settings.indexer.git')}
						description={t('settings.indexer.gitDescription')}
						value={indexer.no_git}
						onChange={(no_git) => update({no_git})}
					/>
					<ToggleSettingItem
						label={t('settings.indexer.dev')}
						description={t('settings.indexer.devDescription')}
						value={indexer.no_dev_dirs}
						onChange={(no_dev_dirs) => update({no_dev_dirs})}
					/>
					<ToggleSettingItem
						label={t('settings.indexer.hidden')}
						description={t('settings.indexer.hiddenDescription')}
						value={indexer.no_hidden}
						onChange={(no_hidden) => update({no_hidden})}
					/>
				</SectionRows>
			</Section>

			<Section
				title={t('settings.indexer.filters')}
				description={t('settings.indexer.filtersDescription')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.indexer.gitignore')}
						description={t('settings.indexer.gitignoreDescription')}
						value={indexer.gitignore}
						onChange={(gitignore) => update({gitignore})}
					/>
					<ToggleSettingItem
						label={t('settings.indexer.images')}
						description={t('settings.indexer.imagesDescription')}
						value={indexer.only_images}
						onChange={(only_images) => update({only_images})}
					/>
				</SectionRows>
			</Section>
		</SettingsPageContent>
	);
}
