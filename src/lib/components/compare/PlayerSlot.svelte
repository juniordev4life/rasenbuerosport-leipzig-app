<script>
import { getTranslate } from "@tolgee/svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Compare-screen slot card. Three states:
 *   - locked: own user (slot 1) — shows lock icon, gradient avatar
 *   - empty: dashed border with "+" placeholder (slot 2 before pick)
 *   - filled: chosen opponent with cyan accent (slot 2 after pick)
 *
 * @type {{
 *   state: "locked"|"empty"|"filled",
 *   player?: {
 *     id: string,
 *     username: string,
 *     avatarUrl: string|null,
 *     initials: string,
 *     elo?: number|null,
 *   } | null,
 *   accent?: "self"|"opponent",
 *   onClear?: () => void,
 * }}
 */
let {
	state = "empty",
	player = null,
	accent = "opponent",
	onClear = null,
} = $props();

const { t } = getTranslate();

const gradient = $derived(
	player?.id ? avatarGradient(player.id).gradient : null,
);

const accentColor = $derived(accent === "self" ? "#F59E0B" : "#06B6D4");
</script>

<div
	class="slot {state}"
	style={state === "filled" || state === "locked"
		? `--accent: ${accentColor};`
		: ""}
>
	{#if state === "empty"}
		<div class="empty-mark">+</div>
		<div class="empty-label">{$t("compare.slot_pick")}</div>
	{:else if state === "locked" && player}
		<div class="lock-badge" aria-hidden="true">{"\u{1F512}"}</div>
		<div class="avatar" style="background: {gradient};">
			{#if player.avatarUrl}
				<img src={player.avatarUrl} alt={player.username} />
			{:else}
				<span>{player.initials}</span>
			{/if}
		</div>
		<div class="name">{player.username}</div>
		<div class="meta">
			{#if player.elo != null}
				ELO {player.elo}
			{:else}
				—
			{/if}
		</div>
	{:else if state === "filled" && player}
		<button
			type="button"
			class="close"
			aria-label={$t("compare.slot_clear")}
			onclick={() => onClear?.()}
		>×</button>
		<div class="avatar" style="background: {gradient};">
			{#if player.avatarUrl}
				<img src={player.avatarUrl} alt={player.username} />
			{:else}
				<span>{player.initials}</span>
			{/if}
		</div>
		<div class="name">{player.username}</div>
		<div class="meta">
			{#if player.elo != null}
				ELO {player.elo}
			{:else}
				{$t("compare.slot_opponent")}
			{/if}
		</div>
	{/if}
</div>

<style>
.slot {
	position: relative;
	flex: 1;
	min-width: 0;
	border-radius: 16px;
	padding: 16px 12px;
	display: flex; flex-direction: column;
	align-items: center;
	gap: 6px;
	text-align: center;
}
.slot.empty {
	border: 1.5px dashed rgba(6, 182, 212, 0.4);
	background: rgba(6, 182, 212, 0.04);
	color: #9CA3AF;
	justify-content: center;
}
.slot.empty .empty-mark {
	font-size: 36px;
	color: #06B6D4;
	line-height: 1;
}
.slot.empty .empty-label {
	font-size: 11px;
	color: #6B7280;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-weight: 700;
}
.slot.locked,
.slot.filled {
	background: #131822;
	border: 1px solid var(--accent, #1F2937);
	box-shadow: 0 0 0 1px var(--accent, transparent) inset;
}
.slot.locked { border-color: rgba(245, 158, 11, 0.4); }
.slot.filled { border-color: rgba(6, 182, 212, 0.4); }
.avatar {
	width: 56px; height: 56px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	color: #fff;
	font-size: 22px;
	font-weight: 800;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.name {
	font-size: 14px;
	font-weight: 800;
	color: #E5E7EB;
	max-width: 100%;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.meta {
	font-size: 10px;
	color: #9CA3AF;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
.lock-badge {
	position: absolute;
	top: 8px; right: 10px;
	font-size: 12px;
}
.close {
	position: absolute;
	top: 4px; right: 6px;
	width: 22px; height: 22px;
	border-radius: 50%;
	background: rgba(255,255,255,0.06);
	color: #9CA3AF;
	border: 0;
	font-size: 16px;
	line-height: 1;
	cursor: pointer;
}
.close:hover { background: rgba(255,255,255,0.12); color: #fff; }
</style>
