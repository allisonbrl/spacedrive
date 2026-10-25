/**
 * The trash: what Spacedrive put there with a known location, newest
 * first, with restore through undo and emptying.
 */

import {ArrowCounterClockwise, Trash} from '@phosphor-icons/react';
import type {TrashedItem} from '@sd/ts-client';
import {Button, Switch, toast} from '@spacedrive/primitives';
import clsx from 'clsx';
import {useState} from 'react';
import {useUndoDialog} from '../../components/modals/UndoModal';
import {
	useLibraryMutation,
	useLibraryQuery
} from '../../contexts/SpacedriveContext';
import {useI18n} from '../../i18n';
import {TopBarItem, TopBarPortal} from '../../TopBar';
import {formatBytes} from '../explorer/utils';

export function TrashView() {
	const {t, formatDateTime} = useI18n();
	const [osTrash, setOsTrash] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const openUndo = useUndoDialog();
	const {data, isLoading, refetch} = useLibraryQuery({
		type: 'files.trash_list',
		input: {limit: 500}
	});
	const empty = useLibraryMutation('files.trash_empty');
	const items = data?.items ?? [];

	const restore = (item: TrashedItem) =>
		openUndo({
			job: item.job,
			label: t('trash.trashing', {name: name(item)}),
			effects: [item.sequence],
			onComplete: () => void refetch()
		});

	const emptyTrash = async () => {
		try {
			const output = await empty.mutateAsync({os_trash: osTrash});
			toast.success(
				`Removed ${output.purged + output.spacedrive_trash} items${
					output.os_trash_emptied
						? " and emptied the platform's trash"
						: ''
				}`
			);
			if (output.failed.length > 0) toast.error(output.failed.join('; '));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		}
		setConfirming(false);
		void refetch();
	};

	return (
		<>
			<TopBarPortal
				center={
					<TopBarItem
						id="trash-title"
						label={t('trash.title')}
						priority="high"
					>
						<div className="flex items-center gap-2">
							<Trash
								size={18}
								weight="bold"
								className="text-ink"
							/>
							<span className="text-ink text-sm font-semibold">
								{t('trash.title')}
							</span>
						</div>
					</TopBarItem>
				}
			/>
			<div className="bg-app/80 flex h-full flex-col overflow-hidden pt-1.5">
				<div className="flex items-center gap-3 px-4 py-2">
					<div className="text-ink-dull flex-1 text-xs">
						{data
							? t(
									items.length === 1
										? 'trash.count_one'
										: 'trash.count_other',
									{count: items.length}
								)
							: isLoading
								? t('trash.reading')
								: ''}
					</div>
					{confirming ? (
						<div className="bg-app-box flex items-center gap-3 rounded-md px-3 py-1.5 text-xs">
							<label className="text-ink flex items-center gap-2">
								<Switch
									checked={osTrash}
									onCheckedChange={setOsTrash}
									size="sm"
								/>
								{t('trash.platformToo')}
							</label>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => setConfirming(false)}
							>
								{t('common.cancel')}
							</Button>
							<Button
								type="button"
								size="sm"
								variant="colored"
								className="bg-red-500 text-white"
								disabled={empty.isPending}
								onClick={() => void emptyTrash()}
							>
								{t('trash.removeForGood')}
							</Button>
						</div>
					) : (
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={items.length === 0}
							onClick={() => setConfirming(true)}
						>
							{t('trash.empty')}
						</Button>
					)}
				</div>

				<div className="flex-1 overflow-auto px-4 pb-4">
					{items.length === 0 && !isLoading && (
						<div className="border-app-line bg-app-box/50 text-ink-dull rounded-lg border p-6 text-center text-sm">
							{t('trash.emptyState')}
						</div>
					)}
					<div className="space-y-1">
						{items.map((item) => (
							<div
								key={`${item.job}-${item.sequence}`}
								className={clsx(
									'border-app-line bg-app-box/50 flex items-center gap-3 rounded-lg border px-3 py-2 text-xs',
									!item.present && 'opacity-50'
								)}
							>
								<div className="min-w-0 flex-1">
									<div
										className="text-ink truncate"
										title={item.from}
									>
										{name(item)}
									</div>
									<div
										className="text-ink-faint truncate"
										title={item.location}
									>
										{t('trash.wasIn', {
											path: parent(item.from)
										})}{' '}
										· {formatDateTime(item.trashed_at)}
										{item.is_dir
											? ` · ${t('trash.folder')}`
											: ` · ${formatBytes(item.size)}`}
										{item.spacedrive_trash
											? ` · ${t('trash.spacedrive')}`
											: ''}
										{item.present
											? ''
											: ` · ${t('trash.noLongerPresent')}`}
									</div>
								</div>
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={!item.present}
									onClick={() => restore(item)}
								>
									<ArrowCounterClockwise
										className="mr-1 size-3.5"
										weight="bold"
									/>
									{t('trash.putBack')}
								</Button>
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	);
}

function name(item: TrashedItem): string {
	const parts = item.from.split('/').filter(Boolean);
	return parts[parts.length - 1] ?? item.from;
}

function parent(path: string): string {
	const parts = path.split('/').filter(Boolean);
	parts.pop();
	return `/${parts.join('/')}`;
}
