<script>
	import { getTranslate } from "@tolgee/svelte";

	/**
	 * StreakBadge - Shows current streak or sleeping status
	 * @param {{ type: string, count: number }|null} streak - Current streak
	 * @param {string|null} lastPlayedAt - ISO timestamp of last game
	 */
	let { streak = null, lastPlayedAt = null } = $props();

	const { t } = getTranslate();

	const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

	const isSleeping = $derived(() => {
		if (!lastPlayedAt) return false;
		const diff = Date.now() - new Date(lastPlayedAt).getTime();
		return diff > ONE_MONTH_MS;
	});

	const badgeData = $derived.by(() => {
		// Priority: sleeping > streak
		if (isSleeping()) {
			return {
				emoji: "\u{1F634}",
				text: $t("dashboard.streak_sleeping"),
				bgClass: "bg-text-secondary/20",
				textClass: "text-text-secondary",
			};
		}

		if (streak?.type === "loss" && streak.count >= 2) {
			return {
				emoji: "\u{1F976}",
				text: $t("dashboard.streak_loss", { count: streak.count }),
				bgClass: "bg-blue-500/20",
				textClass: "text-blue-400",
			};
		}

		if (streak?.type === "win" && streak.count >= 2) {
			return {
				emoji: "\u{1F525}",
				text: $t("dashboard.streak_win", { count: streak.count }),
				bgClass: "bg-accent-red/20",
				textClass: "text-accent-red",
			};
		}

		return null;
	});
</script>

{#if badgeData}
	<div class="flex justify-center">
		<span
			class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium {badgeData.bgClass} {badgeData.textClass}"
		>
			<span class="text-base">{badgeData.emoji}</span>
			{badgeData.text}
		</span>
	</div>
{/if}
