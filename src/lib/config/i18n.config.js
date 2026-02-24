import { FormatIcu } from "@tolgee/format-icu";
import { Tolgee } from "@tolgee/svelte";
import { PUBLIC_TOLGEE_API_KEY, PUBLIC_TOLGEE_API_URL } from "$env/static/public";

import de from "$lib/i18n/de.json";
import en from "$lib/i18n/en.json";

export const tolgee = Tolgee()
	.use(FormatIcu())
	.init({
		language: "de",
		apiUrl: PUBLIC_TOLGEE_API_URL,
		apiKey: PUBLIC_TOLGEE_API_KEY,
		staticData: { de, en },
	});
