<script>
	import { getTranslate } from "@tolgee/svelte";

	/** @type {{ badges: Array<{type: string, emoji: string, unlocked: boolean}> }} */
	let { badges = [] } = $props();

	const { t } = getTranslate();

	const unlockedCount = $derived(badges.filter((b) => b.unlocked).length);
	const totalCount = $derived(badges.length);

	/** Sort badges: unlocked first, then locked */
	const sortedBadges = $derived(
		[...badges].sort((a, b) => {
			if (a.unlocked === b.unlocked) return 0;
			return a.unlocked ? -1 : 1;
		}),
	);
</script>

{#if badges.length > 0}
	<div class="bg-bg-secondary border border-border rounded-lg p-4">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-medium text-text-primary">
				{$t("profile.badges.title")}
			</h3>
			<span class="text-xs font-bold {unlockedCount === totalCount ? 'text-success' : 'text-text-secondary'}">
				{unlockedCount}/{totalCount}
			</span>
		</div>

		<div class="grid grid-cols-5 gap-2">
			{#each sortedBadges as badge (badge.type)}
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
{/if}
