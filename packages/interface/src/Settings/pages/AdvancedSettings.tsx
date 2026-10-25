import {useI18n} from '../../i18n';
import {
	Section,
	SectionRows,
	SelectSettingItem,
	SettingsNote,
	SettingsPageContent,
	SettingsSkeleton,
	ToggleSettingItem
} from '../Layout';
import {useAppConfig} from '../useConfig';

const LOG_LEVELS = [
	{value: 'trace', label: 'Trace'},
	{value: 'debug', label: 'Debug'},
	{value: 'info', label: 'Info'},
	{value: 'warn', label: 'Warn'},
	{value: 'error', label: 'Error'}
];

export function AdvancedSettings() {
	const {t} = useI18n();
	const {config, isLoading, update} = useAppConfig();

	if (isLoading || !config) return <SettingsSkeleton />;

	return (
		<SettingsPageContent>
			<Section
				title={t('settings.advanced.diagnostics')}
				description={t('settings.advanced.diagnosticsDescription')}
			>
				<SectionRows>
					<SelectSettingItem
						label={t('settings.advanced.logLevel')}
						description={t('settings.advanced.logLevelDescription')}
						value={config.log_level}
						onChange={(log_level) => update({log_level})}
						options={LOG_LEVELS}
					/>
				</SectionRows>
			</Section>

			<Section
				title={t('settings.advanced.jobLogging')}
				description={t('settings.advanced.jobLoggingDescription')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.advanced.enableJobs')}
						description={t(
							'settings.advanced.enableJobsDescription'
						)}
						value={config.job_logging.enabled}
						onChange={(job_logging_enabled) =>
							update({job_logging_enabled})
						}
					/>
					<ToggleSettingItem
						label={t('settings.advanced.debugJobs')}
						description={t(
							'settings.advanced.debugJobsDescription'
						)}
						value={config.job_logging.include_debug}
						disabled={!config.job_logging.enabled}
						onChange={(job_logging_include_debug) =>
							update({job_logging_include_debug})
						}
					/>
				</SectionRows>
				<SettingsNote>{t('settings.advanced.note')}</SettingsNote>
			</Section>
		</SettingsPageContent>
	);
}
