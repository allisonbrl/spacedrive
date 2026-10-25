import {useI18n} from '../../i18n';
import {
	Section,
	SectionRows,
	SettingsNote,
	SettingsPageContent,
	SettingsSkeleton,
	ToggleSettingItem
} from '../Layout';
import {useAppConfig} from '../useConfig';

export function PrivacySettings() {
	const {t} = useI18n();
	const {config, isLoading, update} = useAppConfig();

	if (isLoading || !config) return <SettingsSkeleton />;

	return (
		<SettingsPageContent>
			<Section
				title={t('settings.privacy.telemetry')}
				description={t('settings.privacy.telemetryDescription')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.privacy.usage')}
						description={t('settings.privacy.usageDescription')}
						value={config.telemetry_enabled}
						onChange={(telemetry_enabled) =>
							update({telemetry_enabled})
						}
					/>
				</SectionRows>
				<SettingsNote>
					{t('settings.privacy.note')}{' '}
					<a
						href="https://spacedrive.com/privacy"
						target="_blank"
						rel="noopener noreferrer"
						className="text-accent hover:underline"
					>
						{t('settings.privacy.policy')}
					</a>
				</SettingsNote>
			</Section>
		</SettingsPageContent>
	);
}
