<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Top-level view switch: Skill-Rating (ELO) vs Liga (season table).
 * Both tiles are always active — the previous "Bald" placeholder is
 * gone now that the Liga view ships alongside Skill-Rating.
 *
 * @type {{
 *   value: "skill"|"league",
 *   onChange: (next: "skill"|"league") => void,
 *   seasonIsCurrent?: boolean,
 * }}
 */
let { value = "skill", onChange, seasonIsCurrent = true } = $props();

const { t } = getTranslate();
</script>

<div class="grid grid-cols-2 gap-2">
	<button
		type="button"
		onclick={() => onChange("skill")}
		aria-pressed={value === "skill"}
		class="rounded-2xl border px-3 py-2.5 text-left transition-colors {value === 'skill'
			? 'border-accent-red/40 bg-accent-red/10'
			: 'border-border bg-bg-card hover:bg-bg-input'}"
	>
		<div
			class="text-[13px] font-extrabold tracking-tight {value === 'skill'
				? 'text-text-primary'
				: 'text-text-secondary'}"
		>
			{$t("leaderboard.mode_skill")}
		</div>
		<div class="text-[10px] text-text-muted mt-0.5">
			{seasonIsCurrent
				? $t("leaderboard.mode_skill_sub")
				: $t("leaderboard.season_final")}
		</div>
	</button>
	<button
		type="button"
		onclick={() => onChange("league")}
		aria-pressed={value === "league"}
		class="rounded-2xl border px-3 py-2.5 text-left transition-colors {value === 'league'
			? 'border-accent-red/40 bg-accent-red/10'
			: 'border-border bg-bg-card hover:bg-bg-input'}"
	>
		<div
			class="text-[13px] font-extrabold tracking-tight {value === 'league'
				? 'text-text-primary'
				: 'text-text-secondary'}"
		>
			{$t("leaderboard.mode_league")}
		</div>
		<div class="text-[10px] text-text-muted mt-0.5">{$t("leaderboard.mode_league_sub")}</div>
	</button>
</div>
