<script>
import { getTranslate } from "@tolgee/svelte";
import {
	AWARD_EMOJI,
	formatAwardValue,
	orderAwards,
} from "$lib/constants/seasonAwards.constants.js";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * Horizontal scroll strip of a closed season's league-wide awards
 * (champion, top scorer, dream duo, ...). Each chip shows the award's
 * emoji, its label, the winner's avatar(s) + name(s) and the
 * formatted value.
 *
 * @type {{ awards: Array<{ key: string, players: Array<object>, value: number, unit: string }> }}
 */
let { awards = [] } = $props();

const { t } = getTranslate();

const ordered = $derived(orderAwards(awards));

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}
</script>

{#if ordered.length > 0}
	<div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
		{#each ordered as award (award.key)}
			<div class="shrink-0 w-[168px] rounded-xl border border-line bg-surface p-3 flex flex-col gap-1.5">
				<div class="flex items-center gap-1.5">
					<span aria-hidden="true" class="text-base leading-none">
						{AWARD_EMOJI[award.key] ?? "\u{1F3C6}"}
					</span>
					<span class="text-[10px] font-bold uppercase tracking-wide text-muted truncate">
						{$t(`season_awards.${award.key}.label`)}
					</span>
				</div>
				{#if award.players?.[0]}
					<div class="flex items-center gap-2">
						{#if award.players[0].avatar_url}
							<img referrerpolicy="no-referrer"
								src={award.players[0].avatar_url}
								alt=""
								class="w-6 h-6 rounded-full object-cover shrink-0"
							/>
						{:else}
							<span
								class="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center shrink-0"
								style:background={avatarGradient(
									award.players[0].player_id ?? award.players[0].username,
								).gradient}
							>
								{initial(award.players[0].username)}
							</span>
						{/if}
						<span class="text-[12px] font-bold text-ink truncate">
							{award.players.map((p) => p.username).join(" & ")}
						</span>
					</div>
				{/if}
				<div class="text-[15px] font-extrabold text-ink tabular-nums">
					{formatAwardValue(award.value, award.unit)}
				</div>
			</div>
		{/each}
	</div>
{/if}
