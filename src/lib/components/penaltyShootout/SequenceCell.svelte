<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * One cell in the penalty-shootout sequence board.
 *
 * State drives both the visual and the label below the cell:
 *
 *   pending   - greyed-out round number, "offen" label
 *   active    - gold-pulsing round number, "Wählen" label
 *   wartet    - shooter avatar pulsing in gold (waiting for result)
 *   goal      - shooter avatar with green border, "Tor" label
 *   missed    - shooter avatar at 40% opacity, red border, no label
 *   skipped   - em-dash + "unnötig" label, dimmed (shot no longer needed)
 *
 * Avatar size stays a constant 28px across states — only border, glow
 * and opacity change. This keeps the row from jumping height as cells
 * cycle through their lifecycle.
 *
 * @type {{
 *   state: 'pending' | 'active' | 'wartet' | 'goal' | 'missed' | 'skipped',
 *   round: number,
 *   shooter?: { id: string, username: string, avatar_url?: string | null } | null,
 *   gradient?: string,
 * }}
 */
let { state, round, shooter = null, gradient = null } = $props();

const { t } = getTranslate();

const showAvatar = $derived(
	(state === "wartet" || state === "goal" || state === "missed") && !!shooter,
);

const initial = $derived(
	shooter?.username ? shooter.username.charAt(0).toUpperCase() : "?",
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
		<div class="avatar" class:pulse={state === "wartet"} style:--cell-gradient={gradient ?? "linear-gradient(135deg, #475569, #334155)"}>
			{#if shooter?.avatar_url}
				<img src={shooter.avatar_url} alt={shooter.username ?? ""} />
			{:else}
				<span class="avatar-initial">{initial}</span>
			{/if}
		</div>
	{:else if state === "skipped"}
		<div class="number-circle dim" aria-hidden="true">—</div>
	{:else}
		<div
			class="number-circle"
			class:active={state === "active"}
			class:pending={state === "pending"}
			aria-hidden="true"
		>
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
	gap: 4px;
	width: var(--sb-cell-width, 60px);
	flex-shrink: 0;
	min-height: 56px;
	justify-content: center;
}

.number-circle {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: 800;
	background: rgba(0, 0, 0, 0.3);
	color: #4B5563;
	border: 1.5px dashed rgba(255, 255, 255, 0.1);
	font-variant-numeric: tabular-nums;
	transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.number-circle.active {
	background: linear-gradient(135deg, #F59E0B, #D97706);
	color: white;
	border: 1.5px solid #FBBF24;
	animation: penaltyActivePulse 1.4s ease-in-out infinite;
}
.number-circle.dim {
	opacity: 0.3;
	border-style: solid;
}

.avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--cell-gradient);
	border: 2px solid transparent;
	color: white;
	font-size: 11px;
	font-weight: 800;
	transition: border-color 0.15s, opacity 0.15s;
}
.avatar img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
.avatar-initial {
	letter-spacing: 0;
}
.cell[data-state="goal"] .avatar {
	border-color: rgba(132, 204, 22, 0.7);
	box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.2);
}
.cell[data-state="missed"] .avatar {
	border-color: rgba(226, 75, 74, 0.55);
	opacity: 0.4;
}
.avatar.pulse {
	border-color: rgba(245, 158, 11, 0.7);
	animation: penaltyActivePulse 1.4s ease-in-out infinite;
}

.cell-label {
	font-size: 9px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #6B7280;
}
.cell[data-state="active"] .cell-label {
	color: #FBBF24;
}
.cell[data-state="goal"] .cell-label {
	color: #84CC16;
}
.cell[data-state="skipped"] .cell-label {
	color: #4B5563;
}
.cell[data-state="skipped"] {
	opacity: 0.5;
}

@keyframes penaltyActivePulse {
	0%, 100% {
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2),
			0 4px 12px rgba(245, 158, 11, 0.45);
		transform: scale(1);
	}
	50% {
		box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.1),
			0 4px 16px rgba(245, 158, 11, 0.7);
		transform: scale(1.06);
	}
}
</style>
