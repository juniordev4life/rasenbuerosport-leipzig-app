<script>
import { getTranslate } from "@tolgee/svelte";
import ReporterBioModal from "$lib/components/games/ReporterBioModal.svelte";
import { getReporter } from "$lib/constants/reporters.constants.js";

/**
 * Frank's weekly hype card. V1 ships with a fallback verdict picked
 * from the constellation of the user's week (positive / negative /
 * neutral / empty) — the LLM-generated version is a follow-up spec.
 *
 * Avatar tap opens the same reporter bio modal that the match report
 * uses, so the Frank persona stays consistent across the app.
 *
 * @type {{
 *   userName: string,
 *   wins: number,
 *   losses: number,
 *   matches: number,
 *   eloDelta: number,
 *   kalenderwoche: number,
 * }}
 */
let {
	userName = "",
	wins = 0,
	losses = 0,
	matches = 0,
	eloDelta = 0,
	kalenderwoche,
} = $props();

const { t } = getTranslate();

const frank = getReporter("euphoriker");
let bioOpen = $state(false);

const verdict = $derived.by(() => {
	if (matches === 0) return $t("home.frank.empty", { name: userName });
	if (eloDelta >= 10 || wins - losses >= 2)
		return $t("home.frank.positive", { name: userName, delta: eloDelta });
	if (eloDelta <= -10 || losses - wins >= 2)
		return $t("home.frank.negative", { name: userName });
	return $t("home.frank.neutral", { name: userName });
});

function formatDelta(n) {
	const r = Math.round(n ?? 0);
	if (r > 0) return `+${r}`;
	if (r < 0) return `−${Math.abs(r)}`;
	return "±0";
}
</script>

<div class="frank-card">
	<div class="flex items-center gap-3 mb-3">
		{#if frank}
			<button
				type="button"
				onclick={() => (bioOpen = true)}
				class="frank-avatar-btn"
				aria-label={frank.name}
			>
				<img
					src={frank.imageUrl}
					alt={frank.name}
					class="w-full h-full object-cover"
					loading="lazy"
				/>
			</button>
		{:else}
			<div class="frank-avatar">F</div>
		{/if}
		<div class="flex-1 leading-tight">
			<div class="text-[12px] font-extrabold text-warning tracking-wide">FRANK</div>
			<div class="text-[10px] italic text-text-secondary mt-0.5">
				{$t("home.frank.role")}
			</div>
		</div>
		<span class="text-[9px] uppercase tracking-[0.08em] font-extrabold text-warning bg-warning/15 border border-warning/30 rounded-full px-2 py-0.5">
			KW {kalenderwoche}
		</span>
	</div>

	<p class="text-[13px] leading-[1.5] text-text-primary font-medium mb-3">
		{verdict}
	</p>

	<div class="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-center">
		<div>
			<div class="text-[17px] font-extrabold tabular-nums leading-none text-success">
				{wins}:{losses}
			</div>
			<div class="text-[9px] uppercase tracking-[0.08em] font-bold text-text-muted mt-1">
				{$t("home.frank.record")}
			</div>
		</div>
		<div>
			<div class="text-[17px] font-extrabold tabular-nums leading-none text-text-primary">
				{formatDelta(eloDelta)}
			</div>
			<div class="text-[9px] uppercase tracking-[0.08em] font-bold text-text-muted mt-1">
				ELO Δ
			</div>
		</div>
		<div>
			<div class="text-[17px] font-extrabold tabular-nums leading-none text-text-primary">
				{matches}
			</div>
			<div class="text-[9px] uppercase tracking-[0.08em] font-bold text-text-muted mt-1">
				{$t("home.frank.matches")}
			</div>
		</div>
	</div>
</div>

{#if bioOpen && frank}
	<ReporterBioModal reporter={frank} onClose={() => (bioOpen = false)} />
{/if}

<style>
.frank-card {
	background:
		radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.18) 0%, transparent 55%),
		linear-gradient(180deg, #1A1F2A 0%, #131822 100%);
	border: 1px solid rgba(245, 158, 11, 0.3);
	border-radius: 18px;
	padding: 16px;
	position: relative;
	overflow: hidden;
}
.frank-card::before {
	content: "";
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 2px;
	background: linear-gradient(90deg, transparent, #F59E0B 50%, transparent);
	opacity: 0.6;
}
.frank-avatar,
.frank-avatar-btn {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: linear-gradient(135deg, #D97706, #92400E);
	border: 2px solid rgba(245, 158, 11, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	font-weight: 800;
	color: #FBBF24;
	flex-shrink: 0;
	overflow: hidden;
	padding: 0;
	cursor: pointer;
}
.frank-avatar-btn:hover {
	box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}
</style>
