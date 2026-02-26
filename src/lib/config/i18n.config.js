import { FormatIcu } from "@tolgee/format-icu";
import { Tolgee } from "@tolgee/svelte";
import { env } from "$env/dynamic/public";

import de from "$lib/i18n/de.json";
import en from "$lib/i18n/en.json";

export const tolgee = Tolgee()
	.use(FormatIcu())
	.init({
		language: "de",
		apiUrl: env.PUBLIC_TOLGEE_API_URL || "https://app.tolgee.io",
		apiKey: env.PUBLIC_TOLGEE_API_KEY || "",
		staticData: { de, en },
	});
