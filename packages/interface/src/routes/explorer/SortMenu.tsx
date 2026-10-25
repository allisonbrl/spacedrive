import {
	CalendarBlank,
	Camera,
	Check,
	FileText,
	Ruler,
	SortAscending,
	TextAa
} from '@phosphor-icons/react';
import type {DirectorySortBy, MediaSortBy} from '@sd/ts-client';
import {CircleButton} from '@spacedrive/primitives';
import clsx from 'clsx';
import {AnimatePresence, motion} from 'framer-motion';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useI18n} from '../../i18n';
import {
	sortOptionsFor,
	type ExplorerSortBy,
	type ExplorerViewMode
} from './sortOptions';

interface SortMenuPanelProps {
	sortBy: DirectorySortBy | MediaSortBy;
	onSortChange: (sort: DirectorySortBy | MediaSortBy) => void;
	viewMode: ExplorerViewMode;
}

const SORT_ICONS: Record<ExplorerSortBy, typeof TextAa> = {
	name: TextAa,
	modified: CalendarBlank,
	created: CalendarBlank,
	datetaken: Camera,
	size: Ruler,
	type: FileText
};

export function SortMenuPanel({
	sortBy,
	onSortChange,
	viewMode
}: SortMenuPanelProps) {
	const {t} = useI18n();
	const sortOptions = sortOptionsFor(viewMode, t).map((option) => ({
		...option,
		icon: SORT_ICONS[option.value]
	}));

	return (
		<div className="bg-app-box border-app-line w-56 overflow-hidden rounded-lg border shadow-lg">
			<div className="text-sidebar-ink border-app-line border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider">
				{t('explorer.sort.heading')}
			</div>

			<div className="py-1">
				{sortOptions.map((option) => {
					const Icon = option.icon;
					const isActive = sortBy === option.value;

					return (
						<button
							key={option.value}
							onClick={() => {
								onSortChange(option.value);
							}}
							className={clsx(
								'hover:bg-app-hover flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
								isActive ? 'text-accent' : 'text-ink'
							)}
						>
							<Icon className="size-4" weight="bold" />
							<span className="flex-1 text-left">
								{option.label}
							</span>
							{isActive && (
								<Check className="size-4" weight="bold" />
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

interface SortMenuProps {
	sortBy: DirectorySortBy | MediaSortBy;
	onSortChange: (sort: DirectorySortBy | MediaSortBy) => void;
	viewMode: ExplorerViewMode;
	className?: string;
}

export function SortMenu({
	sortBy,
	onSortChange,
	viewMode,
	className
}: SortMenuProps) {
	const {t} = useI18n();
	const [isOpen, setIsOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({top: 0, right: 0});

	// Update position when opened
	useEffect(() => {
		if (isOpen && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + 8,
				right: window.innerWidth - rect.right
			});
		}
	}, [isOpen]);

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				panelRef.current &&
				buttonRef.current &&
				!panelRef.current.contains(e.target as Node) &&
				!buttonRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () =>
				document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen]);

	return (
		<>
			<div className={clsx(className)}>
				<CircleButton
					ref={buttonRef}
					icon={SortAscending}
					onClick={() => setIsOpen(!isOpen)}
					active={isOpen}
					title={t('explorer.sort.title')}
				/>
			</div>

			{isOpen &&
				createPortal(
					<AnimatePresence>
						<motion.div
							ref={panelRef}
							initial={{opacity: 0, y: -10}}
							animate={{opacity: 1, y: 0}}
							exit={{opacity: 0, y: -10}}
							transition={{duration: 0.15}}
							style={{
								position: 'fixed',
								top: `${position.top}px`,
								right: `${position.right}px`
							}}
							className="z-50"
						>
							<SortMenuPanel
								sortBy={sortBy}
								onSortChange={onSortChange}
								viewMode={viewMode}
							/>
						</motion.div>
					</AnimatePresence>,
					document.body
				)}
		</>
	);
}
