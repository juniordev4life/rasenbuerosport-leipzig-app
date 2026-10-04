<script>
import { getTranslate } from "@tolgee/svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * "Lieblingsgegner & Co" — up to three relation rows (favourite
 * opponent, nemesis, top duo partner), each a button that hands the
 * relation to `onSelect`. The role is always named in a chip. Design A:
 * the chip leads the row (navy / red / gold). Design B: a soft pill at
 * the row's end. Renders nothing without any relation.
 *
 * All three card objects are expected to come pre-converted: the
 * `winRate` field is an integer **percent** in `[0, 100]`, not the
 * `[0, 1]` ratio that the API ships. The parent (ProfilePage.svelte)
 * runs the conversion through `relationCardWinRatePercent` so this
 * component can render the value directly. Keeping the percent
 * conversion at the page level avoids accidentally double-converting
 * if the cards are ever fed by a different upstream.
 *
 * @type {{
 *   favorite?: { playerId: string, name: string, avatarUrl: string|null, wins: number, losses: number, winRate: number }|null,
 *   nemesis?: { playerId: string, name: string, avatarUrl: string|null, wins: number, losses: number, winRate: number }|null,
 *   topPartner?: { playerId: string, name: string, avatarUrl: string|null, matches: number, winRate: number }|null,
 *   onSelect?: (relation: { type: string, playerId: string }) => void,
 * }}
 */
let {
	favorite = null,
	nemesis = null,
	topPartner = null,
	onSelect = null,
} = $props();

const { t } = getTranslate();

const items = $derived(
	[
		favorite ? { ...favorite, type: "favorite" } : null,
		nemesis ? { ...nemesis, type: "nemesis" } : null,
		topPartner ? { ...topPartner, type: "partner" } : null,
	].filter(Boolean),
);

function tagLabel(type) {
	if (type === "favorite") return $t("profile.relation_favorite");
	if (type === "nemesis") return $t("profile.relation_nemesis");
	return $t("profile.relation_partner");
}

function metaLabel(r) {
	if (r.type === "partner") {
		return `${r.matches} ${$t("profile.games_short")} · ${Math.round(r.winRate)}% ${$t("profile.win_rate")}`;
	}
	return `${r.wins} ${$t("profile.w_short")} · ${r.losses} ${$t("profile.l_short")} · ${Math.round(r.winRate)}% ${$t("profile.win_rate")}`;
}
</script>

{#if items.length > 0}
	<div class="relations">
		<Section title={$t("profile.relations_section")}>
			{#snippet icon()}<UsersIcon size={22} strokeWidth={2} />{/snippet}
			{#snippet aside()}
				<InfoTip titleKey="info_tips.relations.title" bodyKey="info_tips.relations.body" />
			{/snippet}
			<ul class="card rows list">
				{#each items as r (r.type)}
					<li>
						<button
							type="button"
							class="row"
							onclick={() => onSelect?.({ type: r.type, playerId: r.playerId })}
						>
							<span class="chip tag tag-{r.type}">{tagLabel(r.type)}</span>
							<PlayerAvatar
								player={{ id: r.playerId, name: r.name, avatarUrl: r.avatarUrl }}
								size={40}
							/>
							<span class="info">
								<span class="name">{r.name}</span>
								<span class="meta">{metaLabel(r)}</span>
							</span>
							<svg
								class="chevron"
								viewBox="0 0 24 24"
								width="18"
								height="18"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</li>
				{/each}
			</ul>
		</Section>
	</div>
{/if}

<style>
/* ── Design A: chip first ───────────────────────────────────────────── */
.list {
	margin: 0;
	padding: 0 12px;
	list-style: none;
}

.row {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	min-height: 72px;
	padding: 0;
	border: 0;
	background: transparent;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
}

.row:hover .name {
	text-decoration: underline;
}

.tag {
	box-sizing: border-box;
	justify-content: center;
	width: 96px;
	flex-shrink: 0;
	padding: 4px 6px;
	font-size: 12px;
}

.tag-favorite {
	background: var(--color-navy);
	color: var(--color-on-navy);
}

.tag-nemesis {
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.tag-partner {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

.info {
	display: flex;
	flex-direction: column;
	gap: 3px;
	flex: 1;
	min-width: 0;
}

.name {
	font-weight: 700;
	font-size: 15px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.meta {
	font-size: 12px;
	color: var(--color-muted);
	font-variant-numeric: tabular-nums;
}

.chevron {
	flex-shrink: 0;
	color: var(--color-muted);
}

/* ── Design B: avatar first, the role as a soft pill at the end ─────── */
:global([data-variant="b"]) .list {
	padding: 0;
}

:global([data-variant="b"]) .row {
	gap: 12px;
}

:global([data-variant="b"]) .tag {
	order: 3;
	width: auto;
	padding: 4px 10px;
}

:global([data-variant="b"]) .chevron {
	order: 4;
}

:global([data-variant="b"]) .tag-favorite {
	background: var(--color-win-soft);
	color: var(--color-win);
}

:global([data-variant="b"]) .tag-nemesis {
	background: var(--color-loss-soft);
	color: var(--color-loss);
}

:global([data-variant="b"]) .tag-partner {
	background: var(--color-gold-soft);
	color: var(--color-ink);
}
</style>
