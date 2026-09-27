<script>
import { getTranslate } from "@tolgee/svelte";
import {
	AWARD_EMOJI,
	formatAwardValue,
	orderAwards,
} from "$lib/constants/seasonAwards.constants.js";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";
import ConfettiBurst from "../ConfettiBurst.svelte";

/**
 * Slide 9 — the season's league-wide awards. Awards the viewer won
 * (`awards_won`) are highlighted, with a confetti burst to celebrate.
 *
 * @type {{ recap: object, reducedMotion: boolean }}
 */
let { recap, reducedMotion } = $props();

const { t } = getTranslate();

const ordered = $derived(orderAwards(recap.league?.awards ?? []));
const wonKeys = $derived(new Set(recap.awards_won ?? []));
const wonAnyAward = $derived(wonKeys.size > 0);

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}
</script>

<div class="flex flex-col items-center text-center gap-4 w-full">
	{#if wonAnyAward}
		<ConfettiBurst reduced={reducedMotion} />
	{/if}
	<h2 class="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
		{$t("season_recap.awards.title")}
	</h2>

	<div class="grid grid-cols-2 gap-2.5 w-full">
		{#each ordered as award (award.key)}
			<div
				class="rounded-xl p-3 text-left border {wonKeys.has(award.key)
					? 'bg-[#F59E0B]/15 border-[#F59E0B]/40'
					: 'bg-white/5 border-transparent'}"
			>
				<div class="flex items-center gap-1.5 mb-1.5">
					<span aria-hidden="true">{AWARD_EMOJI[award.key] ?? "\u{1F3C6}"}</span>
					<span class="text-[9px] uppercase tracking-wide text-white/50 font-bold truncate">
						{$t(`season_awards.${award.key}.label`)}
					</span>
				</div>
				{#if award.players?.[0]}
					<div class="flex items-center gap-1.5">
						{#if award.players[0].avatar_url}
							<img referrerpolicy="no-referrer"
								src={award.players[0].avatar_url}
								alt=""
								class="w-5 h-5 rounded-full object-cover shrink-0"
							/>
						{:else}
							<span
								class="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0"
								style:background={avatarGradient(
									award.players[0].player_id ?? award.players[0].username,
								).gradient}
							>
								{initial(award.players[0].username)}
							</span>
						{/if}
						<span class="text-[11px] font-bold truncate">
							{award.players.map((p) => p.username).join(" & ")}
						</span>
					</div>
				{/if}
				<div class="text-sm font-extrabold mt-1">{formatAwardValue(award.value, award.unit)}</div>
			</div>
		{/each}
	</div>

	{#if wonAnyAward}
		<p class="text-[13px] text-[#F59E0B] font-bold mt-1">{$t("season_recap.awards.you_won")}</p>
	{/if}
</div>
