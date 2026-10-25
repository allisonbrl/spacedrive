import {Plus} from '@phosphor-icons/react';
import {CircleButton} from '@spacedrive/primitives';
import {useNavigate} from 'react-router-dom';
import {TopBarItem, TopBarPortal} from '../../TopBar';
import {useAddToLibraryDialog} from '../explorer/components/AddToLibraryModal';
import {useI18n} from '../../i18n';

interface OverviewTopBarProps {
	libraryName?: string;
}

/** Home owns the first storage action; library scope lives in the sidebar. */
export function OverviewTopBar(_props: OverviewTopBarProps) {
	const navigate = useNavigate();
	const openAddToLibrary = useAddToLibraryDialog();
	const {t} = useI18n();

	const addStorage = () => {
		openAddToLibrary({
			onAdded: (path) => {
				navigate(
					`/explorer?path=${encodeURIComponent(JSON.stringify(path))}`
				);
			}
		});
	};

	return (
		<TopBarPortal
			left={
				<TopBarItem id="home-title" label={t('overview.topBar.home')} priority="high">
					<h1 className="text-ink text-xl font-bold">{t('overview.topBar.home')}</h1>
				</TopBarItem>
			}
			right={
				<TopBarItem
					id="add-storage"
					label={t('overview.topBar.addStorage')}
					priority="high"
				>
					<CircleButton
						icon={Plus}
						className="!bg-accent hover:!bg-accent-deep !text-white"
						onClick={addStorage}
					>
						{t('overview.topBar.addStorage')}
					</CircleButton>
				</TopBarItem>
			}
		/>
	);
}
