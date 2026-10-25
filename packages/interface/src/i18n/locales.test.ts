import { describe, expect, test } from "bun:test";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

// English is the source of truth. Other locales may lag behind it, since a
// missing key falls back to English, but must never contradict it.
const LOCALES: Record<string, Record<string, string>> = { "pt-BR": ptBR };
const reference: Record<string, string> = en;

function placeholders(value: string): string[] {
	return [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();
}

describe("en locale", () => {
	test("has no empty strings", () => {
		const empty = Object.keys(reference).filter((key) => !reference[key].trim());
		expect(empty).toEqual([]);
	});

	test("pairs every plural _one key with an _other key", () => {
		const orphans = Object.keys(reference)
			.filter((key) => key.endsWith("_one"))
			.filter((key) => !(`${key.slice(0, -"_one".length)}_other` in reference));
		expect(orphans).toEqual([]);
	});
});

for (const [name, locale] of Object.entries(LOCALES)) {
	describe(`${name} locale`, () => {
		test("has no keys that en lacks", () => {
			const extra = Object.keys(locale).filter((key) => !(key in reference));
			expect(extra).toEqual([]);
		});

		test("has no empty strings", () => {
			const empty = Object.keys(locale).filter((key) => !locale[key].trim());
			expect(empty).toEqual([]);
		});

		test("keeps the same {{placeholders}} as en", () => {
			const mismatched = Object.keys(reference)
				.filter((key) => key in locale)
				.filter(
					(key) =>
						placeholders(reference[key]).join() !==
						placeholders(locale[key]).join(),
				);
			expect(mismatched).toEqual([]);
		});
	});
}
