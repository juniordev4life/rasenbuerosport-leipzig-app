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
 * New Spielbericht reporter card. Border-left in the active reporter's
 * accent colour, 44px reporter avatar with a 2px ring in the same
 * accent, larger reporter name (16px), persona role line, the report
 * text, and the custom audio player at the bottom.
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

const PALETTE = {
	klassiker: {
		border: "#E24B4A",
		role: "#E24B4A",
		avatarRing: "rgba(226, 75, 74, 0.45)",
		avatarBg: "linear-gradient(135deg, #4A1F22, #2A1014)",
		quoteColor: "#E24B4A",
	},
	analyst: {
		border: "#93C5FD",
		role: "#93C5FD",
		avatarRing: "rgba(147, 197, 253, 0.45)",
		avatarBg: "linear-gradient(135deg, #1E3A8A, #0F1F4D)",
		quoteColor: "#93C5FD",
	},
	euphoriker: {
		border: "#F59E0B",
		role: "#FBBF24",
		avatarRing: "rgba(245, 158, 11, 0.45)",
		avatarBg: "linear-gradient(135deg, #4A3320, #2A1F0E)",
		quoteColor: "#FBBF24",
	},
};
const skin = $derived(PALETTE[reporterId] ?? PALETTE.analyst);

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

<div class="card" style="border-left: 3px solid {skin.border};">
	<div class="header">
		{#if reporter}
			<button
				type="button"
				class="avatar-btn"
				style="background: {skin.avatarBg}; box-shadow: 0 0 0 2px {skin.avatarRing};"
				onclick={() => (bioOpen = true)}
				aria-label={$t("match_report.reporter_bio_cta", { name: reporter.name })}
			>
				<img src={reporter.imageUrl} alt={reporter.name} />
			</button>
			<div class="info">
				<div class="name">{reporter.name}</div>
				<div class="role" style="color: {skin.role};">
					<span>{$t("game_detail.report.reporter_role")}</span>
					<InfoTip
						titleKey="info_tips.reporter.title"
						bodyKey="info_tips.reporter.body"
						size={12}
					/>
				</div>
			</div>
		{:else}
			<div class="avatar-btn placeholder">?</div>
			<div class="info">
				<div class="name">{$t("game_detail.report.reporter_unknown")}</div>
				<div class="role" style="color: {skin.role};">
					<span>{$t("game_detail.report.reporter_role")}</span>
					<InfoTip
						titleKey="info_tips.reporter.title"
						bodyKey="info_tips.reporter.body"
						size={12}
					/>
				</div>
			</div>
		{/if}
	</div>

	{#if generating && !report}
		<div class="text loading">{$t("match_report.generating")}</div>
	{:else if reportError && !report}
		<div class="text error">
			<span>{$t("match_report.error")}</span>
			<button
				type="button"
				class="retry"
				onclick={() => { reportError = false; generateReport(); }}
				disabled={generating}
			>
				{$t("match_report.retry")}
			</button>
		</div>
	{:else if report}
		<div class="text">{report}</div>
	{/if}

	{#if AUDIO_ENABLED}
		{#if audioUrl}
			<MatchAudioPlayer audioUrl={audioUrl} {reporterId} />
		{:else if audioLoading}
			<div class="audio-hint">{$t("match_report.generating_audio")}</div>
		{:else if audioError}
			<div class="audio-hint audio-error">
				<span>{$t("match_report.audio_error")}</span>
				<button
					type="button"
					class="retry"
					onclick={() => { audioError = false; generateAudio(); }}
					disabled={audioLoading}
				>
					{$t("match_report.audio_retry")}
				</button>
			</div>
		{/if}
	{/if}
</div>

{#if reporter && bioOpen}
	<ReporterBioModal reporter={reporter} onClose={() => (bioOpen = false)} />
{/if}

<style>
.card {
	background: #131822;
	border: 1px solid #1F2937;
	border-radius: 18px;
	padding: 16px;
}
.header {
	display: flex; align-items: center; gap: 12px;
	margin-bottom: 14px;
}
.avatar-btn {
	width: 44px; height: 44px;
	border-radius: 50%;
	border: 0;
	overflow: hidden;
	flex-shrink: 0;
	cursor: pointer;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #9CA3AF;
	font-size: 18px;
	font-weight: 800;
}
.avatar-btn img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.avatar-btn.placeholder { background: #1F2937; }
.info { flex: 1; min-width: 0; }
.name {
	font-size: 16px;
	font-weight: 800;
	color: #FFFFFF;
	line-height: 1.1;
	margin-bottom: 2px;
}
.role {
	font-size: 11px;
	font-style: italic;
	display: inline-flex;
	align-items: center;
	gap: 4px;
}
.text {
	font-size: 13px;
	line-height: 1.65;
	color: #D1D5DB;
	margin-bottom: 14px;
	white-space: pre-line;
}
.text.loading { color: #9CA3AF; font-style: italic; }
.text.error {
	color: #E24B4A;
	display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
}
.retry {
	background: rgba(226, 75, 74, 0.12);
	border: 1px solid rgba(226, 75, 74, 0.3);
	color: #E24B4A;
	font-size: 11px;
	font-weight: 700;
	padding: 4px 10px;
	border-radius: 999px;
	cursor: pointer;
}
.retry:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.audio-hint {
	font-size: 11px;
	color: #6B7280;
	font-style: italic;
	padding: 8px 12px;
	background: rgba(0,0,0,0.2);
	border-radius: 10px;
}
.audio-hint.audio-error {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	color: #E24B4A;
	font-style: normal;
}
</style>
