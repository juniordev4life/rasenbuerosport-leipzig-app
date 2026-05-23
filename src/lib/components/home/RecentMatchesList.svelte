<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Last 3 of the user's matches as compact rows. Each row carries the
 * result pill, the opponent line, the score in the winner's colour
 * and the player's ELO delta on the right.
 *
 * @type {{
 *   matches: Array<{
 *     id: string,
 *     opponent: string,
 *     dateLabel: string,
 *     mode: string,
 *     result: "win"|"loss"|"draw",
 *     score: string,
 *     eloDelta: number|null,
 *   }>,
 * }}
 */
let { matches = [] } = $props();

const { t } = getTranslate();

function formatDelta(n) {
	if (n === null || n === undefined) return null;
	const r = Math.round(n);
	if (r > 0) return `↑ +${r}`;
	if (r < 0) return `↓ −${Math.abs(r)}`;
	return "±0";
}
</script>

<div class="flex flex-col gap-1.5">
	{#each matches as match (match.id)}
		<a
			href={`/app/games/${match.id}`}
			class="bg-bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-3 hover:bg-bg-input transition-colors"
		>
			<span
				class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold border-[1.5px] {match.result === 'win'
					? 'bg-success/15 text-success border-success/40'
					: match.result === 'loss'
						? 'bg-accent-red/15 text-accent-red border-accent-red/40'
						: 'bg-warning/15 text-warning border-warning/40'}"
			>
				{match.result === "win" ? "S" : match.result === "loss" ? "N" : "U"}
			</span>
			<div class="flex-1 min-w-0">
				<div class="text-[12px] font-semibold text-text-primary truncate">
					vs. {match.opponent}
				</div>
				<div class="text-[10px] text-text-muted">
					{match.dateLabel} · {match.mode}
				</div>
			</div>
			<div
				class="text-[14px] font-extrabold tabular-nums shrink-0 {match.result === 'win'
					? 'text-success'
					: match.result === 'loss'
						? 'text-accent-red'
						: 'text-warning'}"
			>
				{match.score}
			</div>
			{#if match.eloDelta != null}
				<div
					class="text-[10px] font-bold tabular-nums shrink-0 min-w-[40px] text-right {match.eloDelta > 0
						? 'text-success'
						: match.eloDelta < 0
							? 'text-accent-red'
							: 'text-text-muted'}"
				>
					{formatDelta(match.eloDelta)}
				</div>
			{/if}
		</a>
	{/each}
	{#if matches.length === 0}
		<div class="text-center text-[11px] text-text-muted italic py-3">
			{$t("home.recent_matches.empty")}
		</div>
	{/if}
</div>
