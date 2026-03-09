<script>
	import { getTranslate } from "@tolgee/svelte";

	/** @type {{ badges: Array<{type: string, emoji: string, unlocked: boolean, category?: string}> }} */
	let { badges = [] } = $props();

	const { t } = getTranslate();

	const unlockedCount = $derived(badges.filter((b) => b.unlocked).length);
	const totalCount = $derived(badges.length);

	/** @type {Array<{key: string, titleKey: string, badges: Array}>} */
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
			return { key, titleKey, badges: categoryBadges, unlocked, total: categoryBadges.length };
		}).filter((c) => c.total > 0);
	});
</script>

{#if badges.length > 0}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-medium text-text-primary">
				{$t("profile.badges.title")}
			</h3>
			<span class="text-xs font-bold {unlockedCount === totalCount ? 'text-success' : 'text-text-secondary'}">
				{unlockedCount}/{totalCount}
			</span>
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
