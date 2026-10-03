<script>
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";

/**
 * The two players of a duo as overlapping avatars with an "&" badge
 * between them, so the pair reads as one unit. Square in design A,
 * round in B (from PlayerAvatar). Decorative: the names are printed
 * next to it.
 *
 * @type {{
 *   player1: { player_id: string, username: string, avatar_url: string|null },
 *   player2: { player_id: string, username: string, avatar_url: string|null },
 *   size?: number,
 * }}
 */
let { player1, player2, size = 70 } = $props();
</script>

<span class="pair" style:--pair-size="{size}px">
	<PlayerAvatar player={player1} {size} />
	<PlayerAvatar player={player2} {size} class="pair-second" />
	<span class="link" aria-hidden="true">&amp;</span>
</span>

<style>
.pair {
	position: relative;
	display: inline-flex;
	flex-shrink: 0;
	padding-bottom: 8px;
}

.pair :global(.pair-second) {
	margin-left: calc(var(--pair-size) / -3);
	box-shadow: 0 0 0 3px var(--color-surface);
}

.link {
	position: absolute;
	left: 50%;
	bottom: -2px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	transform: translateX(-50%);
	border-radius: var(--radius-badge);
	background: var(--color-surface);
	color: var(--color-brand);
	box-shadow: 0 0 0 2px var(--color-brand);
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 15px;
	line-height: 1;
}

:global([data-variant="b"]) .link {
	background: var(--color-gold);
	color: var(--color-on-gold);
	box-shadow: 0 0 0 2px var(--color-surface);
}
</style>
