/**
 * Duplicates: content this machine holds more than once, grouped by its
 * bytes, with a keeper chosen per group and one dialog to remove the rest.
 */

import { ArrowLeft, Stack } from "@phosphor-icons/react";
import { Button, CircleButton } from "@spacedrive/primitives";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DuplicateGroup } from "@sd/ts-client";
import { useDeleteDialog } from "../../components/modals/DeleteModal";
import { useCoreQuery } from "../../contexts/SpacedriveContext";
import { TopBarItem, TopBarPortal } from "../../TopBar";
import { formatBytes } from "../explorer/utils";
import { useI18n } from "../../i18n";

const SIZES_CONFIG = [
	{ key: "redundancy.duplicates.sizes.any" as const, bytes: 0 },
	{ key: "redundancy.duplicates.sizes.1mb" as const, bytes: 1024 * 1024 },
	{ key: "redundancy.duplicates.sizes.100mb" as const, bytes: 100 * 1024 * 1024 },
	{ key: "redundancy.duplicates.sizes.1gb" as const, bytes: 1024 * 1024 * 1024 },
];

export function DuplicatesView() {
	const navigate = useNavigate();
	const { t, formatNumber } = useI18n();
	const [minSize, setMinSize] = useState(SIZES_CONFIG[1].bytes);
	/** The chosen keeper per group, by content id; the first copy otherwise. */
	const [keepers, setKeepers] = useState<Record<string, string>>({});
	/** Groups left out of the removal, by content id. */
	const [excluded, setExcluded] = useState<Record<string, boolean>>({});
	const openDelete = useDeleteDialog();

	const sizes = useMemo(
		() =>
			SIZES_CONFIG.map((size) => ({
				label: t(size.key),
				bytes: size.bytes,
			})),
		[t],
	);

	const { data, isLoading, refetch } = useCoreQuery({
		type: "files.duplicates",
		input: { min_size: minSize, limit: 200, source: null },
	});
	const groups = data?.groups ?? [];

	const keeperOf = (group: DuplicateGroup) =>
		group.copies.find((copy) => copy.path === keepers[group.content]) ?? group.copies[0];

	const selected = useMemo(
		() => groups.filter((group) => !excluded[group.content]),
		[groups, excluded],
	);
	const reclaimable = selected.reduce((sum, group) => sum + group.reclaimable, 0);

	const remove = () => {
		if (selected.length === 0) return;
		openDelete({
			title: t('redundancy.duplicates.removeTitle', {
				count: formatNumber(selected.length)
			}),
			targets: {
				kind: "duplicates",
				duplicates: {
					scope: null,
					keep: {
						kind: "these",
						paths: selected.map((group) => keeperOf(group).sd_path),
					},
					min_size: null,
				},
			},
			onComplete: () => void refetch(),
		});
	};

	const titleItem = (
		<div className="flex items-center gap-2">
			<CircleButton
				icon={ArrowLeft}
				title={t('redundancy.duplicates.back')}
				onClick={() => navigate("/redundancy")}
			/>
			<Stack size={18} weight="bold" className="text-ink" />
			<span className="text-sm font-semibold text-ink">{t('redundancy.duplicates.title')}</span>
		</div>
	);

	return (
		<>
			<TopBarPortal
				center={
					<TopBarItem id="redundancy-duplicates-title" label={t('redundancy.duplicates.title')} priority="high">
						{titleItem}
					</TopBarItem>
				}
			/>
			<div className="flex h-full flex-col overflow-hidden bg-app/80 pt-1.5">
				<div className="flex items-center gap-2 px-4 py-2">
					<div className="flex gap-1">
						{sizes.map((size) => (
							<button
								key={size.bytes}
								type="button"
								onClick={() => setMinSize(size.bytes)}
								className={clsx(
									"rounded-md px-2.5 py-1 text-xs transition-colors",
									minSize === size.bytes
										? "bg-accent text-white"
										: "bg-app-box text-ink hover:bg-app-hover",
								)}
							>
								{size.label}
							</button>
						))}
					</div>
					<div className="flex-1 text-xs text-ink-dull">
						{data
							? t('redundancy.duplicates.summary', {
									groups: formatNumber(groups.length),
									sources: formatNumber(data.sources_queried),
									size: formatBytes(reclaimable)
								})
							: isLoading
								? t('redundancy.duplicates.looking')
								: ""}
					</div>
					<Button
						type="button"
						variant="accent"
						size="sm"
						disabled={selected.length === 0}
						onClick={remove}
					>
						{t('redundancy.duplicates.removeButton')}
					</Button>
				</div>

				<div className="flex-1 overflow-auto px-4 pb-4">
					{groups.length === 0 && !isLoading && (
						<div className="rounded-lg border border-app-line bg-app-box/50 p-6 text-center text-sm text-ink-dull">
							{t('redundancy.duplicates.empty')}
						</div>
					)}
					<div className="space-y-2">
						{groups.map((group) => {
							const keeper = keeperOf(group);
							const included = !excluded[group.content];
							return (
								<div
									key={group.content}
									className={clsx(
										"rounded-lg border border-app-line bg-app-box/50 p-3",
										!included && "opacity-50",
									)}
								>
									<div className="mb-2 flex items-center gap-3 text-xs">
										<label className="flex items-center gap-1.5 text-ink">
											<input
												type="checkbox"
												className="size-3.5 accent-accent"
												checked={included}
												onChange={(event) =>
													setExcluded((state) => ({
														...state,
														[group.content]: !event.target.checked,
													}))
												}
											/>
											{t('redundancy.duplicates.copiesOf', {
												count: formatNumber(group.copies.length),
												size: formatBytes(group.size)
											})}
										</label>
										<span className="text-ink-faint">
											{t('redundancy.duplicates.reclaimable', {
												size: formatBytes(group.reclaimable)
											})}
										</span>
									</div>
									<div className="space-y-0.5">
										{group.copies.map((copy) => {
											const kept = copy.path === keeper.path;
											return (
												<label
													key={copy.path}
													className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-app-hover"
												>
													<input
														type="radio"
														name={`keep-${group.content}`}
														className="size-3.5 accent-accent"
														checked={kept}
														onChange={() =>
															setKeepers((state) => ({
																...state,
																[group.content]: copy.path,
															}))
														}
													/>
													<span
														className={clsx(
															"w-14 flex-shrink-0 font-medium",
															kept ? "text-accent" : "text-red-500",
														)}
													>
														{kept ? t('redundancy.duplicates.keep') : t('redundancy.duplicates.remove')}
													</span>
													<span
														className={clsx(
															"truncate",
															kept ? "text-ink" : "text-ink-dull line-through decoration-red-500/60",
														)}
														title={copy.path}
													>
														{copy.path}
													</span>
												</label>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
}
