<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Audio player for match reports and talk shows: red play button,
 * progress bar, elapsed/total time and a speed toggle (1× → 1.25× →
 * 1.5× → 2×). It takes the text colour of its surroundings (white on
 * the navy talk-show card in design A, navy on white cards); in design B
 * it sits in its own pale green panel.
 *
 * @type {{ audioUrl: string|null }}
 */
let { audioUrl = null } = $props();

const { t } = getTranslate();

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
			onclick={togglePlay}
			aria-label={isPlaying ? $t("audio_player.pause") : $t("audio_player.play")}
		>
			{#if isPlaying}
				<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
					<rect x="6" y="4" width="4" height="16" />
					<rect x="14" y="4" width="4" height="16" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style="margin-left: 3px;" aria-hidden="true">
					<polygon points="6 4 20 12 6 20" />
				</svg>
			{/if}
		</button>

		<div class="track-wrap">
			<div class="track">
				<div class="fill" style="width: {progress}%;"></div>
			</div>
			<div class="times">
				<span>{formatTime(currentTime)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>

		<button
			type="button"
			class="speed"
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
	display: flex;
	align-items: center;
	gap: 12px;
}

.play-btn {
	width: 48px;
	height: 48px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 0;
	border-radius: 999px;
	background: var(--color-brand);
	color: var(--color-on-brand);
	box-shadow: var(--shadow-fab);
	cursor: pointer;
}

.play-btn:hover {
	background: var(--color-brand-strong);
}

.track-wrap {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.track {
	height: 4px;
	background: color-mix(in srgb, currentColor 22%, transparent);
	border-radius: var(--radius-bar);
	overflow: hidden;
}

.fill {
	height: 100%;
	background: var(--color-brand);
	border-radius: var(--radius-bar);
	transition: width 0.2s linear;
}

.times {
	display: flex;
	justify-content: space-between;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 12px;
	font-variant-numeric: tabular-nums;
}

.speed {
	height: 32px;
	flex-shrink: 0;
	padding: 0 12px;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: inherit;
	box-shadow: inset 0 0 0 1px currentColor;
	font-size: 13px;
	cursor: pointer;
}

/* Design B: a pale green panel with a chunkier track. */
:global([data-variant="b"]) .player {
	padding: 10px 12px;
	border-radius: 18px;
	background: var(--color-win-soft);
	color: var(--color-ink);
}

:global([data-variant="b"]) .track {
	height: 6px;
	background: var(--color-chart-3);
}

:global([data-variant="b"]) .times {
	font-family: var(--font-sans);
	font-weight: 400;
	color: var(--color-muted);
}

:global([data-variant="b"]) .speed {
	background: var(--color-surface);
	box-shadow: none;
	font-weight: 700;
}
</style>
