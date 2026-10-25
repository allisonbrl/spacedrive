import {useI18n} from '../../../i18n';

export function EmptyView() {
	const {t} = useI18n();
	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center">
				<div className="text-ink-dull text-sm">
					{t('explorer.empty.selectPlace')}
				</div>
			</div>
		</div>
	);
}
