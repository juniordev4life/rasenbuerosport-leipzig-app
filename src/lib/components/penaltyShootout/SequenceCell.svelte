<script>
import { getTranslate } from "@tolgee/svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";

/**
 * One cell in the penalty-shootout sequence board.
 *
 * State drives both the visual and the label below the cell:
 *
 *   pending   - round number in a dashed frame, "offen" label
 *   active    - pulsing gold round number, "Wählen" label
 *   wartet    - shooter avatar in a pulsing gold ring (waiting for result)
 *   goal      - shooter avatar with a green ✓ mark, "Tor" label
 *   missed    - dimmed shooter avatar with a red ✕ mark, no label
 *   skipped   - em-dash + "unnötig" label, dimmed (shot no longer needed)
 *
 * Goal and missed carry a ✓ / ✕ mark, so the result never rests on
 * colour alone; screen readers get the shooter's name and "missed".
 * Avatar size stays a constant 28px across states — only ring, mark
 * and opacity change. This keeps the row from jumping height as cells
 * cycle through their lifecycle.
 *
 * @type {{
 *   state: 'pending' | 'active' | 'wartet' | 'goal' | 'missed' | 'skipped',
 *   round: number,
 *   shooter?: { id: string, username: string, avatar_url?: string | null } | null,
 * }}
 */
let { state, round, shooter = null } = $props();

const { t } = getTranslate();

const showAvatar = $derived(
	(state === "wartet" || state === "goal" || state === "missed") && !!shooter,
);

const label = $derived.by(() => {
	if (state === "pending") return $t("penalty_shootout.cell.label_pending");
	if (state === "active") return $t("penalty_shootout.cell.label_active");
	if (state === "goal") return $t("penalty_shootout.cell.label_goal");
	if (state === "skipped") return $t("penalty_shootout.cell.label_skipped");
	// wartet + missed deliberately have no label — board reads clean.
	return "";
});
</script>

<div class="cell" data-state={state}>
	{#if showAvatar}
		<span class="shot">
			<PlayerAvatar player={shooter} size={28} class="shot-avatar" />
			<span class="sr-only">{shooter.username ?? ""}</span>
			{#if state === "goal"}
				<span class="mark" aria-hidden="true">
					<svg viewBox="0 0 10 10" width="8" height="8"><path d="M1.5 5.2l2.3 2.3 4.7-5" /></svg>
				</span>
			{:else if state === "missed"}
				<span class="mark" aria-hidden="true">
					<svg viewBox="0 0 10 10" width="8" height="8"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" /></svg>
				</span>
				<span class="sr-only">{$t("penalty_shootout.active.missed")}</span>
			{/if}
		</span>
	{:else if state === "skipped"}
		<div class="number dim" aria-hidden="true">—</div>
	{:else}
		<div class="number" class:active={state === "active"} aria-hidden="true">
			{round}
		</div>
	{/if}

	{#if label}
		<span class="cell-label">{label}</span>
	{/if}
</div>

<style>
.cell {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 5px;
	width: var(--sb-cell-width, 60px);
	min-height: 58px;
	flex-shrink: 0;
}

/* Round number: square in A, round in B. */
.number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border: 1.5px dashed var(--color-line);
	border-radius: var(--radius-avatar);
	color: var(--color-muted);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 13px;
	font-variant-numeric: tabular-nums;
}

.number.active {
	border: 0;
	background: var(--color-gold);
	color: var(--color-on-gold);
	outline: 3px solid color-mix(in srgb, var(--color-gold) 45%, transparent);
	animation: cell-pulse 1.4s ease-in-out infinite;
}

.number.dim {
	border-style: solid;
	opacity: 0.4;
}

.shot {
	position: relative;
	display: inline-flex;
}

.shot :global(.shot-avatar) {
	outline: 2px solid transparent;
	outline-offset: 2px;
}

.cell[data-state="wartet"] .shot :global(.shot-avatar) {
	outline-color: var(--color-gold);
	animation: cell-pulse 1.4s ease-in-out infinite;
}

.cell[data-state="goal"] .shot :global(.shot-avatar) {
	outline-color: var(--color-win);
}

.cell[data-state="missed"] .shot :global(.shot-avatar) {
	outline-color: var(--color-loss);
	opacity: 0.45;
}

/* ✓ / ✕ mark at the avatar's lower right. */
.mark {
	position: absolute;
	right: -6px;
	bottom: -6px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	border: 2px solid var(--color-surface);
	border-radius: 999px;
	background: var(--color-win);
	color: var(--color-on-win);
}

.cell[data-state="missed"] .mark {
	background: var(--color-loss);
	color: var(--color-on-loss);
}

.mark path {
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.cell-label {
	font-family: var(--font-label);
	font-weight: 700;
	font-size: 10px;
	letter-spacing: var(--label-tracking);
	line-height: 1.1;
	text-transform: var(--label-case);
	color: var(--color-muted);
}

.cell[data-state="active"] .cell-label {
	color: var(--color-ink);
}

.cell[data-state="goal"] .cell-label {
	color: var(--color-win);
}

@keyframes cell-pulse {
	50% {
		outline-color: transparent;
	}
}
</style>
