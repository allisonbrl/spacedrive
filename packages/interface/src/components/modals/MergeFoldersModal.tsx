import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, FolderOpen, FolderSimplePlus, Eye } from "@phosphor-icons/react";
import {
	Button,
	Dialog,
	dialogManager,
	Switch,
	toast,
	useDialog,
	type UseDialogProps,
} from "@spacedrive/primitives";
import type { FileMergeInput, MergeConflictPolicy, SdPath } from "@sd/ts-client";
import { RefusedError } from "@sd/ts-client";
import {
	useLibraryMutation,
	useLibraryPreview,
	useLibraryValidate,
} from "../../contexts/SpacedriveContext";
import { usePlanPreviewStore } from "../../routes/explorer/hooks/usePlanPreview";
import { useI18n } from "../../i18n";
import { hasErrors, pathName, PreflightPanel } from "./PreflightPanel";

interface MergeFoldersDialogProps {
	id: number;
	/** The folders to merge, in order. */
	sources: SdPath[];
	/** The existing folder they merge into. */
	destination: SdPath;
	policy?: MergeConflictPolicy;
	consume?: boolean;
	/** Remove from the destination what no source holds: a mirror. */
	removeExtras?: boolean;
	onComplete?: () => void;
}

const POLICIES: {
	value: MergeConflictPolicy;
	labelKey: string;
	hintKey: string;
	defaultLabel: string;
	defaultHint: string;
}[] = [
	{
		value: "skip",
		labelKey: "modals.mergeFolders.policy.skip",
		hintKey: "modals.mergeFolders.policy.skipHint",
		defaultLabel: "Keep existing",
		defaultHint: "a file that differs stays as it is",
	},
	{
		value: "overwrite",
		labelKey: "modals.mergeFolders.policy.overwrite",
		hintKey: "modals.mergeFolders.policy.overwriteHint",
		defaultLabel: "Overwrite",
		defaultHint: "the incoming file replaces it",
	},
	{
		value: "keep_both",
		labelKey: "modals.mergeFolders.policy.keepBoth",
		hintKey: "modals.mergeFolders.policy.keepBothHint",
		defaultLabel: "Keep both",
		defaultHint: "the incoming file is written beside it, numbered",
	},
	{
		value: "keep_newer",
		labelKey: "modals.mergeFolders.policy.keepNewer",
		hintKey: "modals.mergeFolders.policy.keepNewerHint",
		defaultLabel: "Keep newer",
		defaultHint: "the later modification time wins",
	},
];

/**
 * The merge dialog: validate and preview the merge as its options change,
 * gate confirm on an error finding, and dispatch the previewed input
 * unchanged.
 */
export function useMergeFoldersDialog() {
	return (options: Omit<MergeFoldersDialogProps, "id">) =>
		dialogManager.create((props: UseDialogProps) => (
			<MergeFoldersDialog {...(props as MergeFoldersDialogProps)} {...options} />
		));
}

function MergeFoldersDialog(props: MergeFoldersDialogProps) {
	const { t } = useI18n();
	const dialog = useDialog(props);
	const form = useForm();
	const [policy, setPolicy] = useState<MergeConflictPolicy>(props.policy ?? "skip");
	const [consume, setConsume] = useState(props.consume ?? false);
	const [removeExtras, setRemoveExtras] = useState(props.removeExtras ?? false);
	const [failure, setFailure] = useState<string | null>(null);

	const input = useMemo<FileMergeInput>(
		() => ({
			sources: { paths: props.sources },
			destination: props.destination,
			on_conflict: policy,
			consume_sources: consume,
			remove_extras: removeExtras,
		}),
		[props.sources, props.destination, policy, consume, removeExtras],
	);

	const validation = useLibraryValidate({ type: "files.merge", input });
	const preview = useLibraryPreview({ type: "files.merge", input });
	const merge = useLibraryMutation("files.merge");
	const enterPreview = usePlanPreviewStore((state) => state.enter);

	const refused = hasErrors(validation.data);
	const close = () => dialogManager.setState(props.id, { open: false });

	const submit = async () => {
		setFailure(null);
		try {
			await merge.mutateAsync(input);
			toast.success(t("modals.mergeFolders.toast", { name: pathName(props.destination) }));
			close();
			props.onComplete?.();
		} catch (error) {
			if (error instanceof RefusedError) {
				setFailure(error.validation.findings.map((finding) => finding.message).join("; "));
			} else {
				setFailure(error instanceof Error ? error.message : String(error));
			}
		}
	};

	const browse = () => {
		if (!preview.data) return;
		enterPreview({
			source: { type: "files.merge", input },
			plan: preview.data,
			label: t("modals.mergeFolders.previewLabel", {
				sources: props.sources.map(pathName).join(", "),
				destination: pathName(props.destination),
			}),
		});
		close();
	};

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.target as HTMLElement)?.tagName === "INPUT") return;
			if (event.key === "Enter" && !event.shiftKey && !refused && !merge.isPending) {
				event.preventDefault();
				void submit();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const summary = preview.data?.summary;
	const cta = summary
		? `${t("modals.mergeFolders.cta", {
				count: summary.creates.files + summary.replaces.files,
			})}${
				removeExtras && summary.deletes.files > 0
					? t("modals.mergeFolders.ctaRemove", { count: summary.deletes.files })
					: ""
			}`
		: t("modals.mergeFolders.ctaMerge");

	return (
		<Dialog
			dialog={dialog}
			form={form}
			title={t("modals.mergeFolders.title")}
			icon={<FolderSimplePlus size={20} weight="bold" />}
			ctaLabel={cta}
			submitDisabled={refused || validation.isLoading || merge.isPending}
			loading={merge.isPending}
			onSubmit={form.handleSubmit(submit)}
			onCancelled={close}
			formClassName="!min-w-[520px] !max-w-[520px]"
		>
			<div className="space-y-4 py-1">
				<div className="flex items-center gap-3 text-sm">
					<div className="min-w-0 flex-1">
						<div className="text-xs text-ink-dull">{t("modals.mergeFolders.merge")}</div>
						{props.sources.map((source) => (
							<div key={JSON.stringify(source)} className="truncate font-medium text-ink">
								{pathName(source)}
							</div>
						))}
					</div>
					<ArrowRight className="size-5 flex-shrink-0 text-accent" weight="bold" />
					<div className="min-w-0 flex-1">
						<div className="text-xs text-ink-dull">{t("modals.mergeFolders.into")}</div>
						<div className="flex items-center gap-1.5 truncate font-medium text-ink">
							<FolderOpen className="size-4 flex-shrink-0 text-accent" weight="fill" />
							{pathName(props.destination)}
						</div>
					</div>
				</div>

				<div className="space-y-1">
					<div className="text-xs font-medium text-ink-dull">{t("modals.mergeFolders.whenDiffers")}</div>
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
									{(t(option.labelKey as any) as string) || option.defaultLabel}
								</div>
								<div className="text-[11px] opacity-70">
									{(t(option.hintKey as any) as string) || option.defaultHint}
								</div>
							</button>
						))}
					</div>
				</div>

				<label className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-app-box px-3 py-2">
					<div>
						<div className="text-sm text-ink">{t("modals.mergeFolders.consume")}</div>
						<div className="text-[11px] text-ink-dull">
							{t("modals.mergeFolders.consumeDesc")}
						</div>
					</div>
					<Switch checked={consume} onCheckedChange={setConsume} size="sm" />
				</label>

				<label className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-app-box px-3 py-2">
					<div>
						<div className="text-sm text-ink">{t("modals.mergeFolders.removeExtras")}</div>
						<div className="text-[11px] text-ink-dull">
							{t("modals.mergeFolders.removeExtrasDesc")}
						</div>
					</div>
					<Switch checked={removeExtras} onCheckedChange={setRemoveExtras} size="sm" />
				</label>

				<PreflightPanel
					validation={validation.data}
					validating={validation.isFetching}
					plan={preview.data}
					planning={preview.isFetching}
					planError={preview.error}
				/>

				{failure && (
					<div className="rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-2 text-xs text-red-500">
						{failure}
					</div>
				)}

				<div className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!preview.data}
						onClick={browse}
					>
						<Eye className="mr-1.5 size-4" weight="bold" />
						{t("modals.mergeFolders.browseResult")}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
