<script>
import { getTranslate } from "@tolgee/svelte";
import { tolgee } from "$lib/config/i18n.config.js";

const { t } = getTranslate();

let { season } = $props();

let currentLanguage = $state(tolgee.getLanguage());

$effect(() => {
	const updateLanguage = () => {
		currentLanguage = tolgee.getLanguage();
	};
	tolgee.on("language", updateLanguage);
});

const currentLocale = $derived(currentLanguage === "de" ? "de" : "en");

const displayName = $derived(
	season.display_name?.[currentLocale] ||
		season.display_name?.en ||
		season.season,
);

const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<h3 class="text-sm font-semibold text-text-primary mb-3">{displayName}</h3>

	<div class="flex flex-col gap-2">
		{#each season.podium as player, index (player.player_id)}
			<div class="flex items-center gap-3">
				<!-- Medal -->
				<span class="text-lg w-6 text-center">{medals[index]}</span>

				<!-- Avatar -->
				{#if player.avatar_url}
					<img
						src={player.avatar_url}
						alt={player.username}
						class="w-8 h-8 rounded-full object-cover ring-1 ring-border"
					/>
				{:else}
					<div
						class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-bg-input ring-1 ring-border text-text-secondary"
					>
						{(player.username || "?").charAt(0).toUpperCase()}
					</div>
				{/if}

				<!-- Name + Record -->
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-text-primary truncate">{player.username}</p>
					<p class="text-[10px] text-text-secondary">
						{$t("season.podium_record", { w: player.wins, d: player.draws, l: player.losses })}
					</p>
				</div>

				<!-- Points -->
				<div class="text-right shrink-0">
					<span class="text-sm font-bold text-text-primary">{player.points}</span>
					<span class="text-[10px] text-text-secondary block">{$t("season.podium_points")}</span>
				</div>
			</div>
		{/each}
	</div>
</div>
