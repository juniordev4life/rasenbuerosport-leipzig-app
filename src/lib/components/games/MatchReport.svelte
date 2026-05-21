<script>
import { getTranslate } from "@tolgee/svelte";
import { post } from "$lib/services/api.services.js";

/**
 * @type {{
 *   gameId: string,
 *   existingReport?: string | null,
 *   existingAudioUrl?: string | null,
 *   existingReporterId?: string | null,
 *   onReportGenerated?: (report: string) => void,
 *   onAudioGenerated?: (url: string) => void,
 *   onReporterAssigned?: (reporterId: string) => void,
 * }}
 */
let {
	gameId,
	existingReport = null,
	existingAudioUrl = null,
	existingReporterId = null,
	onReportGenerated,
	onAudioGenerated,
	onReporterAssigned,
} = $props();

const { t } = getTranslate();

const REPORTER_KEYS = new Set(["klassiker", "analyst", "euphoriker"]);

let report = $state(existingReport);
let reporterId = $state(existingReporterId);
let generating = $state(false);
let error = $state(false);

let audioUrl = $state(existingAudioUrl);
let audioLoading = $state(false);
let audioError = $state(false);

const reporterLabel = $derived(
	reporterId && REPORTER_KEYS.has(reporterId)
		? $t(`match_report.reporter.${reporterId}`)
		: null,
);

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
		const newReporter = res.data?.reporter_id || null;
		if (newReporter) {
			reporterId = newReporter;
			onReporterAssigned?.(newReporter);
		}
		// Regenerating invalidates any prior audio render on the backend;
		// drop the cached URL in the UI so the user re-renders for the
		// new persona.
		audioUrl = null;
		onReportGenerated?.(report);
	} catch (err) {
		console.error("Failed to generate match report:", err);
		error = true;
	} finally {
		generating = false;
	}
}

/**
 * Trigger TTS rendering of the report via the backend ElevenLabs
 * pipeline. Caches on the server; subsequent calls return the same URL.
 */
async function generateAudio() {
	if (audioLoading || audioUrl) return;
	audioLoading = true;
	audioError = false;
	try {
		const res = await post(`/v1/games/${gameId}/match-report/audio`, {});
		const url = res.data?.match_report_audio_url || null;
		audioUrl = url;
		if (url) onAudioGenerated?.(url);
	} catch (err) {
		console.error("Failed to generate audio report:", err);
		audioError = true;
	} finally {
		audioLoading = false;
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

		<div class="mt-4">
			{#if audioUrl}
				<audio
					controls
					src={audioUrl}
					class="w-full"
					aria-label={$t("match_report.audio_label")}
				></audio>
			{:else if audioLoading}
				<div class="flex items-center gap-3 py-2">
					<div class="animate-spin h-4 w-4 border-2 border-accent-red border-t-transparent rounded-full"></div>
					<span class="text-sm text-text-secondary">{$t("match_report.generating_audio")}</span>
				</div>
			{:else}
				<button
					type="button"
					onclick={generateAudio}
					class="inline-flex items-center gap-2 text-sm font-medium text-accent-red hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-red rounded"
				>
					<span aria-hidden="true">🔊</span>
					{$t("match_report.listen")}
				</button>
				{#if audioError}
					<p class="mt-2 text-xs text-error">{$t("match_report.audio_error")}</p>
				{/if}
			{/if}

			{#if reporterLabel}
				<p class="mt-2 text-xs text-text-tertiary">
					<span aria-hidden="true">🎙️</span>
					{$t("match_report.reporter_label")}: {reporterLabel}
				</p>
			{/if}
		</div>
	{:else if generating}
		<div class="flex items-center gap-3 py-2">
			<div class="animate-spin h-4 w-4 border-2 border-accent-red border-t-transparent rounded-full"></div>
			<span class="text-sm text-text-secondary">{$t("match_report.generating")}</span>
		</div>
	{:else if error}
		<p class="text-xs text-error">{$t("match_report.error")}</p>
	{/if}
</div>
