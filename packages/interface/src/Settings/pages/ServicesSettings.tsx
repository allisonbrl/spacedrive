import {
	ArrowClockwise,
	CheckCircle,
	CircleNotch,
	WarningCircle
} from '@phosphor-icons/react';
import type {
	ExternalToolStatus,
	ToolCapability,
	ToolInstaller
} from '@sd/ts-client';
import {Button} from '@spacedrive/primitives';
import {useState} from 'react';
import {usePlatform} from '../../contexts/PlatformContext';
import {useCoreMutation, useCoreQuery} from '../../contexts/SpacedriveContext';
import {useI18n, type TranslationKey} from '../../i18n';
import {
	Section,
	SectionCard,
	SectionRows,
	SettingsEmptyState,
	SettingsNote,
	SettingsPageContent,
	SettingsSkeleton,
	ToggleSettingItem
} from '../Layout';
import {useAppConfig} from '../useConfig';

const CAPABILITY_KEYS: Record<ToolCapability, TranslationKey> = {
	video_thumbnail: 'settings.services.videoThumbnails',
	video_thumbstrip: 'settings.services.timelinePreviews',
	media_metadata: 'settings.services.mediaMetadata'
};

const INSTALL_COMMANDS: Record<ToolInstaller, string> = {
	homebrew: 'brew install ffmpeg',
	winget: 'winget install --id Gyan.FFmpeg'
};

function ExternalToolCard({
	tool,
	installing,
	installError,
	onInstall
}: {
	tool: ExternalToolStatus;
	installing: boolean;
	installError: string | null;
	onInstall: (installer: ToolInstaller, label: string) => void;
}) {
	const {t} = useI18n();
	const installers = tool.install_options.filter(
		(option) => option.available
	);
	const missingProbe =
		tool.id === 'ffmpeg' &&
		tool.available &&
		!tool.capabilities.includes('video_thumbstrip');
	const ready = tool.available && !missingProbe;
	const canInstall = !ready && installers.length > 0;

	return (
		<div className="space-y-3 px-4 py-4">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="flex items-center gap-1.5">
						{ready ? (
							<CheckCircle
								className="text-status-success size-4 shrink-0"
								weight="fill"
							/>
						) : (
							<WarningCircle
								className="text-status-warning size-4 shrink-0"
								weight="fill"
							/>
						)}
						<p className="text-ink text-sm font-medium">
							{tool.name}
						</p>
					</div>
					<p className="text-tiny text-ink-faint mt-0.5">
						{tool.available
							? (tool.version ?? t('settings.services.available'))
							: t('settings.services.notFound')}
					</p>
				</div>

				{canInstall && (
					<div className="flex shrink-0 flex-wrap justify-end gap-2">
						{installers.map((option) => (
							<Button
								key={option.installer}
								variant="gray"
								size="sm"
								disabled={installing}
								onClick={() =>
									onInstall(option.installer, option.label)
								}
							>
								{installing ? (
									<>
										<CircleNotch className="mr-1.5 size-3.5 animate-spin" />
										{t('settings.services.installing')}
									</>
								) : (
									option.label
								)}
							</Button>
						))}
					</div>
				)}
			</div>

			{tool.available && (
				<>
					{tool.path && (
						<p
							className="bg-app-input text-tiny text-ink-dull truncate rounded-md px-2.5 py-1.5 font-mono"
							title={tool.path}
						>
							{tool.path}
						</p>
					)}
					<div className="flex flex-wrap gap-1.5">
						{tool.capabilities.map((capability) => (
							<span
								key={capability}
								className="bg-app-input text-tiny text-ink-dull rounded-full px-2 py-1"
							>
								{t(CAPABILITY_KEYS[capability])}
							</span>
						))}
					</div>
				</>
			)}

			{!tool.available && installers.length === 0 && (
				<p className="text-tiny text-ink-faint leading-relaxed">
					{t('settings.services.installHint', {
						tool: tool.name
					})}
				</p>
			)}
			{missingProbe && (
				<p className="text-tiny text-status-warning leading-relaxed">
					{t('settings.services.ffprobe')}
				</p>
			)}
			{installError && (
				<p className="text-tiny text-status-error leading-relaxed">
					{installError}
				</p>
			)}
		</div>
	);
}

export function ServicesSettings() {
	const {t} = useI18n();
	const {config, isLoading, update} = useAppConfig();
	const platform = usePlatform();
	const [requiresRestart, setRequiresRestart] = useState(false);
	const toolsQuery = useCoreQuery({type: 'tools.list', input: {}});
	const installTool = useCoreMutation('tools.install', {
		onSuccess: () => toolsQuery.refetch()
	});

	const install = (
		tool: ExternalToolStatus,
		installer: ToolInstaller,
		label: string
	) => {
		const command = INSTALL_COMMANDS[installer];
		platform.confirm(
			t('settings.services.installConfirm', {label, command}),
			(confirmed) => {
				if (!confirmed) return;
				installTool.reset();
				installTool.mutate({tool: tool.id, installer, confirm: true});
			}
		);
	};

	if (isLoading || !config) return <SettingsSkeleton />;

	const services = config.services;

	const toggle = (patch: Parameters<typeof update>[0]) => {
		update(patch).then((result) => {
			if (result.requires_restart) setRequiresRestart(true);
		});
	};

	return (
		<SettingsPageContent>
			<Section
				title={t('settings.services.external')}
				description={t('settings.services.externalDescription')}
				right={
					<Button
						variant="gray"
						size="sm"
						disabled={
							toolsQuery.isFetching || installTool.isPending
						}
						onClick={() => toolsQuery.refetch()}
					>
						<ArrowClockwise
							className={`mr-1.5 size-3.5 ${toolsQuery.isFetching ? 'animate-spin' : ''}`}
						/>
						{t('settings.services.checkAgain')}
					</Button>
				}
			>
				{toolsQuery.isLoading ? (
					<SectionCard padded>
						<div className="text-ink-faint flex items-center gap-2 text-xs">
							<CircleNotch className="size-4 animate-spin" />
							{t('settings.services.checking')}
						</div>
					</SectionCard>
				) : toolsQuery.error ? (
					<SettingsNote>
						{t('settings.services.inspectError', {
							error: toolsQuery.error.message
						})}
					</SettingsNote>
				) : toolsQuery.data?.tools.length ? (
					<SectionCard className="divide-app-line divide-y">
						{toolsQuery.data.tools.map((tool) => (
							<ExternalToolCard
								key={tool.id}
								tool={tool}
								installing={
									installTool.isPending &&
									installTool.variables?.tool === tool.id
								}
								installError={
									installTool.variables?.tool === tool.id
										? (installTool.error?.message ?? null)
										: null
								}
								onInstall={(installer, label) =>
									install(tool, installer, label)
								}
							/>
						))}
					</SectionCard>
				) : (
					<SettingsEmptyState
						title={t('settings.services.noTools')}
						description={t('settings.services.noToolsDescription')}
					/>
				)}
			</Section>

			<Section
				title={t('settings.services.background')}
				description={t('settings.services.backgroundDescription')}
			>
				<SectionRows>
					<ToggleSettingItem
						label={t('settings.services.networking')}
						description={t(
							'settings.services.networkingDescription'
						)}
						value={services.networking_enabled}
						onChange={(networking_enabled) =>
							toggle({networking_enabled})
						}
					/>
					<ToggleSettingItem
						label={t('settings.services.volume')}
						description={t('settings.services.volumeDescription')}
						value={services.volume_monitoring_enabled}
						onChange={(volume_monitoring_enabled) =>
							toggle({volume_monitoring_enabled})
						}
					/>
					<ToggleSettingItem
						label={t('settings.services.watcher')}
						description={t('settings.services.watcherDescription')}
						value={services.fs_watcher_enabled}
						onChange={(fs_watcher_enabled) =>
							toggle({fs_watcher_enabled})
						}
					/>
					<ToggleSettingItem
						label={t('settings.services.statistics')}
						description={t(
							'settings.services.statisticsDescription'
						)}
						value={services.statistics_listener_enabled}
						onChange={(statistics_listener_enabled) =>
							toggle({statistics_listener_enabled})
						}
					/>
				</SectionRows>
				{requiresRestart && (
					<SettingsNote>
						{t('settings.services.restart')}
					</SettingsNote>
				)}
			</Section>
		</SettingsPageContent>
	);
}
