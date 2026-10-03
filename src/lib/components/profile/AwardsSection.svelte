<script>
import { getTranslate } from "@tolgee/svelte";
import PadlockIcon from "$lib/components/icons/PadlockIcon.svelte";
import TrophyIcon from "$lib/components/icons/TrophyIcon.svelte";
import TrophyMedal from "$lib/components/trophies/TrophyMedal.svelte";
import TrophyRarityChip from "$lib/components/trophies/TrophyRarityChip.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import Section from "$lib/components/ui/Section.svelte";

/**
 * "Top-Auszeichnungen": the player's best trophies with the same medal
 * and rarity chip as the trophy room, a "Neu" chip on unlocks from the
 * last 7 days, the total count and the way into the trophy room.
 *
 * @type {{
 *   awards: Array<{
 *     id?: string,
 *     name: string,
 *     description: string,
 *     type?: "bronze"|"silver"|"gold"|"diamond",
 *     category?: string|null,
 *     unlockedAt?: string|null,
 *   }>,
 *   totalCount?: number|null,
 *   onViewAll?: (() => void)|null,
 * }}
 */
let { awards = [], totalCount = null, onViewAll = null } = $props();

const { t } = getTranslate();

const FRESH_THRESHOLD_DAYS = 7;
const TIERS = new Set(["bronze", "silver", "gold", "diamond"]);

function isFresh(award) {
	if (!award?.unlockedAt) return false;
	const ts = new Date(award.unlockedAt).getTime();
	if (!Number.isFinite(ts)) return false;
	const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
	return ageDays <= FRESH_THRESHOLD_DAYS;
}

/** Unknown types fall back to gold, the old default look. */
function tierOf(award) {
	return TIERS.has(award.type) ? award.type : "gold";
}

const hasCount = $derived(totalCount != null && totalCount > 0);
</script>

<div class="awards">
	<Section title={$t("profile.awards_section")}>
		{#snippet icon()}<TrophyIcon size={22} strokeWidth={2} />{/snippet}
		{#snippet aside()}
			<InfoTip titleKey="info_tips.awards.title" bodyKey="info_tips.awards.body" />
		{/snippet}
		<div class="card body">
			{#if awards.length === 0}
				<div class="notice">
					<span class="empty-icon"><PadlockIcon size={26} strokeWidth={2} /></span>
					<p>{$t("profile.awards_empty")}</p>
				</div>
			{:else}
				<ul class="rows list">
					{#each awards as award, i (award.id ?? i)}
						<li class="award">
							<TrophyMedal
								rarity={tierOf(award)}
								category={award.category ?? "win"}
								size={48}
							/>
							<div class="info">
								<div class="name-row">
									<span class="name">{award.name}</span>
									<TrophyRarityChip rarity={tierOf(award)} />
									{#if isFresh(award)}
										<span class="chip fresh">{$t("profile.awards_new")}</span>
									{/if}
								</div>
								<p class="desc">{award.description}</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			{#if hasCount || onViewAll}
				<div class="foot">
					{#if hasCount}
						<span class="count">
							{$t("profile.awards_unlocked_count", { count: totalCount })}
						</span>
					{/if}
					{#if onViewAll}
						<button type="button" class="link view-all" onclick={onViewAll}>
							{$t("profile.awards_view_all")}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</Section>
</div>

<style>
/* ── Design A ───────────────────────────────────────────────────────── */
.body {
	padding: 0 16px;
}

.list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.award {
	display: flex;
	align-items: center;
	gap: 14px;
	min-height: 72px;
	padding: 10px 0;
	box-sizing: border-box;
}

.info {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.name-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px 8px;
}

.name {
	font-weight: 700;
	font-size: 15px;
}

/* "Neu": red in A, gold in B — as on the home page's talk-show card. */
.fresh {
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.desc {
	margin: 0;
	font-size: 13px;
	line-height: 1.3;
	color: var(--color-muted);
}

/* No award yet: the shared `.notice` with a padlock. */
.empty-icon {
	display: inline-flex;
}

.foot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px 12px;
	min-height: 52px;
	border-top: 1px solid var(--color-line);
}

.count {
	font-size: 13px;
	color: var(--color-muted);
}

.view-all {
	margin-left: auto;
	padding: 6px 0;
	border: 0;
	background: transparent;
	cursor: pointer;
}

/* ── Design B: round medals, tip inside the section card ────────────── */
:global([data-variant="b"]) .fresh {
	background: var(--color-gold);
	color: var(--color-on-gold);
}

:global([data-variant="b"]) .award {
	min-height: 70px;
}

:global([data-variant="b"]) .foot {
	min-height: 48px;
}
</style>
