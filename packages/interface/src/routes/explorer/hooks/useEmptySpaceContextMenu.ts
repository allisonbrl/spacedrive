import {ArrowClockwise, Copy, FolderPlus} from '@phosphor-icons/react';
import {toast} from '@spacedrive/primitives';
import {useFileOperationDialog} from '../../../components/modals/FileOperationModal';
import {useLibraryMutation} from '../../../contexts/SpacedriveContext';
import {useClipboard} from '../../../hooks/useClipboard';
import {useContextMenu} from '../../../hooks/useContextMenu';
import {useI18n} from '../../../i18n';
import {useExplorer} from '../context';

export function useEmptySpaceContextMenu() {
	const {currentPath} = useExplorer();
	const {t} = useI18n();
	const createFolder = useLibraryMutation('files.createFolder');
	const generateThumbnails = useLibraryMutation('thumbs.generate');
	const clipboard = useClipboard();
	const openFileOperation = useFileOperationDialog();

	return useContextMenu({
		items: [
			{
				icon: ArrowClockwise,
				label: t('explorer.context.regenerateThumbnails'),
				condition: () => !!currentPath && 'Physical' in currentPath,
				onClick: async () => {
					if (!currentPath) return;
					try {
						await generateThumbnails.mutateAsync({
							scope: currentPath,
							recursive: true,
							mode: 'force'
						});
						toast.success(t('explorer.context.thumbnailStarted'));
					} catch (error) {
						toast.error(
							t('explorer.context.thumbnailError', {
								error: String(error)
							})
						);
					}
				}
			},
			{
				icon: FolderPlus,
				label: t('explorer.context.newFolder'),
				onClick: async () => {
					if (!currentPath) return;
					try {
						const result = await createFolder.mutateAsync({
							parent: currentPath,
							name: t('explorer.context.untitledFolder'),
							items: []
						});
						console.log('Created folder:', result);
					} catch (err) {
						console.error('Failed to create folder:', err);
						alert(
							t('explorer.context.createFolderError', {
								error: String(err)
							})
						);
					}
				},
				condition: () => !!currentPath
			},
			{
				icon: Copy,
				label: t('explorer.context.paste'),
				onClick: () => {
					if (!clipboard.hasClipboard() || !currentPath) {
						console.log(
							'[Clipboard] Nothing to paste or no destination'
						);
						return;
					}

					const operation =
						clipboard.operation === 'cut' ? 'move' : 'copy';

					console.groupCollapsed(
						`[Clipboard] Pasting ${clipboard.files.length} file${clipboard.files.length === 1 ? '' : 's'} (${operation})`
					);
					console.log('Operation:', operation);
					console.log('Destination:', currentPath);
					console.log('Source files (SdPath objects):');
					clipboard.files.forEach((file, index) => {
						console.log(
							`  [${index}]:`,
							JSON.stringify(file, null, 2)
						);
					});
					console.groupEnd();

					openFileOperation({
						operation,
						sources: clipboard.files,
						destination: currentPath,
						onComplete: () => {
							if (clipboard.operation === 'cut') {
								console.log(
									'[Clipboard] Operation completed, clearing clipboard'
								);
								clipboard.clearClipboard();
							} else {
								console.log(
									'[Clipboard] Copy operation completed'
								);
							}
						}
					});
				},
				keybindId: 'explorer.paste',
				condition: () => clipboard.hasClipboard()
			}
		]
	});
}
