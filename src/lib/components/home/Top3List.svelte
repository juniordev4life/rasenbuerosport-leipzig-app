<script>
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import { designVariant } from "$lib/stores/designVariant.stores.js";

/**
 * Top three of the running season. Design A: a ranked list with red
 * display numbers. Design B: a podium — gold in the middle, silver left,
 * bronze right.
 *
 * @type {{
 *   top3: Array<{ id: string, name: string, elo: number|null, avatarUrl?: string|null }>,
 * }}
 */
let { top3 = [] } = $props();

/** Podium order: 2nd, 1st, 3rd (only places that exist). */
const podium = $derived(
	[
		{ player: top3[1], place: 2 },
		{ player: top3[0], place: 1 },
		{ player: top3[2], place: 3 },
	].filter((slot) => slot.player),
);
</script>

{#if top3.length === 0}
	<div class="card px-4 py-5 text-center text-sm text-muted">—</div>
{:else if $designVariant === "b"}
	<div class="podium">
		{#each podium as { player, place } (player.id)}
			<a href={`/app/profile/${player.id}`} class="step place-{place}">
				<PlayerAvatar
					player={{ name: player.name, avatarUrl: player.avatarUrl, id: player.id }}
					size={place === 1 ? 56 : 48}
					class="podium-avatar"
				/>
				<span class="font-bold text-sm truncate max-w-full">{player.name}</span>
				<span class="block">
					<span class="block num place">{place}</span>
					<span class="block cond elo">{player.elo ?? "—"}</span>
				</span>
			</a>
		{/each}
	</div>
{:else}
	<div class="card rows">
		{#each top3 as player, i (player.id)}
			<a href={`/app/profile/${player.id}`} class="row">
				<span class="num rank">{i + 1}</span>
				<PlayerAvatar
					player={{ name: player.name, avatarUrl: player.avatarUrl, id: player.id }}
					size={36}
				/>
				<span class="flex-1 min-w-0 font-bold truncate">{player.name}</span>
				<span class="cond elo-a">{player.elo ?? "—"}</span>
			</a>
		{/each}
	</div>
{/if}

<style>
.row {
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 60px;
	padding: 0 16px;
	text-decoration: none;
	color: inherit;
}

.row:hover {
	background: var(--color-sunken);
}

.rank {
	width: 22px;
	font-size: 24px;
	line-height: 0.8;
	color: var(--color-brand);
}

.elo-a {
	font-size: 20px;
	font-variant-numeric: tabular-nums;
}

/* Design B: podium */
.podium {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	align-items: end;
	gap: 8px;
}

.step {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	min-width: 0;
	text-decoration: none;
	color: inherit;
}

.step > span:last-child {
	align-self: stretch;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	border-radius: 12px 12px 4px 4px;
}

.place-1 > span:last-child {
	height: 96px;
	background: var(--color-gold);
}

.place-2 > span:last-child {
	height: 72px;
	background: var(--color-line);
}

.place-3 > span:last-child {
	height: 56px;
	background: color-mix(in srgb, var(--color-tier-bronze) 35%, var(--color-surface));
}

.place {
	font-size: 28px;
	line-height: 1;
}

.place-1 .place {
	font-size: 34px;
}

.place-3 .place {
	font-size: 24px;
}

.elo {
	font-size: 14px;
	font-variant-numeric: tabular-nums;
}

.step :global(.podium-avatar) {
	box-shadow: 0 0 0 3px var(--color-tier-silver);
}

.place-1 :global(.podium-avatar) {
	box-shadow: 0 0 0 3px var(--color-gold);
}

.place-3 :global(.podium-avatar) {
	box-shadow: 0 0 0 3px var(--color-tier-bronze);
}
</style>
