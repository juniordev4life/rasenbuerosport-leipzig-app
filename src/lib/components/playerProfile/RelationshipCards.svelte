<script>
import { getTranslate } from "@tolgee/svelte";
import { goto } from "$app/navigation";

/**
 * Three relationship cards: lieblingsgegner, angstgegner, topPartner.
 * @type {{ relationships: { lieblingsgegner: object|null, angstgegner: object|null, topPartner: object|null } }}
 */
let { relationships } = $props();

const { t } = getTranslate();

const cards = $derived([
	{
		key: "lieblingsgegner",
		title: $t("player_profile.lieblingsgegner"),
		accent: "border-success/60",
		data: relationships?.lieblingsgegner ?? null,
	},
	{
		key: "angstgegner",
		title: $t("player_profile.angstgegner"),
		accent: "border-error/60",
		data: relationships?.angstgegner ?? null,
	},
	{
		key: "top_partner",
		title: $t("player_profile.top_partner"),
		accent: "border-accent-red/60",
		data: relationships?.topPartner ?? null,
	},
]);

function navigateTo(playerId) {
	if (playerId) goto(`/app/profile/${playerId}`);
}

function initials(username) {
	if (!username) return "?";
	return username.charAt(0).toUpperCase();
}
</script>

<div class="bg-bg-secondary border border-border rounded-2xl p-4">
	<h2 class="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
		{$t("player_profile.relationships_title")}
	</h2>
	<div class="grid gap-3 sm:grid-cols-3">
		{#each cards as card (card.key)}
			<div class="rounded-xl border-2 {card.accent} bg-bg-primary/40 p-3">
				<div class="text-xs font-semibold text-text-secondary">{card.title}</div>
				{#if card.data}
					<button
						type="button"
						class="mt-2 flex w-full items-center gap-3 text-left"
						onclick={() => navigateTo(card.data.playerId)}
					>
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-input text-sm font-bold text-text-primary">
							{#if card.data.avatarUrl}
								<img src={card.data.avatarUrl} alt={card.data.username} class="h-10 w-10 rounded-full object-cover" />
							{:else}
								{initials(card.data.username)}
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate text-sm font-semibold text-text-primary">{card.data.username}</div>
							<div class="text-xs text-text-secondary">
								{card.data.wins}{$t("player_profile.wins_short")} / {card.data.losses}{$t("player_profile.losses_short")}
								· {card.data.totalMatches} {$t("player_profile.matches_short")}
							</div>
						</div>
					</button>
				{:else}
					<p class="mt-2 text-xs italic text-text-muted">
						{$t("player_profile.no_relationship")}
					</p>
				{/if}
			</div>
		{/each}
	</div>
</div>
