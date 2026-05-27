<script>
import { getTranslate } from "@tolgee/svelte";
import UsersIcon from "$lib/components/icons/UsersIcon.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import { avatarGradient } from "$lib/utils/avatarColor.utils.js";

/**
 * "Lieblingsgegner & Co" — three optional relation rows.
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

function initial(name) {
	return (name ?? "?").charAt(0).toUpperCase();
}

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
	<div class="section-card">
		<div class="section-header">
			<div class="section-label">
				<UsersIcon size={12} strokeWidth={1.8} />
				<span>{$t("profile.relations_section")}</span>
				<InfoTip
					titleKey="info_tips.relations.title"
					bodyKey="info_tips.relations.body"
					size={13}
				/>
			</div>
		</div>
		<div class="relations-list">
			{#each items as r (r.type)}
				{@const g = avatarGradient(r.playerId)}
				<button
					type="button"
					class="relation-row"
					onclick={() => onSelect?.({ type: r.type, playerId: r.playerId })}
				>
					<div class="relation-tag {r.type}">{tagLabel(r.type)}</div>
					<div class="relation-avatar" style="background: {g.gradient};">
						{#if r.avatarUrl}
							<img src={r.avatarUrl} alt={r.name} />
						{:else}
							<span>{initial(r.name)}</span>
						{/if}
					</div>
					<div class="relation-info">
						<div class="relation-name">{r.name}</div>
						<div class="relation-meta">{metaLabel(r)}</div>
					</div>
					<div class="relation-arrow">›</div>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
.section-card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 14px;
	padding: 14px;
}
.section-header { margin-bottom: 14px; }
.section-label {
	font-size: 10px;
	text-transform: uppercase; letter-spacing: 0.1em;
	color: #6B7280;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
.relations-list { display: flex; flex-direction: column; gap: 8px; }
.relation-row {
	background: rgba(0,0,0,0.2);
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 10px 12px;
	display: flex; align-items: center; gap: 11px;
	cursor: pointer;
	transition: background-color .15s;
	text-align: left;
	width: 100%;
}
.relation-row:hover { background: rgba(255,255,255,0.04); }
.relation-tag {
	font-size: 9px; font-weight: 800;
	text-transform: uppercase; letter-spacing: 0.08em;
	padding: 2px 8px; border-radius: 999px;
	flex-shrink: 0;
}
.relation-tag.favorite {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
	border: 1px solid rgba(132, 204, 22, 0.3);
}
.relation-tag.nemesis {
	background: rgba(226, 75, 74, 0.15);
	color: #E24B4A;
	border: 1px solid rgba(226, 75, 74, 0.3);
}
.relation-tag.partner {
	background: rgba(132, 204, 22, 0.15);
	color: #84CC16;
	border: 1px solid rgba(132, 204, 22, 0.3);
}
.relation-avatar {
	width: 36px; height: 36px; border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 13px; font-weight: 700; color: white;
	flex-shrink: 0;
	overflow: hidden;
}
.relation-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.relation-info { flex: 1; min-width: 0; }
.relation-name {
	font-size: 13px; font-weight: 700;
	color: #E5E7EB;
	margin-bottom: 1px;
}
.relation-meta {
	font-size: 10px;
	color: #6B7280;
	font-variant-numeric: tabular-nums;
}
.relation-arrow {
	color: #4B5563;
	font-size: 16px;
	flex-shrink: 0;
}
</style>
