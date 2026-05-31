<script>
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Player avatar tile used inside Wrapped highlight + compact cards.
 * Prefers the player photo when set, falls back to a deterministic
 * gradient circle with the player initial — same visual language the
 * rest of the app uses elsewhere.
 *
 * @type {{
 *   playerId?: string|null,
 *   name?: string|null,
 *   avatarUrl?: string|null,
 *   size?: number,
 * }}
 */
let { playerId = null, name = null, avatarUrl = null, size = 44 } = $props();

const initial = $derived((name ?? "?").charAt(0).toUpperCase());
const gradient = $derived(avatarGradient(playerId ?? name).gradient);
</script>

{#if avatarUrl}
	<img
		src={avatarUrl}
		alt={name ?? "Spieler"}
		class="avatar-photo"
		style:width="{size}px"
		style:height="{size}px"
		loading="lazy"
	/>
{:else}
	<div
		class="avatar-fallback"
		style:width="{size}px"
		style:height="{size}px"
		style:background={gradient}
		style:font-size="{Math.round(size * 0.42)}px"
		aria-label={name ?? "Spieler"}
	>
		{initial}
	</div>
{/if}

<style>
	.avatar-photo {
		border-radius: 50%;
		object-fit: cover;
		display: block;
	}
	.avatar-fallback {
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		color: white;
		flex-shrink: 0;
	}
</style>
