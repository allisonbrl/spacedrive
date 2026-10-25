import { motion } from "framer-motion";
import clsx from "clsx";
import ImageIcon from "@sd/assets/icons/Image.webp";
import VideoIcon from "@sd/assets/icons/Video.webp";
import DocumentIcon from "@sd/assets/icons/Document.webp";
import CodeIcon from "@sd/assets/icons/Code-20.webp";
import AudioIcon from "@sd/assets/icons/Audio.webp";
import FolderIcon from "@sd/assets/icons/Folder.webp";
import { useI18n } from "../../i18n";

interface ContentBreakdownProps {
	totalFiles: number;
}

// MOCK: Content type breakdown (future feature)
// This would come from query:statistics.content_breakdown
interface ContentType {
	type: string;
	count: number;
	percentage: number;
	color: string;
	icon: string;
}

export function ContentBreakdown({ totalFiles }: ContentBreakdownProps) {
	const { t, formatNumber } = useI18n();

	// MOCK DATA - Simulates content type aggregation
	const mockContentTypes: ContentType[] = [
		{
			type: t('overview.contentBreakdown.type.images'),
			count: Math.floor(totalFiles * 0.35),
			percentage: 35,
			color: "from-purple-500 to-pink-500",
			icon: ImageIcon,
		},
		{
			type: t('overview.contentBreakdown.type.documents'),
			count: Math.floor(totalFiles * 0.25),
			percentage: 25,
			color: "from-accent to-cyan-500",
			icon: DocumentIcon,
		},
		{
			type: t('overview.contentBreakdown.type.code'),
			count: Math.floor(totalFiles * 0.15),
			percentage: 15,
			color: "from-green-500 to-emerald-500",
			icon: CodeIcon,
		},
		{
			type: t('overview.contentBreakdown.type.videos'),
			count: Math.floor(totalFiles * 0.12),
			percentage: 12,
			color: "from-red-500 to-orange-500",
			icon: VideoIcon,
		},
		{
			type: t('overview.contentBreakdown.type.audio'),
			count: Math.floor(totalFiles * 0.08),
			percentage: 8,
			color: "from-yellow-500 to-amber-500",
			icon: AudioIcon,
		},
		{
			type: t('overview.contentBreakdown.type.other'),
			count: Math.floor(totalFiles * 0.05),
			percentage: 5,
			color: "from-gray-500 to-slate-500",
			icon: FolderIcon,
		},
	];

	return (
		<div className="bg-app-box border border-app-line rounded-xl overflow-hidden">
			<div className="px-6 py-4 border-b border-app-line">
				<h2 className="text-base font-semibold text-ink">
					{t('overview.contentBreakdown.title')}
				</h2>
				<p className="text-sm text-ink-dull mt-1">
					{t('overview.contentBreakdown.subtitle')}
					<span className="ml-2 px-2 py-0.5 bg-sidebar-box text-sidebar-ink-dull text-xs rounded-md font-medium border border-sidebar-line">
						{t('overview.contentBreakdown.preview')}
					</span>
				</p>
			</div>

			<div className="p-6">
				{/* Horizontal stacked bar */}
				<div className="mb-6">
					<div className="h-4 bg-app rounded-full overflow-hidden flex">
						{mockContentTypes.map((contentType, idx) => (
							<motion.div
								key={contentType.type}
								initial={{ width: 0 }}
								animate={{
									width: `${contentType.percentage}%`,
								}}
								transition={{
									duration: 1,
									delay: idx * 0.1,
									ease: "easeOut",
								}}
								className={clsx(
									"h-full bg-gradient-to-r",
									contentType.color,
									"first:rounded-l-full last:rounded-r-full",
								)}
								title={t('overview.contentBreakdown.tooltip', {
									type: contentType.type,
									count: formatNumber(contentType.count)
								})}
							/>
						))}
					</div>
				</div>

				{/* Breakdown list */}
				<div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
					{mockContentTypes.map((contentType, idx) => (
						<motion.div
							key={contentType.type}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.05 }}
							className="flex items-center gap-3 p-3 bg-app rounded-lg hover:bg-app-hover transition-colors group cursor-pointer"
						>
							{/*<div className="p-2 rounded-lg bg-sidebar-box group-hover:scale-110 transition-transform">*/}
							<img
								src={contentType.icon}
								alt={contentType.type}
								className="size-8"
							/>
							{/*</div>*/}

							<div className="flex-1 min-w-0">
								<div className="flex items-baseline gap-2">
									<span className="text-sm font-semibold text-ink">
										{formatNumber(contentType.count)}
									</span>
									<span className="text-xs text-ink-faint">
										{contentType.percentage}%
									</span>
								</div>
								<div className="text-xs text-ink-dull truncate">
									{contentType.type}
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</div>
	);
}
