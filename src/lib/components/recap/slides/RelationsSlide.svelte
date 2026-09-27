<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Slide 5 — who you play with: best partner, nemesis and favorite
 * victim.
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});

const relationRows = $derived.by(() => [
	{
		key: "best_partner",
		data: stats.best_partner,
		label: $t("season_recap.relations.best_partner"),
		detail: stats.best_partner
			? $t("season_recap.relations.best_partner_detail", {
					wins: stats.best_partner.wins,
					games: stats.best_partner.games,
				})
			: "",
	},
	{
		key: "nemesis",
		data: stats.nemesis,
		label: $t("season_recap.relations.nemesis"),
		detail: stats.nemesis
			? $t("season_recap.relations.nemesis_detail", {
					losses: stats.nemesis.losses,
					games: stats.nemesis.games,
				})
			: "",
	},
	{
		key: "favorite_victim",
		data: stats.favorite_victim,
		label: $t("season_recap.relations.favorite_victim"),
		detail: stats.favorite_victim
			? $t("season_recap.relations.favorite_victim_detail", {
					wins: stats.favorite_victim.wins,
					games: stats.favorite_victim.games,
				})
			: "",
	},
]);

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}
</script>

<div class="flex flex-col items-center text-center gap-4 w-full">
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.relations.title")}
	</h2>

	{#each relationRows as row (row.key)}
		{#if row.data}
			<div class="w-full flex items-center gap-3 rounded-xl bg-white/5 p-3 text-left">
				{#if row.data.avatar_url}
					<img referrerpolicy="no-referrer" src={row.data.avatar_url} alt="" class="w-10 h-10 rounded-full object-cover shrink-0" />
				{:else}
					<div
						class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
						style:background={avatarGradient(row.data.player_id ?? row.data.username).gradient}
					>
						{initial(row.data.username)}
					</div>
				{/if}
				<div class="min-w-0">
					<div class="text-[10px] uppercase tracking-wide text-white/50 font-bold">{row.label}</div>
					<div class="text-base font-extrabold truncate">{row.data.username}</div>
					<div class="text-[11px] text-white/50">{row.detail}</div>
				</div>
			</div>
		{/if}
	{/each}
</div>
