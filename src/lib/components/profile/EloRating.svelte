<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * @type {{
 *   currentElo?: number,
 *   peakElo?: number,
 *   eloChangeLastGame?: number|null,
 *   onInfoClick?: () => void
 * }}
 */
let {
	currentElo = 1200,
	peakElo = 1200,
	eloChangeLastGame = null,
	onInfoClick,
} = $props();

const { t } = getTranslate();

const changePrefix = $derived(
	eloChangeLastGame !== null && eloChangeLastGame >= 0 ? "+" : "",
);

const changeColor = $derived(
	eloChangeLastGame === null
		? "text-text-secondary"
		: eloChangeLastGame > 0
			? "text-success"
			: eloChangeLastGame < 0
				? "text-error"
				: "text-warning",
);

/** Arrow direction based on last change */
const trendArrow = $derived(
	eloChangeLastGame === null
		? ""
		: eloChangeLastGame > 0
			? "\u2191"
			: eloChangeLastGame < 0
				? "\u2193"
				: "\u2192",
);

/** Elo bar position (range 800-1600) */
const minElo = 800;
const maxElo = 1600;
const barPct = $derived(
	Math.min(100, Math.max(0, ((currentElo - minElo) / (maxElo - minElo)) * 100)),
);
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<div class="flex items-center justify-between mb-2">
		<h3 class="text-sm font-medium text-text-secondary">
			{$t("elo.rating_title")}
		</h3>
		<div class="flex items-center gap-2">
			{#if eloChangeLastGame !== null}
				<span class="text-xs font-medium {changeColor}">
					{trendArrow} {changePrefix}{eloChangeLastGame}
				</span>
			{/if}
			{#if onInfoClick}
				<button
					type="button"
					onclick={onInfoClick}
					class="text-text-secondary hover:text-text-primary transition-colors"
					aria-label={$t("elo.info_title")}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div class="flex items-baseline gap-3">
		<span class="text-3xl font-bold text-text-primary">{currentElo}</span>
		<div class="flex flex-col">
			<span class="text-[10px] text-text-secondary">
				{$t("elo.peak_label")}: {peakElo}
			</span>
		</div>
	</div>

	<!-- Elo visual bar -->
	<div class="mt-3">
		<div class="w-full bg-bg-input rounded-full h-2">
			<div
				class="bg-accent-red h-2 rounded-full transition-all duration-500"
				style="width: {barPct}%"
			></div>
		</div>
		<div class="flex justify-between mt-1">
			<span class="text-[9px] text-text-secondary">{minElo}</span>
			<span class="text-[9px] text-text-secondary">{maxElo}</span>
		</div>
	</div>
</div>
