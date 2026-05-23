<script>
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Two overlapping circular avatars with a green "&" connection dot
 * sitting between/below them. Used in the duo hero — visually anchors
 * the two players as one entity.
 *
 * @type {{
 *   player1: { player_id: string, username: string, avatar_url: string|null },
 *   player2: { player_id: string, username: string, avatar_url: string|null },
 *   size?: number,
 * }}
 */
let { player1, player2, size = 70 } = $props();

const g1 = $derived(avatarGradient(player1.player_id));
const g2 = $derived(avatarGradient(player2.player_id));

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}
</script>

<div class="duo-avatars-wrap" style="--avatar-size: {size}px;">
	<div class="duo-avatar" style="background: {g1.gradient}; border-color: #131822;">
		{#if player1.avatar_url}
			<img src={player1.avatar_url} alt={player1.username} />
		{:else}
			<span>{initial(player1.username)}</span>
		{/if}
	</div>
	<div class="duo-avatar second" style="background: {g2.gradient}; border-color: #131822;">
		{#if player2.avatar_url}
			<img src={player2.avatar_url} alt={player2.username} />
		{:else}
			<span>{initial(player2.username)}</span>
		{/if}
	</div>
	<div class="duo-connection">&amp;</div>
</div>

<style>
.duo-avatars-wrap {
	position: relative;
	display: flex;
	align-items: center;
}
.duo-avatar {
	width: var(--avatar-size);
	height: var(--avatar-size);
	border-radius: 50%;
	border: 3px solid;
	display: flex; align-items: center; justify-content: center;
	font-size: calc(var(--avatar-size) * 0.4);
	font-weight: 800;
	color: white;
	box-shadow: 0 4px 12px rgba(0,0,0,0.4);
	overflow: hidden;
	flex-shrink: 0;
}
.duo-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.duo-avatar.second { margin-left: calc(-1 * var(--avatar-size) / 3); }
.duo-connection {
	position: absolute;
	bottom: -6px;
	left: 50%; transform: translateX(-50%);
	width: 22px; height: 22px;
	border-radius: 50%;
	background: #84CC16;
	color: #131822;
	font-size: 13px;
	font-weight: 800;
	display: flex; align-items: center; justify-content: center;
	border: 2px solid #131822;
	box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}
</style>
