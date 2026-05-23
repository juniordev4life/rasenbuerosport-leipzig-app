<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Four-column grid of all players, sorted by ELO descending. The
 * logged-in user appears with a "Du"-label, dimmed and disabled.
 * The currently selected opponent shows a cyan border + check.
 *
 * @type {{
 *   players: Array<{ id: string, username: string, avatarUrl: string|null, elo: number|null }>,
 *   currentUserId: string|null,
 *   selectedId: string|null,
 *   onSelect: (id: string) => void,
 * }}
 */
let { players, currentUserId, selectedId, onSelect } = $props();

const { t } = getTranslate();

const sorted = $derived(
	[...players]
		.filter((p) => p.id !== currentUserId)
		.sort((a, b) => (b.elo ?? 0) - (a.elo ?? 0)),
);

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}
</script>

<div class="grid-wrap">
	<div class="grid-label">{$t("compare.grid_label")}</div>
	<div class="grid">
		{#each sorted as p (p.id)}
			{@const isSelf = p.id === currentUserId}
			{@const isSelected = p.id === selectedId}
			{@const g = avatarGradient(p.id)}
			<button
				type="button"
				class="player-card"
				class:self={isSelf}
				class:selected={isSelected}
				disabled={isSelf}
				onclick={() => !isSelf && onSelect(p.id)}
			>
				{#if isSelected}
					<div class="check" aria-hidden="true">✓</div>
				{/if}
				<div class="avatar" style="background: {g.gradient};">
					{#if p.avatarUrl}
						<img src={p.avatarUrl} alt={p.username} />
					{:else}
						<span>{initial(p.username)}</span>
					{/if}
				</div>
				<div class="name">{p.username}</div>
				<div class="elo">{p.elo ?? "—"}</div>
			</button>
		{/each}
	</div>
</div>

<style>
.grid-wrap { margin-top: 4px; }
.grid-label {
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
	margin-bottom: 10px;
}
.grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 8px;
}
.player-card {
	position: relative;
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 10px 6px;
	display: flex; flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	gap: 5px;
	height: 102px;
	min-width: 0;
	cursor: pointer;
	transition: border-color .15s, background-color .15s, transform .1s;
	overflow: hidden;
}
.player-card:hover:not(:disabled) { border-color: rgba(6, 182, 212, 0.4); }
.player-card:active:not(:disabled) { transform: scale(0.98); }
.player-card.self { opacity: 0.5; cursor: not-allowed; }
.player-card.selected {
	border-color: #06B6D4;
	box-shadow: 0 0 0 1px #06B6D4 inset, 0 4px 12px rgba(6, 182, 212, 0.18);
}
.avatar {
	width: 40px; height: 40px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	color: white;
	font-size: 15px;
	font-weight: 700;
	overflow: hidden;
	box-shadow: 0 3px 8px rgba(0,0,0,0.3);
	flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.name {
	font-size: 12px;
	font-weight: 700;
	color: #E5E7EB;
	width: 100%;
	max-width: 100%;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	text-align: center;
}
.elo {
	font-size: 10px;
	color: #6B7280;
	font-variant-numeric: tabular-nums;
}
.check {
	position: absolute;
	top: 4px; right: 4px;
	width: 18px; height: 18px;
	border-radius: 50%;
	background: #06B6D4;
	color: #0F1419;
	font-size: 11px;
	font-weight: 800;
	display: flex; align-items: center; justify-content: center;
	border: 2px solid #131822;
}
</style>
