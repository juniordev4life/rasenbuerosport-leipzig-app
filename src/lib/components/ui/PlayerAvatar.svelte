<script>
import {
	avatarColorClass,
	avatarInitials,
} from "$lib/utils/avatarColor.utils.js";

/**
 * A player's picture, or their initials on a per-player colour when there
 * is none (or it fails to load). Square in design A, round in B — the
 * shape and colours come from `.avatar` in app.css.
 *
 * `player` takes the shapes the API returns: `username` or `name`,
 * `avatar_url` or `avatarUrl`, `player_id` or `id`.
 *
 * Decorative by default (empty alt): the name is almost always printed
 * next to it. Wrap it in a labelled button or link when it stands alone.
 *
 * @type {{
 *   player: { name?: string|null, username?: string|null, avatar_url?: string|null, avatarUrl?: string|null, url?: string|null, id?: string|null, player_id?: string|null } | null,
 *   size?: number,
 *   self?: boolean,
 *   ring?: boolean,
 *   class?: string,
 * }}
 */
let {
	player = null,
	size = 40,
	self = false,
	ring = false,
	class: className = "",
} = $props();

const name = $derived(player?.username ?? player?.name ?? null);
const url = $derived(
	player?.avatar_url ?? player?.avatarUrl ?? player?.url ?? null,
);
const colorKey = $derived(player?.player_id ?? player?.id ?? name);

let failedUrl = $state(null);
const showImage = $derived(Boolean(url) && failedUrl !== url);
const colorClass = $derived(self ? "avatar-self" : avatarColorClass(colorKey));
</script>

<span
	class="avatar {colorClass} {ring ? 'avatar-ring' : ''} {className}"
	style="width: {size}px; height: {size}px; font-size: {Math.round(size * 0.42)}px;"
>
	{#if showImage}
		<img
			src={url}
			alt=""
			referrerpolicy="no-referrer"
			loading="lazy"
			onerror={() => (failedUrl = url)}
		/>
	{:else}
		<span aria-hidden="true">{avatarInitials(name)}</span>
	{/if}
</span>
