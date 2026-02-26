<script>
	import { getTranslate } from "@tolgee/svelte";
	import { post } from "$lib/services/api.services.js";

	/** @type {{ gameId: string, existingReport?: string | null, onReportGenerated?: (report: string) => void }} */
	let { gameId, existingReport = null, onReportGenerated } = $props();

	const { t } = getTranslate();

	let report = $state(existingReport);
	let generating = $state(false);
	let error = $state(false);

	/** Auto-generate report if none exists yet */
	$effect(() => {
		if (!report && !generating && !error) {
			generateReport();
		}
	});

	/**
	 * Generate a match report via the backend AI endpoint
	 */
	async function generateReport() {
		generating = true;
		error = false;
		try {
			const res = await post(`/v1/games/${gameId}/match-report`, {});
			report = res.data?.match_report || null;
			onReportGenerated?.(report);
		} catch (err) {
			console.error("Failed to generate match report:", err);
			error = true;
		} finally {
			generating = false;
		}
	}
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-4">
	<div class="flex items-center gap-2 mb-3">
		<span class="text-base">📝</span>
		<h3 class="text-sm font-medium text-text-primary">
			{$t("match_report.title")}
		</h3>
	</div>

	{#if report}
		<p class="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
			{report}
		</p>
	{:else if generating}
		<div class="flex items-center gap-3 py-2">
			<div class="animate-spin h-4 w-4 border-2 border-accent-red border-t-transparent rounded-full"></div>
			<span class="text-sm text-text-secondary">{$t("match_report.generating")}</span>
		</div>
	{:else if error}
		<p class="text-xs text-error">{$t("match_report.error")}</p>
	{/if}
</div>
