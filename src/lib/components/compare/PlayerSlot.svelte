<script>
import { getTranslate } from "@tolgee/svelte";
import PlusIcon from "$lib/components/icons/PlusIcon.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";

/**
 * One side of the compare pairing. Three states:
 *   - locked: the signed-in player (slot 1) — a "Du" badge, own avatar
 *   - empty: a dashed placeholder with "+" (slot 2 before the pick)
 *   - filled: the chosen opponent, with a button to clear the pick
 *
 * Design A: white tiles on the red hero, the empty slot as a dashed
 * white outline. Design B: white cards, the empty one with a dashed
 * grey border. `accent` is kept for callers; the side is shown by the
 * badge and the avatar colour.
 *
 * @type {{
 *   state: "locked"|"empty"|"filled",
 *   player?: {
 *     id: string,
 *     username: string,
 *     avatarUrl: string|null,
 *     initials?: string,
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
</script>

<div class="slot {state} accent-{accent}">
	{#if state === "empty"}
		<span class="plus" aria-hidden="true"><PlusIcon size={28} /></span>
		<span class="slot-label">{$t("compare.slot_pick")}</span>
	{:else if player}
		{#if state === "locked"}
			<span class="chip chip-navy badge">{$t("compare.slot_you")}</span>
		{:else}
			<button
				type="button"
				class="clear"
				aria-label={$t("compare.slot_clear")}
				onclick={() => onClear?.()}
			>
				<svg
					viewBox="0 0 24 24"
					width="16"
					height="16"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		{/if}
		<PlayerAvatar
			player={{ id: player.id, username: player.username, avatarUrl: player.avatarUrl }}
			size={56}
			self={state === "locked"}
		/>
		<span class="slot-name">{player.username}</span>
		<span class="slot-meta">
			{#if player.elo != null}
				ELO {player.elo}
			{:else if state === "filled"}
				{$t("compare.slot_opponent")}
			{:else}
				—
			{/if}
		</span>
	{/if}
</div>

<style>
/* ── Design A: white tiles on the red hero ──────────────────────────── */
.slot {
	position: relative;
	flex: 1;
	min-width: 0;
	min-height: 148px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 16px 10px 14px;
	text-align: center;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
}

.slot.empty {
	background: transparent;
	color: inherit;
	border: 1.5px dashed currentColor;
}

.plus {
	display: flex;
}

.slot-label {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.slot-name {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-weight: 700;
	font-size: 15px;
}

.slot-meta {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 0.02em;
	font-variant-numeric: tabular-nums;
	color: var(--color-muted);
}

.badge {
	position: absolute;
	top: 8px;
	right: 8px;
}

.clear {
	position: absolute;
	top: 6px;
	right: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: 0;
	border-radius: 999px;
	background: var(--color-sunken);
	color: var(--color-ink);
	cursor: pointer;
}

.clear:hover {
	background: var(--color-line);
}

/* ── Design B: white sticker cards ──────────────────────────────────── */
:global([data-variant="b"]) .slot {
	box-shadow: var(--shadow-card);
	text-shadow: none;
}

:global([data-variant="b"]) .slot.empty {
	background: var(--color-surface);
	color: var(--color-muted);
	border: 2px dashed var(--color-line);
}

:global([data-variant="b"]) .plus {
	color: var(--color-brand);
}

:global([data-variant="b"]) .slot-label {
	font-family: var(--font-sans);
	font-size: 13px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .slot-meta {
	font-weight: 800;
	letter-spacing: 0;
}
</style>
