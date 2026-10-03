<script>
import { getTranslate } from "@tolgee/svelte";
import { env as publicEnv } from "$env/dynamic/public";
import ReporterBioModal from "$lib/components/games/ReporterBioModal.svelte";
import InfoTip from "$lib/components/ui/InfoTip.svelte";
import { getReporter } from "$lib/constants/reporters.constants.js";
import { post } from "$lib/services/api.services.js";
import MatchAudioPlayer from "./MatchAudioPlayer.svelte";

/**
 * Feature flag for the TTS audio render. Off by default so test runs
 * don't burn through audio credits — set `PUBLIC_AUDIO_REPORT_ENABLED=true`
 * in `.env` (or as a Firebase Hosting build env) to bring the
 * auto-generation + player back.
 *
 * Read via `$env/dynamic/public` so a missing var at build time
 * doesn't crash the build — defaults to disabled.
 */
const AUDIO_ENABLED = publicEnv.PUBLIC_AUDIO_REPORT_ENABLED === "true";

/**
 * The AI match report: the reporter's photo (opens their bio) with a
 * ring in the persona's colour, name and role, the report text and the
 * audio player. Design A: plain text on the white card. Design B: the
 * text in a pale gold speech bubble, like Frank on the home page.
 *
 * The report and audio are auto-generated on first mount when missing,
 * mirroring the previous `MatchReportCard` behaviour, so the page
 * doesn't have to orchestrate generation.
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
let reportError = $state(false);

let audioUrl = $state(existingAudioUrl);
let audioLoading = $state(false);
let audioError = $state(false);

let bioOpen = $state(false);

const reporter = $derived(getReporter(reporterId));

$effect(() => {
	if (!report && !generating && !reportError) generateReport();
});

$effect(() => {
	if (!AUDIO_ENABLED) return;
	if (report && !audioUrl && !audioLoading && !audioError) generateAudio();
});

async function generateReport() {
	generating = true;
	reportError = false;
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
		reportError = true;
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

{#snippet role()}
	<span class="role">
		<span>{$t("game_detail.report.reporter_role")}</span>
		<InfoTip
			titleKey="info_tips.reporter.title"
			bodyKey="info_tips.reporter.body"
			size={14}
		/>
	</span>
{/snippet}

<div class="card report">
	<div class="head">
		{#if reporter}
			<button
				type="button"
				class="photo ring-2 {reporter.ringClass}"
				onclick={() => (bioOpen = true)}
				aria-label={$t("match_report.reporter_bio_cta", { name: reporter.name })}
			>
				<img src={reporter.imageUrl} alt={reporter.name} />
			</button>
			<div class="info">
				<span class="name">{reporter.name}</span>
				{@render role()}
			</div>
		{:else}
			<span class="photo placeholder" aria-hidden="true">?</span>
			<div class="info">
				<span class="name">{$t("game_detail.report.reporter_unknown")}</span>
				{@render role()}
			</div>
		{/if}
	</div>

	{#if generating && !report}
		<p class="status">
			<span class="spinner spinner-sm" aria-hidden="true"></span>
			{$t("match_report.generating")}
		</p>
	{:else if reportError && !report}
		<div class="problem">
			<span>{$t("match_report.error")}</span>
			<button
				type="button"
				class="btn btn-sm btn-secondary"
				onclick={() => {
					reportError = false;
					generateReport();
				}}
				disabled={generating}
			>
				{$t("match_report.retry")}
			</button>
		</div>
	{:else if report}
		<p class="text bubble">{report}</p>
	{/if}

	{#if AUDIO_ENABLED}
		{#if audioUrl}
			<MatchAudioPlayer {audioUrl} />
		{:else if audioLoading}
			<p class="status">
				<span class="spinner spinner-sm" aria-hidden="true"></span>
				{$t("match_report.generating_audio")}
			</p>
		{:else if audioError}
			<div class="problem">
				<span>{$t("match_report.audio_error")}</span>
				<button
					type="button"
					class="btn btn-sm btn-secondary"
					onclick={() => {
						audioError = false;
						generateAudio();
					}}
					disabled={audioLoading}
				>
					{$t("match_report.audio_retry")}
				</button>
			</div>
		{/if}
	{/if}
</div>

{#if reporter && bioOpen}
	<ReporterBioModal {reporter} onClose={() => (bioOpen = false)} />
{/if}

<style>
.report {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
}

.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.photo {
	width: 52px;
	height: 52px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	border: 0;
	overflow: hidden;
	border-radius: var(--radius-avatar);
	background: var(--color-sunken);
	cursor: pointer;
}

.photo img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.photo.placeholder {
	color: var(--color-ink);
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 20px;
	cursor: default;
}

.info {
	display: flex;
	flex-direction: column;
	gap: 2px;
	flex: 1;
	min-width: 0;
}

.name {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 18px;
	letter-spacing: 0.03em;
	line-height: 1.1;
	text-transform: uppercase;
}

.role {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: var(--color-muted);
	font-size: 13px;
}

.text {
	margin: 0;
	font-size: 16px;
	line-height: 1.55;
	white-space: pre-line;
}

.status {
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0;
	color: var(--color-muted);
	font-size: 14px;
	font-style: italic;
}

.problem {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 10px 12px;
	border-radius: var(--radius-tile);
	background: var(--color-loss-soft);
	color: var(--color-loss);
	font-size: 14px;
	font-weight: 600;
}

/* Design B: bold name, the report in the shared pale gold `.bubble`. */
:global([data-variant="b"]) .name {
	font-weight: 800;
	font-size: 21px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .text {
	font-weight: 500;
}
</style>
