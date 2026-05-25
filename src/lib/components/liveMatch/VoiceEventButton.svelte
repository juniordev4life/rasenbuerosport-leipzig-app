<script>
import { getTranslate } from "@tolgee/svelte";
import { parseLiveMatchVoiceEvent } from "$lib/services/liveMatchVoice.services.js";

/**
 * Hold-to-talk button that records German speech via the browser's
 * Web Speech API, ships the transcript to the API for intent
 * extraction, and emits a structured event the parent can replay
 * through the live-match state machine.
 *
 * The component is intentionally self-contained — its only side
 * effect on the rest of the app is the `onResult` callback. The
 * parent decides whether to apply the result, show an error, etc.
 *
 * @type {{
 *   players: Array<{ id: string, username: string, side: "home"|"away" }>,
 *   currentMinute: number,
 *   disabled?: boolean,
 *   onResult: (result: {
 *     ok: true,
 *     eventType: "goal"|"yellow_card"|"red_card"|"penalty_missed",
 *     playerId: string,
 *     side: "home"|"away",
 *     minute: number,
 *     transcript: string,
 *   } | { ok: false, reason: string, transcript: string }) => void,
 * }}
 */
let { players, currentMinute, disabled = false, onResult } = $props();

const { t } = getTranslate();

/** @type {"idle"|"recording"|"processing"|"unsupported"} */
let phase = $state(detectInitialPhase());
let liveTranscript = $state("");
let errorMessage = $state("");

/** @type {SpeechRecognition|null} */
let recognition = null;
let finalTranscript = "";

function detectInitialPhase() {
	if (typeof window === "undefined") return "unsupported";
	const Recog =
		window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
	return Recog ? "idle" : "unsupported";
}

/**
 * Lazily build a fresh SpeechRecognition for each press. Recreating
 * is safer than reusing — iOS Safari sometimes refuses to restart a
 * previously-finished instance.
 */
function createRecognition() {
	const Recog = window.SpeechRecognition ?? window.webkitSpeechRecognition;
	const rec = new Recog();
	rec.lang = "de-DE";
	rec.interimResults = true;
	rec.continuous = false;
	rec.maxAlternatives = 1;
	return rec;
}

function startRecording() {
	if (disabled || phase !== "idle") return;
	errorMessage = "";
	liveTranscript = "";
	finalTranscript = "";

	try {
		recognition = createRecognition();
	} catch (err) {
		errorMessage = err?.message ?? "Speech API failed to initialise";
		return;
	}

	recognition.onresult = (event) => {
		let interim = "";
		let final = "";
		for (let i = event.resultIndex; i < event.results.length; i += 1) {
			const chunk = event.results[i];
			if (chunk.isFinal) final += chunk[0].transcript;
			else interim += chunk[0].transcript;
		}
		if (final) finalTranscript += final;
		liveTranscript = (finalTranscript + interim).trim();
	};

	recognition.onerror = (event) => {
		// "no-speech" is informational — user held the button and said
		// nothing. Surface it as a soft error and reset to idle.
		errorMessage =
			event.error === "no-speech"
				? $t("live_match.voice.error_no_speech")
				: $t("live_match.voice.error_generic");
		stopRecognitionSilently();
		phase = "idle";
	};

	recognition.onend = async () => {
		const transcript = finalTranscript.trim() || liveTranscript.trim();
		recognition = null;
		if (!transcript) {
			phase = "idle";
			return;
		}
		phase = "processing";
		try {
			const result = await parseLiveMatchVoiceEvent({
				transcript,
				players,
				currentMinute,
			});
			onResult?.(result);
			if (!result?.ok) {
				errorMessage = result?.reason ?? $t("live_match.voice.error_generic");
			}
		} catch (err) {
			errorMessage = err?.message ?? $t("live_match.voice.error_generic");
			onResult?.({ ok: false, reason: errorMessage, transcript });
		} finally {
			phase = "idle";
			liveTranscript = "";
		}
	};

	try {
		recognition.start();
		phase = "recording";
	} catch (err) {
		errorMessage = err?.message ?? "Speech API failed to start";
		phase = "idle";
	}
}

function stopRecording() {
	if (phase !== "recording") return;
	try {
		recognition?.stop();
	} catch {
		// Some browsers throw if stop() is called too early — ignore.
	}
}

function stopRecognitionSilently() {
	try {
		recognition?.abort?.();
	} catch {
		// no-op
	}
	recognition = null;
}

function handlePointerDown(event) {
	// Pointer events cover mouse + touch + pen with one path. We
	// capture so a finger that slides off the button still releases.
	event.currentTarget?.setPointerCapture?.(event.pointerId);
	startRecording();
}

function handlePointerUp() {
	stopRecording();
}

function handleKeyDown(event) {
	if ((event.key === " " || event.key === "Enter") && !event.repeat) {
		event.preventDefault();
		startRecording();
	}
}

function handleKeyUp(event) {
	if (event.key === " " || event.key === "Enter") {
		event.preventDefault();
		stopRecording();
	}
}
</script>

{#if phase !== "unsupported"}
	<button
		type="button"
		class="voice-bar {phase}"
		class:disabled
		aria-pressed={phase === "recording"}
		aria-label={$t("live_match.voice.aria_label")}
		onpointerdown={handlePointerDown}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		onpointerleave={handlePointerUp}
		onkeydown={handleKeyDown}
		onkeyup={handleKeyUp}
	>
		<span class="mic {phase === 'recording' ? 'recording' : ''}" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
				<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
				<path d="M19 10v2a7 7 0 01-14 0v-2" />
				<line x1="12" y1="19" x2="12" y2="23" />
				<line x1="8" y1="23" x2="16" y2="23" />
			</svg>
		</span>

		<span class="info">
			{#if phase === "recording"}
				<span class="label recording">{$t("live_match.voice.label_recording")}</span>
				<span class="hint recording">{$t("live_match.voice.hint_recording")}</span>
				{#if liveTranscript}
					<span class="transcript">„{liveTranscript}"</span>
				{/if}
			{:else if phase === "processing"}
				<span class="label">{$t("live_match.voice.label_processing")}</span>
				<span class="hint">{$t("live_match.voice.hint_processing")}</span>
			{:else}
				<span class="label">{$t("live_match.voice.label_idle")}</span>
				<span class="hint">{$t("live_match.voice.hint_idle")}</span>
				{#if errorMessage}
					<span class="error">{errorMessage}</span>
				{/if}
			{/if}
		</span>

		{#if phase === "recording"}
			<span class="waveform" aria-hidden="true">
				<span></span><span></span><span></span><span></span><span></span>
			</span>
		{:else if phase === "processing"}
			<span class="spinner" aria-hidden="true"></span>
		{/if}
	</button>
{/if}

<style>
.voice-bar {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	background: var(--color-bg-secondary);
	border: 1px solid var(--color-border);
	border-radius: 14px;
	padding: 14px;
	text-align: left;
	color: inherit;
	cursor: pointer;
	user-select: none;
	transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}
.voice-bar:active { background: var(--color-bg-input); }
.voice-bar.recording {
	background: linear-gradient(180deg, rgba(226, 75, 74, 0.10), var(--color-bg-secondary));
	border-color: rgba(226, 75, 74, 0.5);
	box-shadow: 0 0 0 1px rgba(226, 75, 74, 0.2), 0 4px 20px rgba(226, 75, 74, 0.25);
}
.voice-bar.processing {
	border-color: rgba(132, 204, 22, 0.4);
}
.voice-bar.disabled, .voice-bar:disabled {
	opacity: 0.5;
	pointer-events: none;
}

.mic {
	width: 38px; height: 38px;
	border-radius: 50%;
	background: var(--color-bg-input);
	border: 1px solid var(--color-border);
	display: flex; align-items: center; justify-content: center;
	flex-shrink: 0;
	color: var(--color-text-secondary);
	transition: background 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s;
}
.mic.recording {
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	border-color: rgba(226, 75, 74, 0.7);
	color: #fff;
	box-shadow: 0 4px 14px rgba(226, 75, 74, 0.45);
	animation: micPulse 1s ease-in-out infinite;
}
@keyframes micPulse {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.06); }
}

.info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.label {
	font-size: 13px;
	font-weight: 700;
	color: var(--color-text-primary);
	line-height: 1.2;
}
.label.recording { color: #E24B4A; }
.hint {
	font-size: 11px;
	color: var(--color-text-muted);
}
.hint.recording { color: #FCA5A5; }
.transcript {
	font-size: 11px;
	color: #FCA5A5;
	margin-top: 4px;
	padding-top: 6px;
	border-top: 1px solid rgba(226, 75, 74, 0.18);
	font-style: italic;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
.error {
	margin-top: 4px;
	font-size: 11px;
	color: var(--color-error);
}

.waveform {
	display: flex;
	align-items: center;
	gap: 3px;
	height: 24px;
	flex-shrink: 0;
}
.waveform span {
	display: inline-block;
	width: 3px;
	background: #E24B4A;
	border-radius: 2px;
	animation: waveform 0.8s ease-in-out infinite;
}
.waveform span:nth-child(1) { height: 8px; animation-delay: 0s; }
.waveform span:nth-child(2) { height: 16px; animation-delay: 0.1s; }
.waveform span:nth-child(3) { height: 22px; animation-delay: 0.2s; }
.waveform span:nth-child(4) { height: 14px; animation-delay: 0.3s; }
.waveform span:nth-child(5) { height: 10px; animation-delay: 0.4s; }
@keyframes waveform {
	0%, 100% { transform: scaleY(0.4); }
	50% { transform: scaleY(1.2); }
}

.spinner {
	width: 18px; height: 18px;
	border-radius: 50%;
	border: 2px solid rgba(132, 204, 22, 0.25);
	border-top-color: #84CC16;
	animation: spin 0.8s linear infinite;
	flex-shrink: 0;
}
@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
