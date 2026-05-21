<script>
import { getTranslate } from "@tolgee/svelte";
import ReporterBioModal from "$lib/components/games/ReporterBioModal.svelte";
import { getReporter } from "$lib/constants/reporters.constants.js";
import { post } from "$lib/services/api.services.js";

/**
 * Match report panel with prominent reporter header at the top.
 * Auto-generates the report on first mount when none exists yet and
 * exposes a collapsed "Audio-Version generieren" CTA that expands
 * into a regular audio player after the TTS render completes.
 *
 * @type {{
 *   gameId: string,
 *   existingReport?: string|null,
 *   existingAudioUrl?: string|null,
 *   existingReporterId?: string|null,
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

let report = $state(existingReport);
let reporterId = $state(existingReporterId);
let generating = $state(false);
let error = $state(false);

let audioUrl = $state(existingAudioUrl);
let audioLoading = $state(false);
let audioError = $state(false);

let bioOpen = $state(false);

const reporter = $derived(getReporter(reporterId));

$effect(() => {
	if (!report && !generating && !error) generateReport();
});

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
		audioUrl = null;
		onReportGenerated?.(report);
	} catch (err) {
		console.error("Failed to generate match report:", err);
		error = true;
	} finally {
		generating = false;
	}
}

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

<section class="rounded-2xl border border-border bg-bg-secondary p-4 sm:p-5">
	<h3 class="text-[11px] tracking-[0.08em] uppercase text-text-muted font-semibold mb-4">
		{$t("game_detail.section.report")}
	</h3>

	<div class="flex items-center gap-3 pb-4 mb-4 border-b border-border">
		{#if reporter}
			<button
				type="button"
				onclick={() => (bioOpen = true)}
				class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 {reporter.ringClass} hover:ring-offset-2 hover:ring-offset-bg-secondary transition-all shrink-0"
				aria-label={$t("match_report.reporter_bio_cta", { name: reporter.name })}
			>
				<img src={reporter.imageUrl} alt={reporter.name} class="w-full h-full object-cover" loading="lazy" />
			</button>
		{:else}
			<div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-semibold text-base shrink-0">
				?
			</div>
		{/if}
		<div class="leading-tight flex-1 min-w-0">
			{#if reporter}
				<button
					type="button"
					onclick={() => (bioOpen = true)}
					class="block text-left text-sm sm:text-[15px] font-semibold truncate hover:underline focus:outline-none focus-visible:underline"
				>
					{reporter.name}, {$t(reporter.titleKey)}
				</button>
				<div class="text-xs text-text-secondary mt-0.5">
					{$t("game_detail.report.reporter_role")}
				</div>
			{:else}
				<div class="text-sm sm:text-[15px] font-semibold truncate text-text-secondary">
					{$t("game_detail.report.reporter_unknown")}
				</div>
			{/if}
		</div>
	</div>

	{#if bioOpen && reporter}
		<ReporterBioModal {reporter} onClose={() => (bioOpen = false)} />
	{/if}

	{#if report}
		<p class="text-sm sm:text-[14px] leading-[1.7] text-text-secondary whitespace-pre-line">
			{report}
		</p>

		{#if reporter}
		<div class="mt-4 pt-4 border-t border-border">
			{#if audioUrl}
				<audio
					controls
					src={audioUrl}
					class="w-full"
					aria-label={$t("match_report.audio_label")}
				></audio>
			{:else}
				<button
					type="button"
					onclick={generateAudio}
					disabled={audioLoading}
					class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-accent-red/40 bg-gradient-to-br from-accent-red/10 to-accent-red/5 hover:from-accent-red/15 hover:to-accent-red/10 transition-colors disabled:opacity-60 text-left"
				>
					<span class="w-9 h-9 rounded-full bg-accent-red text-white flex items-center justify-center text-base shrink-0" aria-hidden="true">🎙</span>
					<span class="flex-1 leading-tight">
						<span class="block text-sm font-semibold text-text-primary">
							{audioLoading
								? $t("match_report.generating_audio")
								: $t("game_detail.report.audio_title")}
						</span>
						<span class="block text-xs text-text-secondary mt-0.5">
							{$t("game_detail.report.audio_meta")}
						</span>
					</span>
					{#if !audioLoading}
						<span class="text-sm font-semibold text-accent-red shrink-0" aria-hidden="true">›</span>
					{/if}
				</button>
				{#if audioError}
					<p class="mt-2 text-xs text-error">{$t("match_report.audio_error")}</p>
				{/if}
			{/if}
		</div>
		{/if}
	{:else if generating}
		<div class="flex items-center gap-3 py-2">
			<div class="animate-spin h-4 w-4 border-2 border-accent-red border-t-transparent rounded-full"></div>
			<span class="text-sm text-text-secondary">{$t("match_report.generating")}</span>
		</div>
	{:else if error}
		<p class="text-xs text-error">{$t("match_report.error")}</p>
	{/if}
</section>
