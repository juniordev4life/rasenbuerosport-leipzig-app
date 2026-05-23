<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Custom audio player matching the Spielbericht design language —
 * 38px play button in the reporter's accent gradient, 4px progress
 * bar with the reporter's lighter gradient, current/total time line
 * underneath and a speed toggle on the right that cycles 1× → 1.25×
 * → 1.5× → 2×.
 *
 * @type {{
 *   audioUrl: string|null,
 *   reporterId?: "klassiker"|"analyst"|"euphoriker"|string,
 * }}
 */
let { audioUrl = null, reporterId = "analyst" } = $props();

const { t } = getTranslate();

const PALETTE = {
	klassiker: {
		btn: "linear-gradient(135deg, #E24B4A, #C73E3D)",
		fill: "linear-gradient(90deg, #E24B4A, #F87171)",
		shadow: "rgba(226, 75, 74, 0.4)",
	},
	analyst: {
		btn: "linear-gradient(135deg, #1E3A8A, #1E40AF)",
		fill: "linear-gradient(90deg, #93C5FD, #60A5FA)",
		shadow: "rgba(30, 58, 138, 0.4)",
	},
	euphoriker: {
		btn: "linear-gradient(135deg, #F59E0B, #D97706)",
		fill: "linear-gradient(90deg, #F59E0B, #FBBF24)",
		shadow: "rgba(245, 158, 11, 0.4)",
	},
};
const skin = $derived(PALETTE[reporterId] ?? PALETTE.analyst);

const SPEEDS = [1, 1.25, 1.5, 2];

let audioEl = $state(null);
let isPlaying = $state(false);
let currentTime = $state(0);
let duration = $state(0);
let speed = $state(1);

function togglePlay() {
	if (!audioEl) return;
	if (isPlaying) audioEl.pause();
	else audioEl.play();
}

function cycleSpeed() {
	if (!audioEl) return;
	const idx = SPEEDS.indexOf(speed);
	speed = SPEEDS[(idx + 1) % SPEEDS.length];
	audioEl.playbackRate = speed;
}

function handleTimeUpdate() {
	if (!audioEl) return;
	currentTime = audioEl.currentTime;
}

function handleLoadedMetadata() {
	if (!audioEl) return;
	duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
}

function formatTime(sec) {
	if (!Number.isFinite(sec) || sec < 0) return "0:00";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

const progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
</script>

{#if audioUrl}
	<div class="player">
		<button
			type="button"
			class="play-btn"
			style="background: {skin.btn}; box-shadow: 0 4px 12px {skin.shadow};"
			onclick={togglePlay}
			aria-label={isPlaying ? $t("audio_player.pause") : $t("audio_player.play")}
		>
			{#if isPlaying}
				<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
					<rect x="6" y="4" width="4" height="16" />
					<rect x="14" y="4" width="4" height="16" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-left: 2px;" aria-hidden="true">
					<polygon points="6 4 20 12 6 20" />
				</svg>
			{/if}
		</button>

		<div class="progress-wrap">
			<div class="progress-bar">
				<div
					class="progress-fill"
					style="background: {skin.fill}; width: {progress}%;"
				></div>
			</div>
			<div class="meta">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>

		<button
			type="button"
			class="speed-btn"
			onclick={cycleSpeed}
			aria-label={$t("audio_player.speed")}
		>{speed}×</button>

		<!-- svelte-ignore a11y_media_has_caption -->
		<audio
			bind:this={audioEl}
			src={audioUrl}
			preload="metadata"
			ontimeupdate={handleTimeUpdate}
			onloadedmetadata={handleLoadedMetadata}
			onended={() => { isPlaying = false; }}
			onplay={() => { isPlaying = true; }}
			onpause={() => { isPlaying = false; }}
		></audio>
	</div>
{/if}

<style>
.player {
	background: rgba(0, 0, 0, 0.25);
	border-radius: 12px;
	padding: 10px 12px;
	display: flex;
	align-items: center;
	gap: 12px;
}
.play-btn {
	width: 38px; height: 38px;
	border-radius: 50%;
	border: 0;
	color: white;
	display: flex; align-items: center; justify-content: center;
	cursor: pointer;
	flex-shrink: 0;
}
.progress-wrap { flex: 1; min-width: 0; }
.progress-bar {
	height: 4px;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 2px;
	overflow: hidden;
}
.progress-fill {
	height: 100%;
	border-radius: 2px;
	transition: width 0.2s linear;
}
.meta {
	display: flex; justify-content: space-between;
	font-size: 10px;
	color: #6B7280;
	margin-top: 4px;
	font-variant-numeric: tabular-nums;
}
.speed-btn {
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.08);
	color: #9CA3AF;
	font-size: 10px;
	font-weight: 700;
	padding: 4px 7px;
	border-radius: 6px;
	cursor: pointer;
	flex-shrink: 0;
}
.speed-btn:hover { background: rgba(255, 255, 255, 0.08); color: #E5E7EB; }
</style>
