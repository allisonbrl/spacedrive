import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import {useI18n} from '../../../i18n';

interface RedundancyVolumeBarProps {
	volumeUuid: string;
	displayName: string | null;
	totalBytes: number;
	atRiskBytes: number;
	atRiskFileCount: number;
	redundantBytes: number;
	redundantFileCount: number;
	totalFileCount: number;
}

export function RedundancyVolumeBar({
	volumeUuid,
	displayName,
	totalBytes,
	atRiskBytes,
	atRiskFileCount,
	redundantBytes,
	redundantFileCount,
	totalFileCount
}: RedundancyVolumeBarProps) {
	const navigate = useNavigate();
	const {t, formatNumber, formatBytes} = useI18n();

	const redundantPercent =
		totalBytes > 0 ? (redundantBytes / totalBytes) * 100 : 0;
	const atRiskPercent = totalBytes > 0 ? (atRiskBytes / totalBytes) * 100 : 0;
	// Remaining is unindexed content (no content_id)
	const unindexedPercent = Math.max(
		0,
		100 - redundantPercent - atRiskPercent
	);

	return (
		<div className="border-app-line bg-app-box/50 rounded-lg border p-3">
			{/* Header */}
			<div className="mb-2 flex items-center justify-between">
				<span className="text-ink truncate text-sm font-medium">
					{displayName || t('redundancy.volume.unknown')}
				</span>
				<span className="text-ink-dull text-xs">
					{t('redundancy.volume.files', { count: formatNumber(totalFileCount) })}
				</span>
			</div>

			{/* Bar */}
			<div className="bg-app-box flex h-3 w-full overflow-hidden rounded-full">
				{/* Redundant segment (safe) */}
				{redundantPercent > 0 && (
					<motion.div
						className="bg-status-success/70 hover:bg-status-success/90 h-full cursor-pointer"
						initial={{width: 0}}
						animate={{width: `${redundantPercent}%`}}
						transition={{
							duration: 0.6,
							ease: [0.25, 1, 0.5, 1]
						}}
						title={t('redundancy.volume.tooltipRedundant', {
							size: formatBytes(redundantBytes),
							count: formatNumber(redundantFileCount)
						})}
						onClick={() =>
							navigate(
								`/redundancy/at-risk?volume=${volumeUuid}&at_risk=false`
							)
						}
					/>
				)}
				{/* At-risk segment */}
				{atRiskPercent > 0 && (
					<motion.div
						className="bg-status-warning/70 hover:bg-status-warning/90 h-full cursor-pointer"
						initial={{width: 0}}
						animate={{width: `${atRiskPercent}%`}}
						transition={{
							duration: 0.6,
							ease: [0.25, 1, 0.5, 1],
							delay: 0.1
						}}
						title={t('redundancy.volume.tooltipAtRisk', {
							size: formatBytes(atRiskBytes),
							count: formatNumber(atRiskFileCount)
						})}
						onClick={() =>
							navigate(
								`/redundancy/at-risk?volume=${volumeUuid}&at_risk=true`
							)
						}
					/>
				)}
				{/* Unindexed segment */}
				{unindexedPercent > 0 && (
					<motion.div
						className="bg-app-line/50 h-full"
						initial={{width: 0}}
						animate={{width: `${unindexedPercent}%`}}
						transition={{
							duration: 0.6,
							ease: [0.25, 1, 0.5, 1],
							delay: 0.2
						}}
					/>
				)}
			</div>

			{/* Legend */}
			<div className="text-ink-dull mt-2 flex gap-4 text-xs">
				<div className="flex items-center gap-1.5">
					<div className="bg-status-success/70 size-2 rounded-full" />
					<span>
						{t('redundancy.volume.legendRedundant', {
							size: formatBytes(redundantBytes)
						})}
					</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="bg-status-warning/70 size-2 rounded-full" />
					<span>
						{t('redundancy.volume.legendAtRisk', {
							size: formatBytes(atRiskBytes)
						})}
					</span>
				</div>
			</div>
		</div>
	);
}
