<script>
import { getTranslate } from "@tolgee/svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";

/**
 * Sticky-top header above the live-match pitch. Shows the team logos
 * and the running score with a "LIVE" pill in the middle.
 *
 * @type {{
 *   homeTeam: object|null,
 *   awayTeam: object|null,
 *   scoreHome: number,
 *   scoreAway: number,
 * }}
 */
let { homeTeam, awayTeam, scoreHome, scoreAway } = $props();

const { t } = getTranslate();
</script>

<header class="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6 rounded-2xl border border-border bg-bg-secondary px-3 sm:px-5 py-3">
	<!-- LIVE pill sits on the top border, centred over the score. -->
	<span
		class="absolute left-1/2 -top-2.5 -translate-x-1/2 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.08em] text-white bg-accent-red rounded-full px-2.5 py-0.5 shadow-md"
	>
		<span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
		{$t("live_match.live_pill")}
	</span>

	<div class="flex items-center gap-2 sm:gap-3 min-w-0">
		<TeamLogo logoUrl={homeTeam?.logo_url} teamName={homeTeam?.name ?? "?"} size="md" />
		<div class="text-sm sm:text-base font-semibold truncate text-text-primary">
			{homeTeam?.name ?? "—"}
		</div>
	</div>

	<div class="flex items-baseline gap-2 tabular-nums text-2xl sm:text-3xl font-extrabold">
		<span>{scoreHome}</span>
		<span class="text-text-muted">:</span>
		<span>{scoreAway}</span>
	</div>

	<div class="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
		<div class="text-sm sm:text-base font-semibold truncate text-text-primary text-right">
			{awayTeam?.name ?? "—"}
		</div>
		<TeamLogo logoUrl={awayTeam?.logo_url} teamName={awayTeam?.name ?? "?"} size="md" />
	</div>
</header>
