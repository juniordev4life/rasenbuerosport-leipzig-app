<script>
import { getTranslate } from "@tolgee/svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";

/**
 * "Dein Stand": the signed-in player's ELO, this week's change and the
 * last five results as S / U / N markers.
 *
 * @type {{
 *   elo: number|null,
 *   eloDelta: number|null,
 *   lastFive: Array<"W"|"L"|"D">,
 * }}
 */
let { elo = null, eloDelta = null, lastFive = [] } = $props();

const { t } = getTranslate();

const RESULT = {
	W: { letter: "S", cls: "result-w" },
	D: { letter: "U", cls: "result-d" },
	L: { letter: "N", cls: "result-l" },
};

function formatDelta(n) {
	if (n === null || n === undefined) return null;
	const r = Math.round(n);
	if (r > 0) return `+${r}`;
	if (r < 0) return `−${Math.abs(r)}`;
	return "±0";
}

const deltaClass = $derived(
	eloDelta == null || Math.round(eloDelta) === 0
		? "chip-muted"
		: eloDelta > 0
			? "chip-win"
			: "chip-loss",
);
</script>

<div class="card stand">
	<div class="flex flex-col items-start gap-2 min-w-0">
		<div class="flex items-start gap-1.5">
			<span class="num elo">{elo ?? "—"}</span>
			<InfoTip titleKey="info_tips.elo.title" bodyKey="info_tips.elo.body" />
		</div>
		{#if eloDelta != null}
			<span class="delta chip {deltaClass}">
				{formatDelta(eloDelta)} {$t("home.quick_stats.this_week")}
			</span>
		{/if}
	</div>
	<div class="flex flex-col items-end gap-2">
		<span class="label text-muted">{$t("home.quick_stats.last_five")}</span>
		{#if lastFive.length > 0}
			<div class="flex gap-1">
				{#each lastFive as r, i (i)}
					<span class="result {RESULT[r]?.cls ?? 'result-d'}">{RESULT[r]?.letter ?? "?"}</span>
				{/each}
			</div>
		{:else}
			<span class="text-sm text-muted">{$t("home.quick_stats.no_form")}</span>
		{/if}
	</div>
</div>

<style>
.stand {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 12px;
	padding: 16px;
}

.elo {
	font-size: 56px;
	line-height: 0.8;
}

/* A: the change reads as a plain caption. */
.delta {
	padding: 0;
	background: transparent;
	color: var(--color-muted);
	font-family: var(--font-sans);
	font-weight: 400;
	font-size: 13px;
	text-transform: none;
	letter-spacing: 0;
}

:global([data-variant="b"]) .delta {
	padding: 3px 10px;
	font-size: 12px;
}

:global([data-variant="b"]) .delta.chip-muted {
	background: var(--color-sunken);
}

:global([data-variant="b"]) .delta.chip-win {
	background: var(--color-win-soft);
	color: var(--color-win);
}

:global([data-variant="b"]) .delta.chip-loss {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}
</style>
