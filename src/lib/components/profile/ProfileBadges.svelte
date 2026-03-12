<script>
import { getTranslate } from "@tolgee/svelte";

/** @type {{ badges: Array<{type: string, emoji: string, unlocked: boolean, category?: string}> }} */
let { badges = [] } = $props();

const { t } = getTranslate();

const unlockedCount = $derived(badges.filter((b) => b.unlocked).length);
const totalCount = $derived(badges.length);

/** @type {Array<{key: string, titleKey: string}>} */
const CATEGORY_ORDER = [
	{ key: "goals", titleKey: "profile.badges.category_goals" },
	{ key: "match_stats", titleKey: "profile.badges.category_match_stats" },
	{ key: "general", titleKey: "profile.badges.category_general" },
];

/** Group badges by category, sorted: unlocked first within each group */
const categorizedBadges = $derived.by(() => {
	return CATEGORY_ORDER.map(({ key, titleKey }) => {
		const categoryBadges = badges
			.filter((b) => b.category === key)
			.sort((a, b) => {
				if (a.unlocked === b.unlocked) return 0;
				return a.unlocked ? -1 : 1;
			});
		const unlocked = categoryBadges.filter((b) => b.unlocked).length;
		return {
			key,
			titleKey,
			badges: categoryBadges,
			unlocked,
			total: categoryBadges.length,
		};
	}).filter((c) => c.total > 0);
});

/** Info dialog state */
let showInfo = $state(false);

/** Badge info data with conditions grouped by category */
const BADGE_INFO = [
	{
		titleKey: "profile.badges.category_goals",
		badges: [
			{
				emoji: "\u{1F949}",
				type: "torjaeger_bronze",
				conditionKey: "profile.badges.condition_torjaeger_bronze",
			},
			{
				emoji: "\u{1F948}",
				type: "torjaeger_silber",
				conditionKey: "profile.badges.condition_torjaeger_silber",
			},
			{
				emoji: "\u{1F947}",
				type: "torjaeger_gold",
				conditionKey: "profile.badges.condition_torjaeger_gold",
			},
			{
				emoji: "\u{1F4A0}",
				type: "torjaeger_platin",
				conditionKey: "profile.badges.condition_torjaeger_platin",
			},
			{
				emoji: "\u{1F48E}",
				type: "torjaeger_diamant",
				conditionKey: "profile.badges.condition_torjaeger_diamant",
			},
			{
				emoji: "\u270C\uFE0F",
				type: "doppelpacker",
				conditionKey: "profile.badges.condition_doppelpacker",
			},
			{
				emoji: "\u{1FA96}",
				type: "hattrick_held",
				conditionKey: "profile.badges.condition_hattrick_held",
			},
		],
	},
	{
		titleKey: "profile.badges.category_match_stats",
		badges: [
			{
				emoji: "\u{1F3AF}",
				type: "tiki_taka",
				conditionKey: "profile.badges.condition_tiki_taka",
			},
			{
				emoji: "\u{1F9F2}",
				type: "ball_magnet",
				conditionKey: "profile.badges.condition_ball_magnet",
			},
			{
				emoji: "\u26A1",
				type: "konter_king",
				conditionKey: "profile.badges.condition_konter_king",
			},
			{
				emoji: "\u{1F52B}",
				type: "xg_killer",
				conditionKey: "profile.badges.condition_xg_killer",
			},
			{
				emoji: "\u{1F4AA}",
				type: "duell_monster",
				conditionKey: "profile.badges.condition_duell_monster",
			},
			{
				emoji: "\u{1F48E}",
				type: "perfektionist",
				conditionKey: "profile.badges.condition_perfektionist",
			},
			{
				emoji: "\u{1F389}",
				type: "schuetzenfest",
				conditionKey: "profile.badges.condition_schuetzenfest",
			},
			{
				emoji: "\u{1F6E1}\uFE0F",
				type: "clean_sheet",
				conditionKey: "profile.badges.condition_clean_sheet",
			},
			{
				emoji: "\u{1F3F9}",
				type: "david_vs_goliath",
				conditionKey: "profile.badges.condition_david_vs_goliath",
			},
		],
	},
	{
		titleKey: "profile.badges.category_general",
		badges: [
			{
				emoji: "\u{1F91D}",
				type: "fair_play",
				conditionKey: "profile.badges.condition_fair_play",
			},
			{
				emoji: "\u{1F476}",
				type: "debuetant",
				conditionKey: "profile.badges.condition_debuetant",
			},
			{
				emoji: "\u2B50",
				type: "stammspieler",
				conditionKey: "profile.badges.condition_stammspieler",
			},
			{
				emoji: "\u{1F451}",
				type: "klublegende",
				conditionKey: "profile.badges.condition_klublegende",
			},
			{
				emoji: "\u{1F525}",
				type: "seriensieger",
				conditionKey: "profile.badges.condition_seriensieger",
			},
		],
	},
];
</script>

{#if badges.length > 0}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-medium text-text-primary">
				{$t("profile.badges.title")}
			</h3>
			<div class="flex items-center gap-2">
				<span class="text-xs font-bold {unlockedCount === totalCount ? 'text-success' : 'text-text-secondary'}">
					{unlockedCount}/{totalCount}
				</span>
				<button
					type="button"
					onclick={() => (showInfo = true)}
					class="text-text-secondary hover:text-text-primary transition-colors"
					aria-label={$t("profile.badges.info_title")}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-4">
			{#each categorizedBadges as category (category.key)}
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
							{$t(category.titleKey)}
						</span>
						<span class="text-[10px] font-bold {category.unlocked === category.total ? 'text-success' : 'text-text-secondary'}">
							{category.unlocked}/{category.total}
						</span>
					</div>

					<div class="grid grid-cols-5 gap-2">
						{#each category.badges as badge (badge.type)}
							<div
								class="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all {badge.unlocked
									? 'bg-bg-primary/50'
									: 'bg-bg-primary/20 opacity-35 grayscale'}"
								title={$t(`profile.badges.${badge.type}`)}
							>
								<span class="text-xl">{badge.emoji}</span>
								<span class="text-[8px] text-text-secondary text-center leading-tight line-clamp-2">
									{$t(`profile.badges.${badge.type}`)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Badge Info Dialog -->
{#if showInfo}
	<div
		class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-label={$t("profile.badges.info_title")}
	>
		<div class="bg-bg-secondary border border-border rounded-xl w-full max-w-sm max-h-[80vh] flex flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-border shrink-0">
				<h3 class="text-sm font-medium text-text-primary">{$t("profile.badges.info_title")}</h3>
				<button
					type="button"
					onclick={() => (showInfo = false)}
					class="text-text-secondary hover:text-text-primary text-lg"
					aria-label="Close"
				>
					✕
				</button>
			</div>

			<!-- Scrollable content -->
			<div class="overflow-y-auto p-4 flex flex-col gap-4">
				{#each BADGE_INFO as section (section.titleKey)}
					<div>
						<p class="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-2">
							{$t(section.titleKey)}
						</p>
						<div class="flex flex-col gap-1.5">
							{#each section.badges as badge (badge.type)}
								<div class="flex items-center gap-2.5">
									<span class="text-base shrink-0 w-6 text-center">{badge.emoji}</span>
									<div class="flex-1 min-w-0">
										<p class="text-[11px] font-medium text-text-primary">{$t(`profile.badges.${badge.type}`)}</p>
										<p class="text-[10px] text-text-secondary">{$t(badge.conditionKey)}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
