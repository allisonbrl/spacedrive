import {
	ArrowsClockwise,
	ArrowDown,
	CheckCircle,
	Warning,
	PlugsConnected,
	Circle,
} from "@phosphor-icons/react";
import clsx from "clsx";
import type { SyncActivity } from "../types";
import { timeAgo } from "../utils";
import { useI18n } from "../../../i18n";

interface ActivityFeedProps {
	activities: SyncActivity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
	const { t } = useI18n();

	if (activities.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4">
				<Circle
					className="size-8 text-ink-faint mb-2"
					weight="duotone"
				/>
				<p className="text-sm text-ink-dull text-center">
					{t("sync.feed.noActivity")}
				</p>
				<p className="text-xs text-ink-faint text-center mt-1">
					{t("sync.feed.activityHint")}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col p-2">
			{activities.map((activity, index) => (
				<ActivityItem
					key={`${activity.timestamp}-${index}`}
					activity={activity}
				/>
			))}
		</div>
	);
}

function ActivityItem({ activity }: { activity: SyncActivity }) {
	const { t } = useI18n();
	const getIcon = () => {
		switch (activity.eventType) {
			case "broadcast":
				return <ArrowsClockwise className="size-4" weight="bold" />;
			case "received":
				return <ArrowDown className="size-4" weight="bold" />;
			case "applied":
				return <CheckCircle className="size-4" weight="bold" />;
			case "backfill":
				return <ArrowsClockwise className="size-4" weight="bold" />;
			case "connection":
				return <PlugsConnected className="size-4" weight="bold" />;
			case "error":
				return <Warning className="size-4" weight="bold" />;
			default:
				return <Circle className="size-4" weight="bold" />;
		}
	};

	const getIconColor = () => {
		switch (activity.eventType) {
			case "broadcast":
				return "text-accent";
			case "received":
				return "text-accent";
			case "applied":
				return "text-green-500";
			case "backfill":
				return "text-purple-500";
			case "connection":
				return "text-ink-dull";
			case "error":
				return "text-red-500";
			default:
				return "text-ink-faint";
		}
	};

	return (
		<div className="flex items-start gap-3 py-2 px-2 hover:bg-app-hover rounded-md transition-colors">
			<div className={clsx("mt-0.5", getIconColor())}>{getIcon()}</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm text-ink truncate">
					{activity.description}
				</p>
				<p className="text-xs text-ink-faint">
					{timeAgo(activity.timestamp, t)}
				</p>
			</div>
		</div>
	);
}
