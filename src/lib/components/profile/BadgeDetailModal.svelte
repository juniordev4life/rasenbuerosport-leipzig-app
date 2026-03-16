<script>
import { getTranslate } from "@tolgee/svelte";

let { badge, onClose } = $props();

const { t } = getTranslate();

const isBinary = $derived(badge.progress?.target === 1);
const progressPercent = $derived(
	badge.progress?.target > 0
		? Math.min(
				100,
				Math.round((badge.progress.current / badge.progress.target) * 100),
			)
		: 0,
);

const formattedDate = $derived.by(() => {
	if (!badge.unlocked_at) return null;
	const d = new Date(badge.unlocked_at);
	return d.toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
	role="dialog"
	tabindex="-1"
	aria-label={$t(`profile.badges.${badge.type}`)}
	onmousedown={(e) => { if (e.target === e.currentTarget) onClose(); }}
	onkeydown={(e) => e.key === "Escape" && onClose()}
>
	<div class="bg-bg-secondary border border-border rounded-xl w-full max-w-xs flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-border shrink-0">
			<h3 class="text-sm font-medium text-text-primary">{$t(`profile.badges.${badge.type}`)}</h3>
			<button
				type="button"
				onclick={onClose}
				class="text-text-secondary hover:text-text-primary text-lg"
				aria-label={$t("profile.badges.detail_close")}
			>
				✕
			</button>
		</div>

		<!-- Content -->
		<div class="p-5 flex flex-col items-center gap-4">
			<!-- Large Emoji -->
			<span class="text-5xl {badge.unlocked ? '' : 'grayscale opacity-40'}">
				{badge.emoji}
			</span>

			<!-- Condition -->
			<p class="text-xs text-text-secondary text-center">
				{$t(`profile.badges.condition_${badge.type}`)}
			</p>

			<!-- Progress bar (for non-binary badges) -->
			{#if !isBinary && badge.progress}
				<div class="w-full">
					<div class="flex items-center justify-between mb-1">
						<span class="text-[10px] text-text-secondary">{$t("profile.badges.detail_progress")}</span>
						<span class="text-[10px] font-bold text-text-primary">
							{badge.progress.current}/{badge.progress.target}
						</span>
					</div>
					<div class="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
						<div
							class="h-full bg-accent-red rounded-full transition-all"
							style="width: {progressPercent}%"
						></div>
					</div>
				</div>
			{/if}

			<!-- Unlock status -->
			<div class="flex items-center gap-2">
				{#if badge.unlocked}
					<span class="text-success text-sm">✓</span>
					<span class="text-xs text-text-secondary">
						{$t("profile.badges.detail_unlocked")}
						{#if formattedDate}
							— {formattedDate}
						{/if}
					</span>
				{:else}
					<span class="text-text-secondary text-sm">✗</span>
					<span class="text-xs text-text-secondary">
						{$t("profile.badges.detail_locked")}
					</span>
				{/if}
			</div>

			<!-- Next tier (for tiered badges when unlocked) -->
			{#if badge.unlocked && badge.next_tier}
				<div class="w-full bg-bg-primary border border-border rounded-lg p-3 text-center">
					<span class="text-[10px] text-text-secondary">{$t("profile.badges.detail_next_tier")}</span>
					<p class="text-xs font-medium text-text-primary mt-0.5">
						{$t(`profile.badges.${badge.next_tier.type}`)} — {badge.next_tier.target}
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
