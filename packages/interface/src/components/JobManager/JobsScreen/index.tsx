import {FunnelSimple, X} from '@phosphor-icons/react';
import {CircleButton} from '@spacedrive/primitives';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useSyncCount} from '../../SyncMonitor/hooks/useSyncCount';
import {useJobsContext} from '../hooks/JobsContext';
import {JobRow} from './JobRow';
import {useI18n} from '../../../i18n';

export function JobsScreen() {
	const {t} = useI18n();
	const navigate = useNavigate();
	const {jobs, pause, resume, cancel} = useJobsContext();
	const {onlinePeerCount, isSyncing} = useSyncCount();
	const [showOnlyRunning, setShowOnlyRunning] = useState(false);

	// Filter jobs based on toggle
	const filteredJobs = showOnlyRunning
		? jobs.filter(
				(job) => job.status === 'running' || job.status === 'paused'
			)
		: jobs;

	// Group jobs by status
	const runningJobs = filteredJobs.filter((j) => j.status === 'running');
	const pausedJobs = filteredJobs.filter((j) => j.status === 'paused');
	const queuedJobs = filteredJobs.filter((j) => j.status === 'queued');
	const completedJobs = filteredJobs.filter((j) => j.status === 'completed');
	const failedJobs = filteredJobs.filter((j) => j.status === 'failed');

	return (
		<div className="bg-app flex h-full flex-col">
			{/* Header */}
			<div className="bg-app/80 border-app-line sticky top-0 z-10 border-b backdrop-blur-xl">
				<div className="flex items-center justify-between px-6 py-4">
					<div className="flex items-center gap-4">
						<h1 className="text-ink text-2xl font-bold">
							{t('jobs.screen.title')}
						</h1>
						<div className="text-ink-dull flex items-center gap-2 text-sm">
							<span>{t('jobs.screen.total', { count: jobs.length })}</span>
							{runningJobs.length > 0 && (
								<>
									<span>•</span>
									<span>{t('jobs.screen.running', { count: runningJobs.length })}</span>
								</>
							)}
							{isSyncing && (
								<>
									<span>•</span>
									<span>{t('jobs.screen.syncing')}</span>
								</>
							)}
							{onlinePeerCount > 0 && (
								<>
									<span>•</span>
									<span>
										{t('jobs.screen.peersOnline', { count: onlinePeerCount })}
									</span>
								</>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						{/* Filter toggle */}
						<CircleButton
							icon={FunnelSimple}
							active={showOnlyRunning}
							onClick={() => setShowOnlyRunning(!showOnlyRunning)}
							title={
								showOnlyRunning
									? t('jobs.popover.showAll')
									: t('jobs.popover.showOnlyActive')
							}
						/>

						{/* Back button */}
						<CircleButton
							icon={X}
							onClick={() => navigate(-1)}
							title={t('jobs.screen.goBack')}
						/>
					</div>
				</div>

				{/* Column headers */}
				<div className="text-ink-dull bg-app-box/30 border-app-line/30 flex items-center gap-4 border-t px-4 py-2 text-xs font-medium uppercase tracking-wide">
					<div className="w-10 flex-shrink-0" /> {/* Icon spacer */}
					<div className="flex min-w-0 flex-1 items-center gap-6">
						<div className="flex-1">{t('jobs.table.name')}</div>
						<div className="w-32 flex-shrink-0">{t('jobs.table.duration')}</div>
						<div className="w-24 flex-shrink-0 text-right">
							{t('jobs.table.time')}
						</div>
						<div className="w-20 flex-shrink-0 text-right">
							{t('jobs.table.status')}
						</div>
					</div>
					<div className="w-6 flex-shrink-0" />{' '}
					{/* Action button spacer */}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{filteredJobs.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<p className="text-ink-dull text-sm">
								{t('jobs.screen.noJobsFound')}
							</p>
						</div>
					</div>
				) : (
					<div>
						{/* Running Jobs */}
						{runningJobs.length > 0 && (
							<JobSection
								title={t('jobs.section.running')}
								count={runningJobs.length}
							>
								{runningJobs.map((job) => (
									<JobRow
										key={job.id}
										job={job}
										onPause={pause}
										onResume={resume}
										onCancel={cancel}
									/>
								))}
							</JobSection>
						)}

						{/* Paused Jobs */}
						{pausedJobs.length > 0 && (
							<JobSection
								title={t('jobs.section.paused')}
								count={pausedJobs.length}
							>
								{pausedJobs.map((job) => (
									<JobRow
										key={job.id}
										job={job}
										onPause={pause}
										onResume={resume}
										onCancel={cancel}
									/>
								))}
							</JobSection>
						)}

						{/* Queued Jobs */}
						{queuedJobs.length > 0 && (
							<JobSection
								title={t('jobs.section.queued')}
								count={queuedJobs.length}
							>
								{queuedJobs.map((job) => (
									<JobRow
										key={job.id}
										job={job}
										onPause={pause}
										onResume={resume}
										onCancel={cancel}
									/>
								))}
							</JobSection>
						)}

						{/* Completed Jobs */}
						{completedJobs.length > 0 && (
							<JobSection
								title={t('jobs.section.completed')}
								count={completedJobs.length}
							>
								{completedJobs.map((job) => (
									<JobRow
										key={job.id}
										job={job}
										onPause={pause}
										onResume={resume}
										onCancel={cancel}
									/>
								))}
							</JobSection>
						)}

						{/* Failed Jobs */}
						{failedJobs.length > 0 && (
							<JobSection
								title={t('jobs.section.failed')}
								count={failedJobs.length}
							>
								{failedJobs.map((job) => (
									<JobRow
										key={job.id}
										job={job}
										onPause={pause}
										onResume={resume}
										onCancel={cancel}
									/>
								))}
							</JobSection>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

interface JobSectionProps {
	title: string;
	count: number;
	children: React.ReactNode;
}

function JobSection({title, count, children}: JobSectionProps) {
	return (
		<div>
			<div className="bg-app-box/50 border-app-line/50 sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-2 backdrop-blur-sm">
				<h2 className="text-ink text-xs font-semibold uppercase tracking-wide">
					{title}
				</h2>
				<span className="text-ink-dull text-xs">({count})</span>
			</div>
			<div>{children}</div>
		</div>
	);
}
