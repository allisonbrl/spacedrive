import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode
} from 'react';
import {useSpacedriveClient} from '../contexts/SpacedriveContext';
import {useAppConfig} from '../Settings/useConfig';
import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';

const LOCALES = {
	en,
	'pt-BR': ptBR
} as const;

type Locale = keyof typeof LOCALES;
export type TranslationKey = keyof typeof en;
export type TranslateFn = (
	key: TranslationKey,
	variables?: Record<string, string | number>
) => string;

interface I18nContextValue {
	locale: Locale;
	t: TranslateFn;
	formatDate: (
		value: Date | number | string,
		options?: Intl.DateTimeFormatOptions
	) => string;
	formatTime: (
		value: Date | number | string,
		options?: Intl.DateTimeFormatOptions
	) => string;
	formatDateTime: (
		value: Date | number | string,
		options?: Intl.DateTimeFormatOptions
	) => string;
	formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue>({
	locale: 'en',
	t: (key) => en[key],
	formatDate: (value, options) =>
		new Intl.DateTimeFormat('en', options).format(new Date(value)),
	formatTime: (value, options) =>
		new Intl.DateTimeFormat('en', options).format(new Date(value)),
	formatDateTime: (value, options) =>
		new Intl.DateTimeFormat('en', options).format(new Date(value)),
	formatNumber: (value, options) =>
		new Intl.NumberFormat('en', options).format(value)
});

function resolveLocale(language: string | undefined): Locale {
	if (language === 'pt' || language?.toLowerCase() === 'pt-br') {
		return 'pt-BR';
	}

	return 'en';
}

function interpolate(
	value: string,
	variables: Record<string, string | number> | undefined
) {
	if (!variables) return value;

	return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
		String(variables[name] ?? '')
	);
}

export function I18nProvider({children}: {children: ReactNode}) {
	const {config, refetch} = useAppConfig();
	const client = useSpacedriveClient();
	const [languageRevision, setLanguageRevision] = useState(0);
	const locale = resolveLocale(config?.preferences?.language);

	useEffect(() => {
		let cancelled = false;
		let unsubscribe: (() => void) | undefined;

		client
			.subscribeFiltered({event_types: ['ConfigChanged']}, (event) => {
				if (
					typeof event === 'object' &&
					event !== null &&
					'ConfigChanged' in event &&
					event.ConfigChanged.field === 'language'
				) {
					void refetch().then(() => {
						setLanguageRevision((revision) => revision + 1);
					});
				}
			})
			.then((cleanup) => {
				if (cancelled) cleanup();
				else unsubscribe = cleanup;
			});

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	}, [client, refetch]);

	const value = useMemo<I18nContextValue>(() => {
		const translations = LOCALES[locale] as Record<string, string>;
		const fallback = en as Record<string, string>;
		const languageTag = locale === 'pt-BR' ? 'pt-BR' : 'en';
		const dateFormat = (
			value: Date | number | string,
			options?: Intl.DateTimeFormatOptions
		) =>
			new Intl.DateTimeFormat(languageTag, options).format(
				new Date(value)
			);

		return {
			locale,
			t: (key, variables) => {
				const count = variables?.count;
				const pluralKey =
					typeof count === 'number'
						? `${key}_${new Intl.PluralRules(languageTag).select(count)}`
						: undefined;
				const value =
					(pluralKey && translations[pluralKey]) ??
					translations[key] ??
					fallback[key] ??
					key;
				return interpolate(value, variables);
			},
			formatDate: (value, options) =>
				dateFormat(
					value,
					options ?? {year: 'numeric', month: 'short', day: 'numeric'}
				),
			formatTime: (value, options) =>
				dateFormat(
					value,
					options ?? {hour: 'numeric', minute: 'numeric'}
				),
			formatDateTime: (value, options) =>
				dateFormat(
					value,
					options ?? {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric'
					}
				),
			formatNumber: (value, options) =>
				new Intl.NumberFormat(languageTag, options).format(value)
		};
	}, [locale, languageRevision]);

	return (
		<I18nContext.Provider value={value}>{children}</I18nContext.Provider>
	);
}

export function useI18n() {
	return useContext(I18nContext);
}
