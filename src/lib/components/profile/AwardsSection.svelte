<script>
import { getTranslate } from "@tolgee/svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import TrophyCategoryIcon from "$lib/components/trophies/TrophyCategoryIcon.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";

/**
 * Top-Auszeichnungen list with an icon-gradient per type and a
 * "Neu" pill on freshly unlocked awards (within the last 7 days).
 *
 * @type {{
 *   awards: Array<{
 *     id?: string,
 *     name: string,
 *     description: string,
 *     type?: "gold"|"silver"|"bronze"|"spark",
 *     icon?: string|null,
 *     category?: string|null,
 *     unlockedAt?: string|null,
 *   }>,
 *   totalCount?: number,
 *   unlockedCount?: number,
 *   onViewAll?: () => void,
 * }}
 */
let {
	awards = [],
	totalCount = null,
	unlockedCount = null,
	onViewAll = null,
} = $props();

const { t } = getTranslate();

const FRESH_THRESHOLD_DAYS = 7;

function isFresh(award) {
	if (!award?.unlockedAt) return false;
	const ts = new Date(award.unlockedAt).getTime();
	if (!Number.isFinite(ts)) return false;
	const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
	return ageDays <= FRESH_THRESHOLD_DAYS;
}

function awardTypeClass(t) {
	if (t === "silver") return "silver";
	if (t === "bronze") return "bronze";
	if (t === "spark") return "spark";
	return "gold";
}

function defaultIcon(type) {
	if (type === "spark") return "⚡";
	if (type === "bronze") return "\u{1F3AF}";
	if (type === "silver") return "\u{1F948}";
	return "\u{1F947}";
}
</script>

<div class="section-card">
	<div class="section-header">
		<div class="section-label">
			<TrophyIcon size={12} strokeWidth={1.8} />
			<span>{$t("profile.awards_section")}</span>
			<InfoTip
				titleKey="info_tips.awards.title"
				bodyKey="info_tips.awards.body"
				size={13}
			/>
		</div>
	</div>

	{#if awards.length === 0}
		<div class="empty">
			<div class="empty-icon">{"\u{1F512}"}</div>
			<div class="empty-text">{$t("profile.awards_empty")}</div>
		</div>
	{:else}
		<div class="awards-list">
			{#each awards as award, i (award.id ?? i)}
				{@const fresh = isFresh(award)}
				<div class="award-row" class:fresh>
					<div class="award-icon {awardTypeClass(award.type)}">
						{#if award.category}
							<TrophyCategoryIcon
								category={award.category}
								size={22}
								strokeWidth={2}
							/>
						{:else}
							{award.icon ?? defaultIcon(award.type)}
						{/if}
					</div>
					<div class="award-info">
						<div class="award-name-row">
							<span class="award-name">{award.name}</span>
							{#if fresh}
								<span class="award-fresh-tag">{$t("profile.awards_new")}</span>
							{/if}
						</div>
						<div class="award-desc">{award.description}</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if totalCount != null && totalCount > 0}
		<div class="awards-footer">
			{$t("profile.awards_unlocked_count", { count: totalCount })}
			{#if onViewAll}
				· <button type="button" class="link" onclick={onViewAll}>{$t("profile.awards_view_all")}</button>
			{/if}
		</div>
	{/if}
</div>

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
.awards-list { display: flex; flex-direction: column; gap: 8px; }
.award-row {
	background: rgba(0,0,0,0.2);
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 10px 12px;
	display: flex; align-items: center; gap: 12px;
}
.award-row.fresh {
	border-color: rgba(245, 158, 11, 0.3);
	background: linear-gradient(180deg, rgba(245, 158, 11, 0.04), rgba(0,0,0,0.2));
}
.award-icon {
	width: 40px; height: 40px; border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 18px;
	flex-shrink: 0;
	box-shadow: 0 3px 10px rgba(0,0,0,0.3);
	/* White current-color so embedded SVGs from `<TrophyCategoryIcon>`
	 * inherit a visible stroke on top of the bronze/silver/gold/spark
	 * gradient circle. Emoji fallback still renders fine — emojis carry
	 * their own colour. */
	color: white;
}
.award-icon.gold   { background: linear-gradient(135deg, #FFD700, #DAA520); }
.award-icon.silver { background: linear-gradient(135deg, #C0C0C0, #808080); }
.award-icon.bronze { background: linear-gradient(135deg, #CD7F32, #8B4513); }
.award-icon.spark  { background: linear-gradient(135deg, #E24B4A, #C73E3D); }
.award-info { flex: 1; min-width: 0; }
.award-name-row {
	display: flex; align-items: center; gap: 6px;
	margin-bottom: 1px;
}
.award-name {
	font-size: 13px; font-weight: 700;
	color: #E5E7EB;
}
.award-fresh-tag {
	background: linear-gradient(135deg, #F59E0B, #D97706);
	color: #1A1F2A;
	font-size: 8px;
	font-weight: 800;
	padding: 1px 5px;
	border-radius: 999px;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}
.award-desc {
	font-size: 10px;
	color: #9CA3AF;
}
.empty {
	display: flex; flex-direction: column; align-items: center;
	padding: 18px 0;
	gap: 8px;
}
.empty-icon { font-size: 28px; }
.empty-text { font-size: 11px; color: #6B7280; }
.awards-footer {
	text-align: center;
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid #1F2937;
	font-size: 11px;
	color: #6B7280;
}
.link {
	background: transparent; border: 0;
	color: #E24B4A;
	font-weight: 600;
	cursor: pointer;
	font-size: 11px;
}
</style>
