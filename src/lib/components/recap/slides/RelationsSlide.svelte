<script>
import { getTranslate } from "@tolgee/svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import RecapCard from "../RecapCard.svelte";
import RecapSlide from "../RecapSlide.svelte";

/**
 * Slide 5 — who you play with: best partner, nemesis and favorite
 * victim, each tagged with a labelled chip (never colour alone).
 *
 * @type {{ recap: object }}
 */
let { recap } = $props();

const { t } = getTranslate();
const stats = $derived(recap.stats ?? {});

const relationRows = $derived.by(() => [
	{
		key: "best_partner",
		chip: "chip-navy",
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
		chip: "chip-brand",
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
		chip: "chip-gold",
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
</script>

<RecapSlide title={$t("season_recap.relations.title")}>
	<RecapCard panel>
		<ul class="people rows">
			{#each relationRows as row (row.key)}
				{#if row.data}
					<li class="person">
						<PlayerAvatar player={row.data} size={48} />
						<div class="who">
							<span class="chip {row.chip}">{row.label}</span>
							<span class="name">{row.data.username}</span>
							<span class="detail">{row.detail}</span>
						</div>
					</li>
				{/if}
			{/each}
		</ul>
	</RecapCard>
</RecapSlide>

<style>
.people {
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 0;
	list-style: none;
}

.person {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 0;
}

.person:first-child {
	padding-top: 0;
}

.person:last-child {
	padding-bottom: 0;
}

.who {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 3px;
	min-width: 0;
}

.name {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 20px;
	line-height: 1.15;
}

.detail {
	font-size: 13px;
	line-height: 1.3;
	color: var(--color-muted);
}

:global([data-variant="b"]) .name {
	font-weight: 800;
}
</style>
