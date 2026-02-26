<script>
	import { getTranslate } from "@tolgee/svelte";

	/**
	 * StreakFeed - Shows active player streaks and badges
	 * @param {Array<object>} streaks - Players with active streaks/badges
	 */
	let { streaks = [] } = $props();

	const { t } = getTranslate();

	/**
	 * Build streak notification items from player data
	 * @param {object} player
	 * @returns {Array<{emoji: string, title: string, subtitle: string, color: string}>}
	 */
	function getStreakItems(player) {
		const items = [];
		const name = player.username;

		if (player.current_streak?.type === "win") {
			items.push({
				emoji: "\u{1F525}",
				title: $t("dashboard.streak_hot", { name }),
				subtitle: $t("dashboard.streak_hot_count", { count: player.current_streak.count }),
				color: "border-success/50 bg-success/5",
			});
		}
		if (player.current_streak?.type === "loss") {
			items.push({
				emoji: "\u{1F976}",
				title: $t("dashboard.streak_cold", { name }),
				subtitle: $t("dashboard.streak_cold_count", { count: player.current_streak.count }),
				color: "border-blue-500/50 bg-blue-500/5",
			});
		}
		for (const badge of player.badges || []) {
			if (badge.type === "wall") {
				items.push({
					emoji: "\u{1F9F1}",
					title: $t("dashboard.badge_wall", { name }),
					subtitle: $t("dashboard.badge_wall_count", { count: badge.count }),
					color: "border-warning/50 bg-warning/5",
				});
			}
			if (badge.type === "scorer") {
				items.push({
					emoji: "\u26BD",
					title: $t("dashboard.badge_scorer", { name }),
					subtitle: $t("dashboard.badge_scorer_count", { count: badge.count }),
					color: "border-accent-red/50 bg-accent-red/5",
				});
			}
		}
		return items;
	}

	/** All streak notifications flattened */
	const notifications = $derived.by(() => {
		return streaks.flatMap((p) => getStreakItems(p));
	});
</script>

<section>
	<h2 class="text-lg font-bold mb-3">{$t("dashboard.streaks_title")}</h2>

	{#if notifications.length === 0}
		<p class="text-text-secondary text-sm text-center py-4">{$t("dashboard.streaks_none")}</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each notifications as notification, i (i)}
				<div
					class="flex items-center gap-3 border rounded-lg px-3 py-2.5 {notification.color}"
				>
					<span class="text-xl shrink-0">{notification.emoji}</span>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-text-primary truncate">{notification.title}</p>
						<p class="text-[10px] text-text-secondary">{notification.subtitle}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
