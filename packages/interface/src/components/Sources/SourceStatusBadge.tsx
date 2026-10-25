import { useI18n } from "../../i18n";

interface SourceStatusBadgeProps {
	status: string;
}

export function SourceStatusBadge({ status }: SourceStatusBadgeProps) {
	const { t } = useI18n();
	const statusLabel =
		status === "idle"
			? t('sources.status.idle')
			: status === "syncing"
				? t('sources.status.syncing')
				: status === "error"
					? t('sources.status.error')
					: status;

	return (
		<span className="text-ink-faint inline-flex items-center gap-1.5 text-[11px] font-medium">
			<span
				className={`h-1.5 w-1.5 rounded-full ${
					status === "syncing"
						? "bg-accent animate-pulse"
						: status === "error"
							? "bg-red-400"
							: "bg-ink-faint"
				}`}
			/>
			{statusLabel}
		</span>
	);
}
