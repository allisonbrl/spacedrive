import {Button, Input} from '@spacedrive/primitives';
import {useState} from 'react';
import {usePlatform} from '../../contexts/PlatformContext';
import {useCoreMutation, useCoreQuery} from '../../contexts/SpacedriveContext';
import {useI18n} from '../../i18n';
import {
	Section,
	SectionCard,
	SectionRows,
	SettingItem,
	SettingsPageContent,
	SettingsValue
} from '../Layout';
import {useAppConfig} from '../useConfig';

interface FieldProps {
	label: string;
	description: string;
	value: string;
	placeholder: string;
	mono?: boolean;
	onCommit: (value: string) => void;
}

/** Labelled text field that commits its value on blur. */
function Field({
	label,
	description,
	value,
	placeholder,
	mono,
	onCommit
}: FieldProps) {
	const [draft, setDraft] = useState(value);
	const [focused, setFocused] = useState(false);

	// While unfocused the field mirrors the server value, so an update from
	// elsewhere is reflected without clobbering an in-progress edit.
	const shown = focused ? draft : value;

	return (
		<label className="block">
			<span className="text-ink block text-sm">{label}</span>
			<p className="text-tiny text-ink-faint mb-2 mt-0.5 leading-snug">
				{description}
			</p>
			<Input
				className="w-full"
				inputElementClassName={mono ? 'font-mono' : undefined}
				value={shown}
				placeholder={placeholder}
				onFocus={() => {
					setDraft(value);
					setFocused(true);
				}}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={() => {
					setFocused(false);
					const next = draft.trim();
					if (next && next !== value) onCommit(next);
				}}
			/>
		</label>
	);
}

export function GeneralSettings() {
	const {t} = useI18n();
	const platform = usePlatform();
	const statusQuery = useCoreQuery({type: 'core.status', input: {}});
	const {config} = useAppConfig();
	const updateDevice = useCoreMutation('device.update', {
		onSuccess: () => {
			statusQuery.refetch();
		}
	});
	const resetData = useCoreMutation('core.reset');

	const device = statusQuery.data?.device_info;
	const dataDirectory =
		config?.data_dir ?? statusQuery.data?.system?.data_directory ?? '';

	const handleResetData = () => {
		platform.confirm(t('settings.general.reset.confirm'), (confirmed) => {
			if (!confirmed) return;
			resetData.mutate({confirm: true});
		});
	};

	return (
		<SettingsPageContent>
			<Section
				title={t('settings.general.device.title')}
				description={t('settings.general.device.description')}
			>
				<SectionCard padded>
					<div className="space-y-4">
						<Field
							label={t('settings.general.device.name')}
							description={t(
								'settings.general.device.nameDescription'
							)}
							value={device?.name ?? ''}
							placeholder={t(
								'settings.general.device.namePlaceholder'
							)}
							onCommit={(name) => updateDevice.mutate({name})}
						/>
						<Field
							label={t('settings.general.device.slug')}
							description={t(
								'settings.general.device.slugDescription'
							)}
							value={device?.slug ?? ''}
							placeholder={t(
								'settings.general.device.slugPlaceholder'
							)}
							mono
							onCommit={(slug) => updateDevice.mutate({slug})}
						/>
					</div>
				</SectionCard>
			</Section>

			<Section
				title={t('settings.general.storage.title')}
				description={t('settings.general.storage.description')}
			>
				<SectionCard padded>
					<div className="flex flex-col gap-3">
						<SettingsValue>
							{dataDirectory || t('settings.general.loading')}
						</SettingsValue>
						{platform.revealFile && (
							<div className="flex justify-end">
								<Button
									variant="gray"
									size="sm"
									disabled={!dataDirectory}
									onClick={() =>
										platform.revealFile?.(dataDirectory)
									}
								>
									{t('settings.general.revealFinder')}
								</Button>
							</div>
						)}
					</div>
				</SectionCard>
			</Section>

			<Section
				title={t('settings.general.reset.title')}
				description={t('settings.general.reset.description')}
			>
				<SectionRows>
					<SettingItem
						label={t('settings.general.reset.label')}
						description={t(
							'settings.general.reset.descriptionItem'
						)}
					>
						<Button
							variant="colored"
							size="sm"
							disabled={resetData.isPending}
							className="border-status-error bg-status-error"
							onClick={handleResetData}
						>
							{resetData.isPending
								? t('settings.general.reset.pending')
								: t('settings.general.reset.button')}
						</Button>
					</SettingItem>
					{(resetData.data || resetData.error) && (
						<div className="px-4 py-3">
							<p className="text-tiny text-ink-faint leading-relaxed">
								{resetData.error
									? resetData.error.message
									: resetData.data?.message}
							</p>
						</div>
					)}
				</SectionRows>
			</Section>
		</SettingsPageContent>
	);
}
