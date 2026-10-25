import {Copy} from '@phosphor-icons/react';
import folderIcon from '@sd/assets/icons/FolderNoSpace.webp';
import {Button} from '@spacedrive/primitives';
import {AnimatePresence, motion} from 'framer-motion';
import {useEffect, useState} from 'react';
import {usePlatform} from '../../contexts/PlatformContext';
import {useDaemonStatus} from '../../hooks/useDaemonStatus';
import {useI18n} from '../../i18n';

function CLICommand({
	command,
	description,
	copyLabel
}: {
	command: string;
	description: string;
	copyLabel: string;
}) {
	const copyToClipboard = () => {
		navigator.clipboard.writeText(command);
	};

	return (
		<div className="group relative rounded-md px-3 py-2">
			<code className="text-accent text-xs">{command}</code>
			<p className="text-ink-dull mt-1 text-xs">{description}</p>
			<button
				onClick={copyToClipboard}
				className="hover:bg-app-hover absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
				title={copyLabel}
			>
				<Copy className="text-ink-dull size-3" weight="bold" />
			</button>
		</div>
	);
}

export function DaemonDisconnectedOverlay({
	forceShow = false,
	daemonStatus
}: {
	forceShow?: boolean;
	daemonStatus: ReturnType<typeof useDaemonStatus>;
}) {
	const {t} = useI18n();
	const {
		isConnected,
		isChecking,
		isInstalled,
		startDaemon,
		installAndStartDaemon
	} = daemonStatus;
	const [installAsService, setInstallAsService] = useState(isInstalled);
	const platform = usePlatform();

	// Update checkbox when installation state changes
	useEffect(() => {
		console.log(
			'[DaemonDisconnectedOverlay] isInstalled changed to:',
			isInstalled
		);
		setInstallAsService(isInstalled);
	}, [isInstalled]);

	// Log checkbox state changes
	useEffect(() => {
		console.log(
			'[DaemonDisconnectedOverlay] installAsService checkbox state:',
			installAsService
		);
	}, [installAsService]);

	const shouldShow = forceShow || !isConnected;

	return (
		<AnimatePresence>
			{shouldShow && (
				<motion.div
					initial={{opacity: 0}}
					animate={{opacity: 1}}
					exit={{opacity: 0}}
					transition={{duration: 0.2}}
					className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-lg"
				>
					<div className="fixed right-4 top-4 flex items-center gap-2">
						<div className="border-app-line bg-app-box flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
							<div
								className={`size-2 rounded-full ${
									isChecking
										? 'bg-yellow-500'
										: isConnected
											? 'bg-green-500'
											: 'bg-red-500'
								} animate-pulse`}
							/>
							<span className="text-ink-dull">
								{isChecking
									? t('daemon.starting')
									: isConnected
										? t('daemon.connected')
										: t('daemon.disconnected')}
							</span>
						</div>

						<div className="border-app-line bg-app-box flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
							<div
								className={`size-2 rounded-full ${
									isInstalled ? 'bg-accent' : 'bg-gray-500'
								}`}
							/>
							<span className="text-ink-dull">
								{isInstalled
									? t('daemon.persistent')
									: t('daemon.temporary')}
							</span>
						</div>
					</div>

					<div className="border-app-line flex max-w-4xl gap-8 rounded-lg border p-8 shadow-2xl">
						<div className="flex flex-1 flex-col items-center justify-center gap-6 px-12">
							<img
								src={folderIcon}
								alt={t('overlays.daemon.folderIcon')}
								className="size-32 select-none"
								draggable={false}
							/>

							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="text-ink text-2xl font-bold">
									{t('daemon.disconnectedTitle')}
								</h1>
								<p className="text-ink-dull max-w-xs text-sm leading-relaxed">
									{t('daemon.disconnectedDescription')}
								</p>
							</div>

							<div className="flex flex-col items-center gap-3">
								<label className="text-ink flex cursor-pointer items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={installAsService}
										onChange={async (e) => {
											const shouldInstall =
												e.target.checked;
											setInstallAsService(shouldInstall);

											if (shouldInstall) {
												const success =
													await installAndStartDaemon();
												if (!success) {
													setInstallAsService(false);
												}
											} else {
												try {
													await platform.uninstallDaemonService?.();
												} catch (error) {
													console.error(
														'Failed to uninstall daemon service:',
														error
													);
													setInstallAsService(true);
												}
											}
										}}
										className="border-app-line bg-app accent-accent size-4 cursor-pointer rounded"
									/>
									<span>{t('daemon.installPersistent')}</span>
								</label>

								<div className="flex items-center gap-2">
									<Button variant="gray">
										{t('daemon.help')}
									</Button>
									<Button
										onClick={startDaemon}
										disabled={isChecking}
										variant="accent"
									>
										{isChecking
											? t('daemon.startingDaemon')
											: t('daemon.restartDaemon')}
									</Button>
								</div>
							</div>
						</div>

						<div className="border-app-line flex w-80 flex-col gap-3 rounded-lg border p-4">
							<span className="text-ink-dull text-xs font-medium">
								{t('daemon.cliCommands')}
							</span>

							<div className="space-y-2">
								<CLICommand
									command="sd start"
									description={t(
										'daemon.cli.startBackground'
									)}
									copyLabel={t('daemon.copy')}
								/>
								<CLICommand
									command="sd start --foreground"
									description={t(
										'daemon.cli.startForeground'
									)}
									copyLabel={t('daemon.copy')}
								/>
								<CLICommand
									command="sd stop"
									description={t('daemon.cli.stop')}
									copyLabel={t('daemon.copy')}
								/>
								<CLICommand
									command="sd restart"
									description={t('daemon.cli.restart')}
									copyLabel={t('daemon.copy')}
								/>
								<CLICommand
									command="sd daemon install"
									description={t('daemon.cli.install')}
									copyLabel={t('daemon.copy')}
								/>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
