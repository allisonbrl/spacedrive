import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FileArchive, FileZip } from "@phosphor-icons/react";
import {
	Dialog,
	dialogManager,
	Input,
	Select,
	SelectOption,
	Switch,
	toast,
	useDialog,
	type UseDialogProps,
} from "@spacedrive/primitives";
import type {
	ArchiveFormat,
	FileArchiveInput,
	FileExtractInput,
	MergeConflictPolicy,
	SdPath,
} from "@sd/ts-client";
import {
	useLibraryMutation,
	useLibraryPreview,
	useLibraryValidate,
} from "../../contexts/SpacedriveContext";
import { usePlanPreviewStore } from "../../routes/explorer/hooks/usePlanPreview";
import { useI18n, type TranslationKey } from "../../i18n";
import { hasErrors, pathName, pathString, PreflightPanel } from "./PreflightPanel";
import { BrowseButton, describeError, Failure, useSubmitOnEnter } from "./RearrangeModal";

const EXTENSIONS: Record<ArchiveFormat, string> = { zip: "zip", tar_zstd: "tar.zst" };

interface ArchiveDialogProps {
	id: number;
	sources: SdPath[];
	/** The folder the archive is written in. */
	directory: SdPath;
	onComplete?: () => void;
}

/**
 * Write an archive of the selection beside it, zip or tar with zstd, after
 * validation checks the name and the space; the plan is one create with the
 * sources' bytes.
 */
export function useArchiveDialog() {
	return (options: Omit<ArchiveDialogProps, "id">) =>
		dialogManager.create((props: UseDialogProps) => (
			<ArchiveDialog {...(props as ArchiveDialogProps)} {...options} />
		));
}

function ArchiveDialog(props: ArchiveDialogProps) {
	const { t } = useI18n();
	const dialog = useDialog(props);
	const form = useForm();
	const [format, setFormat] = useState<ArchiveFormat>("zip");
	const [stem, setStem] = useState(
		props.sources.length === 1 ? pathName(props.sources[0]).replace(/\.[^.]+$/, "") : t("modals.archive.defaultName"),
	);
	const [removeSources, setRemoveSources] = useState(false);
	const [failure, setFailure] = useState<string | null>(null);

	const input = useMemo<FileArchiveInput>(
		() => ({
			sources: props.sources,
			destination: join(props.directory, `${stem || t("modals.archive.defaultName")}.${EXTENSIONS[format]}`),
			format,
			remove_sources: removeSources,
		}),
		[props.sources, props.directory, stem, format, removeSources, t],
	);
	const validation = useLibraryValidate({ type: "files.archive", input });
	const preview = useLibraryPreview({ type: "files.archive", input });
	const archive = useLibraryMutation("files.archive");
	const enterPreview = usePlanPreviewStore((state) => state.enter);

	const refused = hasErrors(validation.data);
	const close = () => dialogManager.setState(props.id, { open: false });

	const submit = async () => {
		setFailure(null);
		try {
			await archive.mutateAsync(input);
			toast.success(t("modals.archive.toastWriting", { name: pathName(input.destination) }));
			close();
			props.onComplete?.();
		} catch (error) {
			setFailure(describeError(error));
		}
	};

	const browse = () => {
		if (!preview.data) return;
		enterPreview({
			source: { type: "files.archive", input },
			plan: preview.data,
			label: t("modals.archive.previewArchive", { count: props.sources.length }),
		});
		close();
	};

	useSubmitOnEnter(() => void submit(), !refused && !archive.isPending);

	return (
		<Dialog
			dialog={dialog}
			form={form}
			title={
				props.sources.length === 1
					? t("modals.archive.compress", { name: pathName(props.sources[0]) })
					: t("modals.archive.compressItems", { count: props.sources.length })
			}
			icon={<FileZip size={20} weight="bold" />}
			ctaLabel={t("modals.archive.ctaCompress")}
			submitDisabled={refused || validation.isLoading || archive.isPending}
			loading={archive.isPending}
			onSubmit={form.handleSubmit(submit)}
			onCancelled={close}
			formClassName="!min-w-[520px] !max-w-[520px]"
		>
			<div className="space-y-4 py-1">
				<div className="flex items-center gap-2">
					<Input
						size="sm"
						className="flex-1"
						value={stem}
						onChange={(event) => setStem(event.target.value)}
						placeholder={t("modals.archive.placeholderName")}
					/>
					<Select<ArchiveFormat> value={format} size="sm" onChange={setFormat}>
						<SelectOption value="zip">.zip</SelectOption>
						<SelectOption value="tar_zstd">.tar.zst</SelectOption>
					</Select>
				</div>
				<div className="text-[11px] text-ink-dull">
					{t("modals.archive.noteWritten", { dir: pathName(props.directory) })}
				</div>

				<label className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-app-box px-3 py-2">
					<div>
						<div className="text-sm text-ink">{t("modals.archive.removeSources")}</div>
						<div className="text-[11px] text-ink-dull">
							{t("modals.archive.removeSourcesDesc")}
						</div>
					</div>
					<Switch checked={removeSources} onCheckedChange={setRemoveSources} size="sm" />
				</label>

				<PreflightPanel
					validation={validation.data}
					validating={validation.isFetching}
					plan={preview.data}
					planning={preview.isFetching}
					planError={preview.error}
				/>
				{failure && <Failure message={failure} />}
				<BrowseButton disabled={!preview.data} onClick={browse} />
			</div>
		</Dialog>
	);
}

interface ExtractDialogProps {
	id: number;
	archive: SdPath;
	/** The folder the entries are written into. */
	directory: SdPath;
	onComplete?: () => void;
}

const POLICIES: {
	value: MergeConflictPolicy;
	labelKey: TranslationKey;
	hintKey: TranslationKey;
}[] = [
	{
		value: "skip",
		labelKey: "modals.archive.policy.skip",
		hintKey: "modals.archive.policy.skipHint",
	},
	{
		value: "overwrite",
		labelKey: "modals.archive.policy.overwrite",
		hintKey: "modals.archive.policy.overwriteHint",
	},
	{
		value: "keep_both",
		labelKey: "modals.archive.policy.keepBoth",
		hintKey: "modals.archive.policy.keepBothHint",
	},
	{
		value: "keep_newer",
		labelKey: "modals.archive.policy.keepNewer",
		hintKey: "modals.archive.policy.keepNewerHint",
	},
];

/**
 * Extract an archive into a folder, planned from the archive's own
 * directory: a create, replace or skip per entry, and an entry that would
 * land outside the folder refuses the extract.
 */
export function useExtractDialog() {
	return (options: Omit<ExtractDialogProps, "id">) =>
		dialogManager.create((props: UseDialogProps) => (
			<ExtractDialog {...(props as ExtractDialogProps)} {...options} />
		));
}

function ExtractDialog(props: ExtractDialogProps) {
	const { t } = useI18n();
	const dialog = useDialog(props);
	const form = useForm();
	const [policy, setPolicy] = useState<MergeConflictPolicy>("skip");
	const [strip, setStrip] = useState(0);
	const [failure, setFailure] = useState<string | null>(null);

	const input = useMemo<FileExtractInput>(
		() => ({
			archive: props.archive,
			destination: props.directory,
			on_conflict: policy,
			strip_components: strip,
		}),
		[props.archive, props.directory, policy, strip],
	);
	const validation = useLibraryValidate({ type: "files.extract", input });
	const preview = useLibraryPreview({ type: "files.extract", input });
	const extract = useLibraryMutation("files.extract");
	const enterPreview = usePlanPreviewStore((state) => state.enter);

	const refused = hasErrors(validation.data);
	const summary = preview.data?.summary;
	const close = () => dialogManager.setState(props.id, { open: false });

	const submit = async () => {
		setFailure(null);
		try {
			await extract.mutateAsync(input);
			toast.success(t("modals.archive.toastExtracting", { name: pathName(props.archive) }));
			close();
			props.onComplete?.();
		} catch (error) {
			setFailure(describeError(error));
		}
	};

	const browse = () => {
		if (!preview.data) return;
		enterPreview({
			source: { type: "files.extract", input },
			plan: preview.data,
			label: t("modals.archive.extract", { name: pathName(props.archive) }),
		});
		close();
	};

	useSubmitOnEnter(() => void submit(), !refused && !extract.isPending);

	return (
		<Dialog
			dialog={dialog}
			form={form}
			title={t("modals.archive.extract", { name: pathName(props.archive) })}
			icon={<FileArchive size={20} weight="bold" />}
			ctaLabel={
				summary
					? t("modals.archive.ctaExtractCount", {
							count: summary.creates.files + summary.replaces.files,
						})
					: t("modals.archive.ctaExtract")
			}
			submitDisabled={refused || validation.isLoading || extract.isPending}
			loading={extract.isPending}
			onSubmit={form.handleSubmit(submit)}
			onCancelled={close}
			formClassName="!min-w-[520px] !max-w-[520px]"
		>
			<div className="space-y-4 py-1">
				<div className="text-sm text-ink-dull">
					{t("modals.archive.extractDesc", { dir: pathName(props.directory) })}
				</div>
				<div className="space-y-1">
					<div className="text-xs font-medium text-ink-dull">{t("modals.archive.whenAlreadyThere")}</div>
					<div className="grid grid-cols-2 gap-1">
						{POLICIES.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => setPolicy(option.value)}
								className={
									policy === option.value
										? "rounded-md bg-accent px-2.5 py-1.5 text-left text-white"
										: "rounded-md bg-app-box px-2.5 py-1.5 text-left text-ink hover:bg-app-hover"
								}
							>
								<div className="text-sm font-medium">
									{t(option.labelKey)}
								</div>
								<div className="text-[11px] opacity-70">
									{t(option.hintKey)}
								</div>
							</button>
						))}
					</div>
				</div>
				<label className="flex items-center justify-between gap-3 rounded-md bg-app-box px-3 py-2 text-sm text-ink">
					<div>
						<div>{t("modals.archive.dropLeading")}</div>
						<div className="text-[11px] text-ink-dull">
							{t("modals.archive.dropLeadingDesc")}
						</div>
					</div>
					<Input
						size="xs"
						type="number"
						min={0}
						className="w-16"
						value={strip}
						onChange={(event) =>
							setStrip(Math.max(0, Math.floor(Number(event.target.value) || 0)))
						}
					/>
				</label>

				<PreflightPanel
					validation={validation.data}
					validating={validation.isFetching}
					plan={preview.data}
					planning={preview.isFetching}
					planError={preview.error}
				/>
				{failure && <Failure message={failure} />}
				<BrowseButton disabled={!preview.data} onClick={browse} />
			</div>
		</Dialog>
	);
}

/** Whether a file's name says it is an archive this build extracts. */
export function isArchiveName(name: string): boolean {
	const lower = name.toLowerCase();
	return lower.endsWith(".zip") || lower.endsWith(".tar.zst") || lower.endsWith(".tzst");
}

function join(directory: SdPath, name: string): SdPath {
	if ("Physical" in directory) {
		const base = pathString(directory).replace(/\/+$/, "");
		return { Physical: { device_slug: directory.Physical.device_slug, path: `${base}/${name}` } };
	}
	return directory;
}
