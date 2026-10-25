import {
	Books,
	Broadcast,
	Gear,
	Info,
	MagnifyingGlass,
	Palette,
	ShieldCheck,
	Wrench,
	type Icon
} from '@phosphor-icons/react';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import clsx from 'clsx';
import {useEffect, useState} from 'react';
import {usePlatform} from '../../contexts/PlatformContext';
import {useCoreQuery} from '../../contexts/SpacedriveContext';
import {useI18n, type TranslationKey} from '../../i18n';
import {
	AboutSettings,
	AdvancedSettings,
	AppearanceSettings,
	GeneralSettings,
	IndexerSettings,
	LibrarySettings,
	PrivacySettings,
	ServicesSettings
} from '../../Settings/pages';

const sections: {id: string; labelKey: TranslationKey; icon: Icon}[] = [
	{id: 'general', labelKey: 'settings.general', icon: Gear},
	{id: 'appearance', labelKey: 'settings.appearance', icon: Palette},
	{id: 'library', labelKey: 'settings.library', icon: Books},
	{id: 'indexer', labelKey: 'settings.indexer', icon: MagnifyingGlass},
	{id: 'services', labelKey: 'settings.services', icon: Broadcast},
	{id: 'privacy', labelKey: 'settings.privacy', icon: ShieldCheck},
	{id: 'advanced', labelKey: 'settings.advanced', icon: Wrench},
	{id: 'about', labelKey: 'settings.about', icon: Info}
];

interface SettingsSidebarProps {
	currentPage: string;
	onPageChange: (page: string) => void;
	isAboutPage: boolean;
}

function SettingsSidebar({
	currentPage,
	onPageChange,
	isAboutPage
}: SettingsSidebarProps) {
	const {t} = useI18n();
	return (
		<ul className="flex-1 space-y-1 p-2.5">
			{sections.map((section) => {
				const isSelected = currentPage === section.id;
				return (
					<li key={section.id}>
						<button
							type="button"
							onClick={() => onPageChange(section.id)}
							className={clsx(
								'flex h-8 w-full flex-row items-center gap-1.5 rounded-lg px-2 text-sm transition-colors duration-300',
								isSelected
									? isAboutPage
										? 'bg-white/20 text-white'
										: 'bg-sidebar-selected text-sidebar-ink'
									: isAboutPage
										? 'text-white/60 hover:bg-white/10 hover:text-white'
										: 'text-sidebar-ink-dull hover:bg-sidebar-box hover:text-sidebar-ink'
							)}
						>
							<section.icon
								className="size-4 opacity-60"
								weight="bold"
							/>
							<span>{t(section.labelKey)}</span>
						</button>
					</li>
				);
			})}
		</ul>
	);
}

function SettingsFooter({isAboutPage}: {isAboutPage: boolean}) {
	const {t, formatDate} = useI18n();
	const {data: status} = useCoreQuery({type: 'core.status', input: {}});
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timeout = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timeout);
	}, [copied]);

	if (!status) return null;

	const builtAt = new Date(status.built_at);
	const builtLabel = Number.isNaN(builtAt.getTime())
		? status.built_at
		: formatDate(builtAt);

	return (
		<div
			className={clsx(
				'flex flex-col items-start gap-0.5 border-t p-2.5 transition-colors duration-500',
				isAboutPage ? 'border-white/10' : 'border-sidebar-line'
			)}
		>
			<button
				type="button"
				title={t('settings.copyVersion')}
				onClick={() => {
					navigator.clipboard
						.writeText(status.version)
						.then(() => setCopied(true))
						.catch(() => undefined);
				}}
				className={clsx(
					'-ml-1 cursor-copy rounded px-1 py-0.5 text-xs transition-colors',
					isAboutPage
						? 'text-white/50 hover:bg-white/10 hover:text-white'
						: 'text-sidebar-ink-dull hover:bg-sidebar-box hover:text-sidebar-ink'
				)}
			>
				{copied ? t('settings.copied') : `v${status.version}`}
			</button>
			<span
				className={clsx(
					'text-tiny px-1 transition-colors duration-500',
					isAboutPage ? 'text-white/30' : 'text-sidebar-ink-faint'
				)}
			>
				{t('settings.built', {date: builtLabel})}
			</span>
		</div>
	);
}

function SettingsContent({page}: {page: string}) {
	switch (page) {
		case 'appearance':
			return <AppearanceSettings />;
		case 'library':
			return <LibrarySettings />;
		case 'indexer':
			return <IndexerSettings />;
		case 'services':
			return <ServicesSettings />;
		case 'privacy':
			return <PrivacySettings />;
		case 'advanced':
			return <AdvancedSettings />;
		case 'about':
			return (
				<div className="h-full overflow-y-auto">
					<AboutSettings />
				</div>
			);
		default:
			return <GeneralSettings />;
	}
}

function SettingsContentWrapper() {
	const {t} = useI18n();
	const pathname = window.location.pathname;
	const initialPage = pathname.split('/').filter(Boolean)[1] || 'general';
	const [currentPage, setCurrentPage] = useState(initialPage);
	const isAboutPage = currentPage === 'about';

	return (
		<div
			className={clsx(
				'relative flex h-screen transition-colors duration-500',
				isAboutPage ? 'bg-black' : 'bg-app'
			)}
		>
			<nav
				className={clsx(
					'flex w-48 shrink-0 flex-col border-r transition-colors duration-500',
					isAboutPage
						? 'border-black bg-black'
						: 'border-sidebar-line bg-sidebar'
				)}
			>
				{/* Traffic lights sit over the sidebar, which doubles as the drag handle */}
				<div data-tauri-drag-region className="h-[52px] shrink-0" />
				<h1
					className={clsx(
						'px-3.5 pb-4 text-xl font-semibold transition-colors duration-500',
						isAboutPage ? 'text-white' : 'text-sidebar-ink'
					)}
				>
					{t('settings.title')}
				</h1>
				<SettingsSidebar
					currentPage={currentPage}
					onPageChange={setCurrentPage}
					isAboutPage={isAboutPage}
				/>
				<SettingsFooter isAboutPage={isAboutPage} />
			</nav>

			<main className="min-w-0 flex-1 overflow-hidden">
				<SettingsContent page={currentPage} />
			</main>
		</div>
	);
}

/**
 * Settings component for separate settings window.
 * Renders immediately since daemon is already connected in main window.
 */
export function Settings() {
	const platform = usePlatform();

	useEffect(() => {
		// Apply macOS titlebar styling after window is ready
		if (platform.applyMacOSStyling) {
			platform.applyMacOSStyling().catch((err) => {
				console.warn('Failed to apply macOS styling:', err);
			});
		}
	}, [platform]);

	return (
		<>
			<SettingsContentWrapper />
			<ReactQueryDevtools
				initialIsOpen={false}
				buttonPosition="bottom-right"
			/>
		</>
	);
}
