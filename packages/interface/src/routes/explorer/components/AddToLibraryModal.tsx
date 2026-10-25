import {
	ArrowCounterClockwise,
	Books,
	CheckCircle,
	HardDrive,
	Warning
} from '@phosphor-icons/react';
import FolderIcon from '@sd/assets/icons/Folder.webp';
import HDDIcon from '@sd/assets/icons/HDD.webp';
import ServerIcon from '@sd/assets/icons/Server.webp';
import type {
	SdPath,
	StorePlacement,
	TrackSourceOutput,
	ValidateSourcePathOutput,
	Volume
} from '@sd/ts-client';
import {
	Button,
	Dialog,
	dialogManager,
	Input,
	RadixCheckbox,
	Switch,
	useDialog,
	type UseDialogProps
} from '@spacedrive/primitives';
import clsx from 'clsx';
import {useState, type ReactNode} from 'react';
import {useForm} from 'react-hook-form';
import {useNavigate, type NavigateFunction} from 'react-router-dom';
import {
	describeError,
	Failure
} from '../../../components/modals/RearrangeModal';
import {
	useLibraryMutation,
	useLibraryQuery
} from '../../../contexts/SpacedriveContext';
import {useI18n} from '../../../i18n';
import {
	addRefusal,
	buildPayload,
	changedKeys,
	containingVolume,
	effectiveDefaults,
	inclusionOf,
	libraryDefaults,
	overridesFrom,
	placementChoices,
	suggestedName,
	targetPath,
	type AddSettings,
	type AddTarget
} from './addToLibrary';
import {
	CategoryGrid,
	DrivePicker,
	FolderPicker,
	NetworkComingSoon,
	type StorageCategory
} from './AddToLibraryPicker';
import {
	CloudConnectionFields,
	CloudProviderGrid,
	cloudStepIcon,
	useCloudConnection,
	type CloudProvider
} from './CloudStorageSteps';

/**
 * Add to Library: one setup modal for a folder or a whole drive. It shows the
 * library's defaults for the chosen scope, lets the user change each one for
 * this add, and reports what the core saved. Opened with a target from the
 * Explorer, the path bar or a volume's menu; opened without one from Home,
 * it first asks what to add.
 */

interface AddToLibraryOptions {
	target?: AddTarget;
	/** Called with the added root, for a caller that wants to show it. */
	onAdded?: (root: SdPath) => void;
}

type Step =
	| {kind: 'pick'}
	| {kind: 'folder'}
	| {kind: 'drive'}
	| {kind: 'network'}
	| {kind: 'cloud-provider'}
	| {kind: 'cloud'; provider: CloudProvider}
	| {kind: 'setup'; target: AddTarget; from?: Step}
	| {kind: 'done'; target: AddTarget; result: TrackSourceOutput | null};

/**
 * Dialogs mount outside the router, so the hook captures navigation where it
 * is called and hands it to the dialog for its jobs link.
 */
export function useAddToLibraryDialog() {
	const navigate = useNavigate();
	return (options: AddToLibraryOptions = {}) =>
		dialogManager.create((props: UseDialogProps) => (
			<AddToLibraryDialog {...props} {...options} navigate={navigate} />
		));
}

function AddToLibraryDialog(
	props: UseDialogProps & AddToLibraryOptions & {navigate: NavigateFunction}
) {
	const dialog = useDialog(props);
	const {t} = useI18n();
	const {navigate} = props;
	const [step, setStep] = useState<Step>(
		props.target ? {kind: 'setup', target: props.target} : {kind: 'pick'}
	);
	const close = () => dialogManager.setState(props.id, {open: false});

	const pickCategory = (category: StorageCategory) => {
		if (category === 'local') setStep({kind: 'folder'});
		else if (category === 'external') setStep({kind: 'drive'});
		else if (category === 'cloud') setStep({kind: 'cloud-provider'});
		else setStep({kind: 'network'});
	};

	if (step.kind === 'setup') {
		return (
			<SetupDialog
				dialog={dialog}
				target={step.target}
				onBack={step.from ? () => setStep(step.from!) : undefined}
				onRetarget={(target) => setStep({...step, target})}
				onAdded={(result) =>
					setStep({kind: 'done', target: step.target, result})
				}
			/>
		);
	}

	if (step.kind === 'done') {
		return (
			<DoneDialog
				dialog={dialog}
				target={step.target}
				result={step.result}
				onOpen={
					props.onAdded
						? () => {
								close();
								props.onAdded?.({
									Physical: {
										device_slug: 'local',
										path:
											step.result?.root ??
											targetPath(step.target)
									}
								});
							}
						: undefined
				}
				onProgress={() => {
					close();
					navigate('/jobs');
				}}
			/>
		);
	}

	if (step.kind === 'cloud') {
		return (
			<CloudDialog
				dialog={dialog}
				provider={step.provider}
				onBack={() => setStep({kind: 'cloud-provider'})}
				onConnected={(root) => {
					close();
					props.onAdded?.(root);
				}}
			/>
		);
	}

	const picker: Record<
		Exclude<Step['kind'], 'setup' | 'done' | 'cloud'>,
		{
			title: string;
			description: string;
			icon: ReactNode;
			body: ReactNode;
			back?: Step;
		}
	> = {
		pick: {
			title: t('explorer.add.title'),
			description: t('explorer.add.chooseWhat'),
			icon: <Books size={20} weight="fill" />,
			body: <CategoryGrid onSelect={pickCategory} />
		},
		folder: {
			title: t('explorer.add.folder.title'),
			description: t('explorer.add.folder.description'),
			icon: <img src={FolderIcon} className="size-5" alt="" />,
			body: (
				<FolderPicker
					onPick={(path) =>
						setStep({
							kind: 'setup',
							target: {kind: 'path', path},
							from: step
						})
					}
				/>
			),
			back: {kind: 'pick'}
		},
		drive: {
			title: t('explorer.add.drive.title'),
			description: t('explorer.add.drive.description'),
			icon: <HardDrive size={20} weight="fill" />,
			body: (
				<DrivePicker
					onPick={(volume) =>
						setStep({
							kind: 'setup',
							target: {kind: 'volume', volume},
							from: step
						})
					}
				/>
			),
			back: {kind: 'pick'}
		},
		network: {
			title: t('explorer.add.network.title'),
			description: t('explorer.add.network.descriptionShort'),
			icon: <img src={ServerIcon} className="size-5" alt="" />,
			body: <NetworkComingSoon />,
			back: {kind: 'pick'}
		},
		'cloud-provider': {
			title: t('explorer.add.cloud.title'),
			description: t('explorer.add.cloud.description'),
			icon: cloudStepIcon,
			body: (
				<CloudProviderGrid
					onSelect={(provider) => setStep({kind: 'cloud', provider})}
				/>
			),
			back: {kind: 'pick'}
		}
	};
	const current = picker[step.kind];

	return (
		<Shell
			dialog={dialog}
			title={current.title}
			description={current.description}
			icon={current.icon}
			hideButtons
			onBack={current.back ? () => setStep(current.back!) : undefined}
		>
			{current.body}
		</Shell>
	);
}

function Shell({
	dialog,
	title,
	description,
	icon,
	hideButtons,
	onBack,
	children,
	...rest
}: {
	dialog: ReturnType<typeof useDialog>;
	title: string;
	description?: ReactNode;
	icon: ReactNode;
	hideButtons?: boolean;
	onBack?: () => void;
	children: ReactNode;
	onSubmit?: () => void;
	ctaLabel?: string;
	ctaDanger?: boolean;
	cancelLabel?: string;
	submitDisabled?: boolean;
	loading?: boolean;
	buttonsSideContent?: ReactNode;
}) {
	const form = useForm();
	const {t} = useI18n();
	const {onSubmit, buttonsSideContent, ...dialogProps} = rest;
	return (
		<Dialog
			dialog={dialog}
			form={form}
			title={title}
			description={description}
			icon={icon}
			hideButtons={hideButtons}
			onCancelled={true}
			onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
			formClassName="!min-w-[520px] !max-w-[520px] max-h-[85vh] flex flex-col"
			buttonsSideContent={
				onBack || buttonsSideContent ? (
					<div className="flex items-center gap-2">
						{onBack && (
							<Button
								type="button"
								variant="gray"
								size="sm"
								onClick={onBack}
							>
								{t('explorer.add.back')}
							</Button>
						)}
						{buttonsSideContent}
					</div>
				) : undefined
			}
			{...dialogProps}
		>
			{children}
		</Dialog>
	);
}

function CloudDialog({
	dialog,
	provider,
	onBack,
	onConnected
}: {
	dialog: ReturnType<typeof useDialog>;
	provider: CloudProvider;
	onBack: () => void;
	onConnected: (root: SdPath) => void;
}) {
	const {t} = useI18n();
	const {form, submit, pending} = useCloudConnection(provider, onConnected);
	return (
		<Dialog
			dialog={dialog}
			form={form}
			onSubmit={submit}
			title={t('explorer.add.cloud.connect', {provider: provider.name})}
			icon={<img src={provider.icon} className="size-5" alt="" />}
			description={t('explorer.add.cloud.configure')}
			ctaLabel={t('explorer.add.cloud.connectButton')}
			loading={pending}
			onCancelled={true}
			formClassName="!min-w-[520px] !max-w-[520px] max-h-[85vh] flex flex-col"
			buttonsSideContent={
				<Button type="button" variant="gray" size="sm" onClick={onBack}>
					{t('explorer.add.back')}
				</Button>
			}
		>
			<CloudConnectionFields provider={provider} form={form} />
		</Dialog>
	);
}

interface RiskWarning {
	validation: ValidateSourcePathOutput;
	wholeVolume: Volume | undefined;
}

function SetupDialog({
	dialog,
	target,
	onBack,
	onRetarget,
	onAdded
}: {
	dialog: ReturnType<typeof useDialog>;
	target: AddTarget;
	onBack?: () => void;
	onRetarget: (target: AddTarget) => void;
	onAdded: (result: TrackSourceOutput | null) => void;
}) {
	const {t} = useI18n();
	const path = targetPath(target);
	const {data: config} = useLibraryQuery({
		type: 'config.library.get',
		input: null
	});
	const {data: sources} = useLibraryQuery({
		type: 'sources.list',
		input: {data_type: null}
	});
	const {data: volumeList} = useLibraryQuery({
		type: 'volumes.list',
		input: {filter: 'All'}
	});
	const validatePath = useLibraryQuery(
		{
			type: 'sources.validate_path',
			input: {path: {Physical: {device_slug: 'local', path}}}
		},
		{enabled: target.kind === 'path'}
	);
	// Which of the listed volumes are this device's, so a drive another
	// device tracked at the same mount point cannot refuse an add here.
	const {data: devices} = useLibraryQuery({
		type: 'devices.list',
		input: {
			include_offline: true,
			include_details: false,
			show_paired: false
		}
	});
	const trackSource = useLibraryMutation('sources.track');
	const trackVolume = useLibraryMutation('volumes.track');
	const updateConfig = useLibraryMutation('config.library.update');

	const volumes = volumeList?.volumes ?? [];
	const volume =
		target.kind === 'volume'
			? target.volume
			: containingVolume(path, volumes);
	const inclusion = inclusionOf(path, sources ?? []);
	const library = libraryDefaults(config?.adding);
	const defaults = effectiveDefaults(
		library,
		target,
		volume,
		inclusion.exact
	);
	const choices = placementChoices(volume, inclusion.exact, t);
	const loaded = Boolean(config && sources && volumeList && devices);
	// A drive that is unmounted or locked cannot be added until it is back;
	// the core would refuse, and the modal says why before the attempt. The
	// decision waits for the device list, since without it every device's
	// rows would be weighed.
	const refusal = devices
		? addRefusal(
				target,
				volumes,
				devices.find((device) => device.is_current)?.id,
				t
			)
		: undefined;

	const [edits, setEdits] = useState<Partial<AddSettings>>({});
	const [typedName, setTypedName] = useState<string | null>(null);
	const [saveAsDefaults, setSaveAsDefaults] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const chosen: AddSettings = {...defaults, ...edits};
	const changed = changedKeys(defaults, chosen);
	const name = typedName ?? inclusion.exact?.name ?? suggestedName(target);
	const set = <K extends keyof AddSettings>(key: K, value: AddSettings[K]) =>
		setEdits((previous) => ({...previous, [key]: value}));

	// A risky root (a home directory, a whole system drive) is said before
	// the add, with the whole drive offered where the core suggests it.
	const risk: RiskWarning | null =
		target.kind === 'path' &&
		validatePath.data &&
		validatePath.data.risk_level !== 'low'
			? {
					validation: validatePath.data,
					wholeVolume: validatePath.data.suggested_alternative
						? volumes.find(
								(candidate) =>
									candidate.fingerprint ===
									validatePath.data?.suggested_alternative
										?.volume_fingerprint
							)
						: undefined
				}
			: null;

	const submit = async () => {
		setFailure(null);
		setPending(true);
		try {
			// Only the user's own changes become defaults: what the scope
			// forced (an external drive's capture, a placement the drive
			// cannot hold) is this add's circumstance, not a library choice.
			const overrides = overridesFrom(defaults, chosen);
			if (saveAsDefaults && changed.length > 0) {
				await updateConfig.mutateAsync({adding: overrides});
			}
			const payload = buildPayload(target, name, overrides);
			if (payload.type === 'volumes.track') {
				const output = await trackVolume.mutateAsync(payload.input);
				onAdded(output.source);
			} else {
				onAdded(await trackSource.mutateAsync(payload.input));
			}
		} catch (error) {
			setFailure(describeError(error));
		} finally {
			setPending(false);
		}
	};

	const scopeLabel =
		target.kind === 'volume' ? `Entire drive ${target.volume.name}` : path;
	const onSourceRoot = `${path.replace(/\/+$/, '')}/.spacedrive/`;

	return (
		<Shell
			dialog={dialog}
			title={inclusion.exact ? t('explorer.add.reAdd') : t('explorer.add.title')}
			description={scopeLabel}
			icon={
				target.kind === 'volume' ? (
					<img src={HDDIcon} className="size-5" alt="" />
				) : (
					<img src={FolderIcon} className="size-5" alt="" />
				)
			}
			onBack={onBack}
			onSubmit={() => void submit()}
			ctaLabel={
				risk
					? t('explorer.add.addAnyway')
					: inclusion.exact
						? t('explorer.add.reAdd')
						: t('explorer.add.title')
			}
			ctaDanger={Boolean(risk)}
			submitDisabled={!loaded || pending || Boolean(refusal)}
			loading={pending}
		>
			<div className="space-y-4 py-1">
				<IncludeCard target={target} volume={volume} />

				{refusal && (
					<Notice tone="warning">
						<span className="text-ink font-medium">
							{t('explorer.add.cannotAdd')}
						</span>{' '}
						{refusal}
					</Notice>
				)}

				{inclusion.exact && (
					<Notice tone="info">
						<span className="text-ink font-medium">
							{t('explorer.add.inclusion.exact', {name: inclusion.exact.name ?? ''})}
						</span>{' '}
						{t('explorer.add.inclusion.exactDetail')}
						{inclusion.exact.store_path
							? ` at ${inclusion.exact.store_path}`
							: ''}{' '}
						and walks the folder for changes. The settings below are
						the ones it was saved with; capture can widen here but
						never narrows.
					</Notice>
				)}
				{!inclusion.exact && inclusion.enclosing && (
					<Notice tone="info">
						<span className="text-ink font-medium">
							{t('explorer.add.inclusion.enclosing', {name: inclusion.enclosing.name ?? '', root: inclusion.enclosing.root ?? ''})}
						</span>{' '}
						{t('explorer.add.inclusion.enclosingDetail')}
					</Notice>
				)}
				{inclusion.nested.length > 0 && (
					<Notice tone="info">
						{inclusion.nested.length === 1
							? t('explorer.add.inclusion.nestedOne', {name: inclusion.nested[0]?.name ?? ''})
							: t('explorer.add.inclusion.nestedMany', {count: inclusion.nested.length, names: inclusion.nested.map((source) => source.name).join(', ')})}
					</Notice>
				)}

				{risk && (
					<RiskNotice
						risk={risk}
						onWholeVolume={
							risk.wholeVolume
								? () =>
										onRetarget({
											kind: 'volume',
											volume: risk.wholeVolume!
										})
								: undefined
						}
					/>
				)}

				<div className="space-y-1.5">
					<label
						className="text-ink-dull text-xs font-medium"
						htmlFor="add-name"
					>
						{t('explorer.add.name')}
					</label>
					<Input
						id="add-name"
						size="sm"
						value={name}
						onChange={(event) => setTypedName(event.target.value)}
						placeholder={suggestedName(target)}
					/>
				</div>

				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<div className="text-ink-dull text-xs font-medium">
							{t('explorer.add.settings')}
						</div>
						{changed.length > 0 ? (
							<button
								type="button"
								className="text-accent flex items-center gap-1 text-xs hover:underline"
								onClick={() => setEdits({})}
							>
								<ArrowCounterClockwise
									size={12}
									weight="bold"
								/>
								{t('explorer.add.reset')}
							</button>
						) : (
							<span className="text-ink-faint text-xs">
								{inclusion.exact
									? t('explorer.add.asSaved')
									: t('explorer.add.libraryDefaults')}
							</span>
						)}
					</div>
					<div className="divide-app-line border-app-line bg-app-box divide-y overflow-hidden rounded-lg border">
						<Row
							label={t('explorer.add.storeCatalog')}
							changed={changed.includes('placement')}
							description={
								chosen.placement === 'on_source'
									? t('explorer.add.catalogOnSource', {root: onSourceRoot})
									: t('explorer.add.catalogInLibrary')}
						>
							<PlacementPicker
								value={chosen.placement}
								choices={choices}
								onChange={(placement) =>
									set('placement', placement)
								}
							/>
						</Row>
						<Row
							label={t('explorer.add.offlineCopy')}
							changed={changed.includes('keep_offline_copy')}
							muted={chosen.placement !== 'on_source'}
							description={
								chosen.placement === 'on_source'
									? t('explorer.add.offlineDetail')
									: t('explorer.add.offlineOnlySource')}
						>
							<Switch
								size="sm"
								checked={chosen.keep_offline_copy}
								disabled={chosen.placement !== 'on_source'}
								onCheckedChange={(value) =>
									set('keep_offline_copy', value)
								}
							/>
						</Row>
						<Row
							label={t('explorer.add.captureEverything')}
							changed={changed.includes('unfiltered')}
							description={
								chosen.unfiltered
									? t('explorer.add.captureDetail')
									: t('explorer.add.captureFilteredDetail')}
						>
							<Switch
								size="sm"
								checked={chosen.unfiltered}
								disabled={Boolean(
									inclusion.exact?.settings?.unfiltered
								)}
								onCheckedChange={(value) =>
									set('unfiltered', value)
								}
							/>
						</Row>
						<Row
							label={t('explorer.add.identifyContent')}
							changed={changed.includes('identify_content')}
							description={t('explorer.add.identifyDetail')}
						>
							<Switch
								size="sm"
								checked={chosen.identify_content}
								onCheckedChange={(value) =>
									set('identify_content', value)
								}
							/>
						</Row>
					</div>
				</div>

				{!inclusion.exact && (
					<RadixCheckbox
						checked={saveAsDefaults}
						onCheckedChange={(value) =>
							setSaveAsDefaults(value === true)
						}
						label={t('explorer.add.saveDefaults')}
						labelClassName="text-xs text-ink-dull"
					/>
				)}

				{failure && <Failure message={failure} />}
			</div>
		</Shell>
	);
}

function IncludeCard({
	target,
	volume
}: {
	target: AddTarget;
	volume: Volume | undefined;
}) {
	const {t} = useI18n();
	const drive = volume
		? `${volume.name}${volume.mount_type === 'Network' ? ` (${t('explorer.add.network')})` : volume.mount_type === 'External' ? ` (${t('explorer.add.external')})` : ''}`
		: t('explorer.add.driveNotMatched');
	return (
		<div className="border-app-line bg-app-box flex items-center gap-3 rounded-lg border px-3 py-2.5">
			<img
				src={target.kind === 'volume' ? HDDIcon : FolderIcon}
				className="size-9"
				alt=""
			/>
			<div className="min-w-0 flex-1">
				<div className="text-ink truncate text-sm font-medium">
					{target.kind === 'volume'
						? target.volume.name
						: suggestedName(target)}
				</div>
				<div className="text-ink-faint truncate text-xs">
					{target.kind === 'volume' ? t('explorer.add.wholeDrive') : t('explorer.add.folder')} ·{' '}
					{drive} · {t('explorer.add.thisDevice')}
				</div>
			</div>
		</div>
	);
}

function Row({
	label,
	description,
	changed,
	muted,
	children
}: {
	label: string;
	description: string;
	changed: boolean;
	muted?: boolean;
	children: ReactNode;
}) {
	const {t} = useI18n();
	return (
		<div
			className={clsx(
				'flex items-center justify-between gap-4 px-3 py-2.5',
				muted && 'opacity-60'
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex items-center gap-2">
					<span className="text-ink text-sm">{label}</span>
					{changed && (
						<span className="bg-accent/15 text-accent rounded-full px-1.5 py-px text-[10px] font-medium">
							{t('explorer.add.changed')}
						</span>
					)}
				</div>
				<span className="text-tiny text-ink-faint leading-snug">
					{description}
				</span>
			</div>
			<div className="flex shrink-0 items-center">{children}</div>
		</div>
	);
}

const PLACEMENTS: {value: StorePlacement; label: string}[] = [
	{value: 'in_library', label: 'in_library'},
	{value: 'on_source', label: 'on_source'}
];

function PlacementPicker({
	value,
	choices,
	onChange
}: {
	value: StorePlacement;
	choices: ReturnType<typeof placementChoices>;
	onChange: (value: StorePlacement) => void;
}) {
	const {t} = useI18n();
	const unavailable = PLACEMENTS.find(
		(option) => !choices[option.value].available
	);
	return (
		<div className="flex flex-col items-end gap-1">
			<div className="bg-app-input flex rounded-md p-0.5">
				{PLACEMENTS.map((option) => {
					const choice = choices[option.value];
					return (
						<button
							key={option.value}
							type="button"
							disabled={!choice.available}
							title={choice.reason}
							onClick={() => onChange(option.value)}
							className={clsx(
								'rounded px-2 py-1 text-xs font-medium transition-colors',
								value === option.value
									? 'bg-accent text-white'
									: 'text-ink-dull hover:text-ink',
								!choice.available &&
									'hover:text-ink-dull cursor-not-allowed opacity-40'
							)}
						>
							{option.value === 'in_library' ? t('explorer.add.inLibrary') : t('explorer.add.onSource')}
						</button>
					);
				})}
			</div>
			{unavailable && (
				<span className="text-ink-faint max-w-[220px] text-right text-[10px] leading-snug">
					{t('explorer.add.unavailable', {label: unavailable.value === 'in_library' ? t('explorer.add.inLibrary') : t('explorer.add.onSource'), reason: choices[unavailable.value].reason ?? ''})}
				</span>
			)}
		</div>
	);
}

function Notice({
	tone,
	children
}: {
	tone: 'info' | 'warning';
	children: ReactNode;
}) {
	return (
		<div
			className={clsx(
				'text-ink-dull rounded-lg border px-3 py-2 text-xs leading-relaxed',
				tone === 'warning'
					? 'border-yellow-500/40 bg-yellow-500/10'
					: 'border-accent/20 bg-accent/10'
			)}
		>
			{children}
		</div>
	);
}

function RiskNotice({
	risk,
	onWholeVolume
}: {
	risk: RiskWarning;
	onWholeVolume?: () => void;
}) {
	const {t} = useI18n();
	return (
		<Notice tone="warning">
			<div className="flex items-start gap-2">
				<Warning
					size={16}
					weight="fill"
					className="mt-px shrink-0 text-yellow-500"
				/>
				<div className="flex-1 space-y-1.5">
					<div className="text-ink font-medium">
						{risk.validation.risk_level === 'high'
							? t('explorer.add.riskLarge')
							: t('explorer.add.riskPath')}
					</div>
					{risk.validation.warnings.map((warning, index) => (
						<div key={index}>
							<div>{warning.message}</div>
							{warning.suggestion && (
								<div className="text-ink-faint">
									{warning.suggestion}
								</div>
							)}
						</div>
					))}
					{risk.validation.suggested_alternative && (
						<div className="pt-1">
							<div>
								{risk.validation.suggested_alternative.message}
							</div>
							{onWholeVolume && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-1.5"
									onClick={onWholeVolume}
								>
									{t('explorer.add.riskAlternative', {name: risk.validation.suggested_alternative.volume_name})}
								</Button>
							)}
						</div>
					)}
				</div>
			</div>
		</Notice>
	);
}

function DoneDialog({
	dialog,
	target,
	result,
	onOpen,
	onProgress
}: {
	dialog: ReturnType<typeof useDialog>;
	target: AddTarget;
	result: TrackSourceOutput | null;
	onOpen?: () => void;
	onProgress: () => void;
}) {
	const {t} = useI18n();
	const settings = result?.settings;
	const facts: {label: string; value: string}[] = result
		? [
				{label: t('explorer.add.done.root'), value: result.root},
				{
					label: t('explorer.add.done.catalog'),
					value: result.store_path
						? result.store_path
						: settings?.placement === 'on_source'
							? t('explorer.add.done.onDrive')
							: t('explorer.add.done.inLibrary')
				},
				{
					label: t('explorer.add.done.identity'),
					value: result.catalog_reused
						? t('explorer.add.done.reused')
						: t('explorer.add.done.newCatalog')
				},
				{
					label: t('explorer.add.done.capture'),
					value: settings?.unfiltered ? t('explorer.add.done.everything') : t('explorer.add.done.filtered')
				},
				{
					label: t('explorer.add.identifyContent'),
					value: settings?.identify_content === false ? t('explorer.add.done.off') : t('explorer.add.done.on')
				}
			]
		: [];
	if (result && settings?.placement === 'on_source') {
		facts.push({
			label: t('explorer.add.offlineCopy'),
			value: settings.keep_offline_copy === false ? t('explorer.add.done.off') : t('explorer.add.done.on')
		});
	}

	return (
		<Shell
			dialog={dialog}
			title={result ? t('explorer.add.done.added', {name: result.name}) : t('explorer.add.done.tracked')}
			description={result?.root ?? targetPath(target)}
			icon={
				<CheckCircle
					size={20}
					weight="fill"
					className="text-green-500"
				/>
			}
			onSubmit={onProgress}
			ctaLabel={result?.job_id ? t('explorer.add.done.progress') : t('explorer.add.done.jobs')}
			cancelLabel={t('explorer.add.close')}
			buttonsSideContent={
				onOpen ? (
					<Button
						type="button"
						variant="gray"
						size="sm"
						onClick={onOpen}
					>
						{t('explorer.add.open')}
					</Button>
				) : undefined
			}
		>
			<div className="space-y-3 py-1">
				{result ? (
					<>
						<div className="divide-app-line border-app-line bg-app-box divide-y overflow-hidden rounded-lg border">
							{facts.map((fact) => (
								<div
									key={fact.label}
									className="flex items-baseline gap-3 px-3 py-2"
								>
									<span className="text-ink-faint w-28 shrink-0 text-xs">
										{fact.label}
									</span>
									<span
										className="text-ink min-w-0 flex-1 truncate text-xs"
										title={fact.value}
									>
										{fact.value}
									</span>
								</div>
							))}
						</div>
						<p className="text-ink-dull text-xs">
							{result.job_id
								? t('explorer.add.done.walkRunning')
								: t('explorer.add.done.noWalk')}
						</p>
					</>
				) : (
					<p className="text-ink-dull text-xs">
						{t('explorer.add.done.offline')}
					</p>
				)}
			</div>
		</Shell>
	);
}

export type {AddTarget};
