import {Tag as TagIcon} from '@phosphor-icons/react';
import type {Tag} from '@sd/ts-client';
import {Button, toast} from '@spacedrive/primitives';
import clsx from 'clsx';
import {AnimatePresence, motion} from 'framer-motion';
import {tagColor} from '../../components/Tags';
import {
	useLibraryMutation,
	useNormalizedQuery
} from '../../contexts/SpacedriveContext';
import {useKeybind} from '../../hooks/useKeybind';
import {useI18n} from '../../i18n';
import {useSelection} from './SelectionContext';

interface TagAssignmentModeProps {
	isActive: boolean;
	onExit: () => void;
}

/**
 * Tag Assignment Mode - Quick keyboard-driven tagging
 *
 * Features:
 * - Toggle tags with number keys (1-9, 0)
 * - Switch palettes with Cmd+Shift+[1-9]
 * - Visual feedback for applied tags
 * - Works on selected files
 */
export function TagAssignmentMode({isActive, onExit}: TagAssignmentModeProps) {
	const {t} = useI18n();
	const {selectedFiles} = useSelection();
	const applyTag = useLibraryMutation('tags.apply');
	const unapplyTag = useLibraryMutation('tags.unapply');

	// Fetch all tags (for now, we'll use the first 10 as the default palette)
	// TODO: Implement user-defined palettes
	const {data: tagsData} = useNormalizedQuery<
		{query: string; limit: number | null},
		{tags: Tag[]}
	>({
		query: 'tags.search',
		input: {query: '', limit: null},
		resourceType: 'tag'
	});

	const paletteTags = (tagsData?.tags ?? []).slice(0, 10);

	// Keyboard shortcuts using keybind registry
	useKeybind('explorer.exitTagMode', onExit, {enabled: isActive});
	useKeybind('explorer.toggleTag1', () => handleToggleTag(0), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag2', () => handleToggleTag(1), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag3', () => handleToggleTag(2), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag4', () => handleToggleTag(3), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag5', () => handleToggleTag(4), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag6', () => handleToggleTag(5), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag7', () => handleToggleTag(6), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag8', () => handleToggleTag(7), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag9', () => handleToggleTag(8), {
		enabled: isActive
	});
	useKeybind('explorer.toggleTag10', () => handleToggleTag(9), {
		enabled: isActive
	});

	const handleToggleTag = async (index: number) => {
		const tag = paletteTags[index];
		if (!tag || selectedFiles.length === 0) return;

		// Tag the records. The daemon attaches the content key where hashing
		// has reached the file and binds it later where it has not, so
		// nothing here waits on identification.
		const targets = {
			type: 'File' as const,
			ids: selectedFiles.map((f) => f.id)
		};

		try {
			if (isTagActive(tag)) {
				await unapplyTag.mutateAsync({targets, tag_ids: [tag.id]});
			} else {
				await applyTag.mutateAsync({targets, tag_ids: [tag.id]});
			}
		} catch (err) {
			console.error('Failed to toggle tag:', err);
			// The one honest refusal left: a tag has to live in a source
			// store, and a path outside every tracked source has none.
			const message = String(err).includes('no tracked source')
				? t('explorer.tags.sourceRequired')
				: t('explorer.tags.toggleError', {error: String(err)});
			toast.error(message);
		}
	};

	// Check if a tag is active (all selected files have it)
	const isTagActive = (tag: Tag) => {
		if (selectedFiles.length === 0) return false;
		return selectedFiles.every((file) =>
			file.tags?.some((t) => t.id === tag.id)
		);
	};

	if (!isActive) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{y: 100, opacity: 0}}
				animate={{y: 0, opacity: 1}}
				exit={{y: 100, opacity: 0}}
				transition={{duration: 0.2, ease: [0.25, 1, 0.5, 1]}}
				className="absolute bottom-2 left-1 right-1 z-50"
			>
				<div className="bg-sidebar/80 border-sidebar-line/50 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-xl">
					<div className="flex items-center gap-3">
						{/* Mode Label */}
						<div className="flex items-center gap-2">
							<TagIcon
								size={16}
								weight="bold"
								className="text-accent"
							/>
							<span className="text-sidebar-ink text-sm font-semibold">
								{t('explorer.tags.mode')}
							</span>
							{selectedFiles.length > 0 && (
								<span className="text-sidebar-inkDull text-xs">
									{t(
										selectedFiles.length === 1
											? 'explorer.tags.items_one'
											: 'explorer.tags.items_other',
										{count: selectedFiles.length}
									)}
								</span>
							)}
						</div>

						{/* Palette Tags */}
						<div className="flex flex-1 gap-1.5">
							{paletteTags.map((tag, index) => {
								const active = isTagActive(tag);
								const number = index === 9 ? 0 : index + 1;

								return (
									<button
										key={tag.id}
										onClick={() => handleToggleTag(index)}
										className={clsx(
											'inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium transition-all',
											active
												? 'scale-105 shadow-md'
												: 'hover:scale-105'
										)}
										style={{
											backgroundColor: active
												? `${tagColor(tag)}40`
												: `${tagColor(tag)}20`,
											color: tagColor(tag)
										}}
									>
										{/* Keyboard Number */}
										<kbd className="min-w-[16px] rounded bg-black/20 px-1 py-0.5 text-center text-[10px] font-bold">
											{number}
										</kbd>

										{/* Tag Name */}
										<span className="max-w-[120px] truncate">
											{tag.name}
										</span>

										{/* Active Checkmark */}
										{active && (
											<span className="text-xs">✓</span>
										)}
									</button>
								);
							})}
						</div>

						{/* Exit Button */}
						<Button size="sm" variant="accent" onClick={onExit}>
							{t('common.done')}
						</Button>
					</div>

					{/* Help Text */}
					{selectedFiles.length === 0 && (
						<div className="text-sidebar-inkFaint mt-2 text-center text-xs">
							{t('explorer.tags.instructions')}
						</div>
					)}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
