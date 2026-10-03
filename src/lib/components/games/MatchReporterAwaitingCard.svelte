<script>
import { getTranslate } from "@tolgee/svelte";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import { storage } from "$lib/config/firebase.config.js";
import { MATCH_STATS_MAX_BYTES } from "$lib/constants/upload.constants.js";
import { post } from "$lib/services/api.services.js";
import { isUploadableImageType, resizeImage } from "$lib/utils/image.utils.js";

/**
 * Sophie's awaiting / processing card. Replaces the previous
 * three-separate-uploads UI with a single flow: the user picks up to
 * three FC26 screenshots in one go (camera or gallery), and the
 * component uploads + extracts them sequentially. Each step on the
 * stats stepper transitions through `active` → `processing` → `done`
 * so the user can see the AI working. Design A: Sophie's line as an
 * aqua-ruled quote; design B: a pale gold speech bubble.
 *
 * Slot order is fixed (`overview` → `passes` → `defense`) regardless
 * of which file the user picked — the API extractors don't know the
 * difference until they parse the image, but the order keeps the UI
 * predictable.
 *
 * @type {{
 *   gameId: string,
 *   hasOverview: boolean,
 *   hasPasses: boolean,
 *   hasDefense: boolean,
 *   onStatsExtracted?: () => void,
 *   onAllUploaded?: () => void,
 * }}
 */
let {
	gameId,
	hasOverview = false,
	hasPasses = false,
	hasDefense = false,
	onStatsExtracted,
	onAllUploaded,
} = $props();

const { t } = getTranslate();

const SLOTS = ["overview", "passes", "defense"];

const slotStatus = $state({
	overview: hasOverview ? "done" : "pending",
	passes: hasPasses ? "done" : "pending",
	defense: hasDefense ? "done" : "pending",
});

let pickerEl = $state(null);
let errorMsg = $state("");
let toast = $state(null);

const doneCount = $derived(
	SLOTS.filter((s) => slotStatus[s] === "done").length,
);
const processingSlot = $derived(
	SLOTS.find((s) => slotStatus[s] === "processing") ?? null,
);
const nextPendingSlot = $derived(
	SLOTS.find((s) => slotStatus[s] === "pending") ?? null,
);
const allDone = $derived(doneCount === SLOTS.length);
const anyUploaded = $derived(doneCount > 0);
const fillPercent = $derived((doneCount / SLOTS.length) * 100);

/**
 * Quote line under the avatar — Sophie reacts to the upload state.
 */
const quoteText = $derived.by(() => {
	if (allDone) return $t("awaiting_report.quote_done");
	if (processingSlot) {
		return $t("awaiting_report.quote_processing", {
			slot: $t(`awaiting_report.slots.${processingSlot}.label`),
		});
	}
	if (anyUploaded) return $t("awaiting_report.quote_partial");
	return $t("awaiting_report.quote_initial");
});

const statusLine = $derived.by(() => {
	if (allDone) return $t("awaiting_report.status_done");
	if (processingSlot) {
		return $t("awaiting_report.status_processing", {
			slot: $t(`awaiting_report.slots.${processingSlot}.label`),
		});
	}
	return $t("awaiting_report.status_waiting");
});

const primaryLabel = $derived.by(() => {
	if (allDone) return $t("awaiting_report.cta_done");
	if (!anyUploaded) return $t("awaiting_report.cta_all");
	if (nextPendingSlot)
		return $t("awaiting_report.cta_next", {
			slot: $t(`awaiting_report.slots.${nextPendingSlot}.label`),
		});
	return $t("awaiting_report.cta_all");
});

function openPicker() {
	if (!pickerEl) return;
	errorMsg = "";
	pickerEl.value = "";
	pickerEl.click();
}

async function handleFiles(event) {
	/** @type {FileList} */
	const list = event.target?.files;
	if (!list || list.length === 0) return;
	const files = Array.from(list).filter((f) => isUploadableImageType(f.type));
	if (files.length === 0) {
		errorMsg = $t("match_stats.error_file_type");
		return;
	}

	errorMsg = "";
	for (const file of files) {
		const slot = SLOTS.find((s) => slotStatus[s] === "pending");
		if (!slot) break;
		await uploadOne(file, slot);
	}

	if (SLOTS.every((s) => slotStatus[s] === "done")) {
		onAllUploaded?.();
	}
}

async function uploadOne(file, slot) {
	slotStatus[slot] = "processing";
	try {
		// Narrow files over the cap get re-encoded; anything still larger
		// would fail in storage.rules with a raw storage/unauthorized error.
		const resized = await resizeImage(file, 1920, MATCH_STATS_MAX_BYTES);
		if (resized.size > MATCH_STATS_MAX_BYTES) {
			throw new Error($t("match_stats.error_file_size"));
		}
		const storageRef = ref(storage, `match-stats/${gameId}/${slot}.jpg`);
		await uploadBytes(storageRef, resized);
		const imageUrl = await getDownloadURL(storageRef);
		await post(`/v1/games/${gameId}/match-stats`, {
			imageUrl,
			type: slot,
		});
		slotStatus[slot] = "done";
		toast = {
			slot,
			label: $t(`awaiting_report.slots.${slot}.label`),
		};
		setTimeout(() => {
			if (toast?.slot === slot) toast = null;
		}, 3200);
		onStatsExtracted?.();
	} catch (err) {
		console.error(`Failed to upload ${slot}:`, err);
		errorMsg = err?.message || $t("match_stats.error_generic");
		slotStatus[slot] = "pending";
	}
}

/**
 * Visual state of a single stepper node.
 * @param {"overview"|"passes"|"defense"} slot
 * @returns {"done"|"processing"|"active"|"pending"}
 */
function nodeState(slot) {
	const status = slotStatus[slot];
	if (status === "done") return "done";
	if (status === "processing") return "processing";
	if (slot === nextPendingSlot && !allDone) return "active";
	return "pending";
}

/**
 * Compact label under each stepper circle.
 * @param {"done"|"processing"|"active"|"pending"} state
 */
function subLabel(state) {
	return $t(`awaiting_report.sub.${state}`);
}

// iOS Safari forces the camera into the picker sheet when `capture` is
// set, but its camera UI only takes ONE photo and then closes — so the
// `multiple` attribute is effectively useless there, and users assume
// they can only snap one shot. Drop `capture` on iOS so the native sheet
// presents Camera / Photo Library / Files as equal options and the
// gallery path can deliver up to three images at once. Android keeps the
// hint because its camera UI can chain multiple captures.
const isIOS =
	typeof navigator !== "undefined" &&
	/iPad|iPhone|iPod/.test(navigator.userAgent);
</script>

<input
	bind:this={pickerEl}
	type="file"
	accept="image/*"
	capture={isIOS ? undefined : "environment"}
	multiple
	style="display: none;"
	onchange={handleFiles}
/>

<div class="card awaiting">
	<div class="head">
		<span class="sophie" class:thinking={!!processingSlot}>
			<img src="/images/reporter/sophie.webp" alt="Sophie" />
		</span>
		<div class="info">
			<span class="name">Sophie</span>
			<span class="status">
				<span class="status-dot" aria-hidden="true"></span>
				<span>{statusLine}</span>
			</span>
		</div>
	</div>

	{#if toast}
		<div class="toast" role="status">
			<span class="toast-icon" aria-hidden="true"><CheckIcon size={13} strokeWidth={3} /></span>
			<span class="toast-text">
				<strong>{toast.label}</strong>
				{$t("awaiting_report.toast_extracted")}
			</span>
		</div>
	{/if}

	<p class="quote bubble">{quoteText}</p>

	<div class="steps">
		<div class="steps-head">
			<span class="label">{$t("awaiting_report.screenshots_label")}</span>
			<span class="counter">
				{doneCount} / {SLOTS.length}
				<span class="counter-suffix">{$t("awaiting_report.counter_suffix")}</span>
			</span>
		</div>
		<div class="stepper">
			<div class="line" aria-hidden="true"></div>
			<div class="line-fill" aria-hidden="true" style="width: {(fillPercent / 100) * 72}%;"></div>
			{#each SLOTS as slot (slot)}
				{@const state = nodeState(slot)}
				<div class="node {state}">
					<span class="circle">
						{#if state === "done"}
							<CheckIcon size={14} strokeWidth={3} />
						{:else}
							{SLOTS.indexOf(slot) + 1}
						{/if}
					</span>
					<span class="node-label">{$t(`awaiting_report.slots.${slot}.label`)}</span>
					<span class="node-sub">{subLabel(state)}</span>
				</div>
			{/each}
		</div>
	</div>

	{#if errorMsg}
		<p class="error">{errorMsg}</p>
	{/if}

	{#if !allDone}
		<div class="actions">
			<button type="button" class="btn btn-primary w-full" onclick={openPicker}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
					<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
					<circle cx="12" cy="13" r="4" />
				</svg>
				<span>{primaryLabel}</span>
			</button>
			<button type="button" class="btn btn-ghost btn-sm secondary" onclick={openPicker}>
				{anyUploaded
					? $t("awaiting_report.secondary_reupload")
					: $t("awaiting_report.secondary_gallery")}
			</button>
		</div>
	{/if}
</div>

<style>
.awaiting {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
}

/* ── Sophie ────────────────────────────────────────────────────────── */
.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.sophie {
	position: relative;
	width: 52px;
	height: 52px;
	flex-shrink: 0;
	border-radius: var(--radius-avatar);
	background: var(--color-sunken);
	box-shadow: 0 0 0 2px var(--color-aqua);
}

.sophie img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: var(--radius-avatar);
}

/* An arc circling the photo while a screenshot is being read. */
.sophie.thinking::after {
	content: "";
	position: absolute;
	inset: -6px;
	border: 2px solid transparent;
	border-top-color: var(--color-aqua);
	border-radius: 999px;
	animation: spin 1.8s linear infinite;
}

.info {
	display: flex;
	flex-direction: column;
	gap: 3px;
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

.status {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: var(--color-muted);
	font-size: 13px;
}

.status-dot {
	width: 7px;
	height: 7px;
	flex-shrink: 0;
	border-radius: 999px;
	background: var(--color-gold);
	animation: blink 1.5s ease-in-out infinite;
}

.toast {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	border-radius: var(--radius-tile);
	background: var(--color-win-soft);
	color: var(--color-win);
	font-size: 14px;
}

.toast-icon {
	width: 24px;
	height: 24px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius-avatar);
	background: var(--color-win);
	color: var(--color-on-win);
}

.toast-text {
	flex: 1;
	line-height: 1.3;
}

.toast-text strong {
	color: var(--color-ink);
	font-weight: 700;
}

.quote {
	margin: 0;
	padding: 2px 0 2px 12px;
	border-left: 3px solid var(--color-aqua);
	font-style: italic;
	font-size: 15px;
	line-height: 1.5;
}

/* ── Screenshot stepper ────────────────────────────────────────────── */
.steps {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.steps-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	color: var(--color-muted);
}

.counter {
	color: var(--color-ink);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.counter-suffix {
	color: var(--color-muted);
	font-family: var(--font-sans);
	font-weight: 500;
	font-size: 13px;
}

.stepper {
	position: relative;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.line,
.line-fill {
	position: absolute;
	top: 15px;
	left: 14%;
	height: 3px;
	border-radius: var(--radius-bar);
}

.line {
	right: 14%;
	background: var(--color-track);
}

.line-fill {
	background: var(--color-progress);
	transition: width 0.4s ease;
}

.node {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	text-align: center;
}

.circle {
	position: relative;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius-avatar);
	background: var(--color-sunken);
	color: var(--color-ink);
	box-shadow: inset 0 0 0 2px var(--color-line);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	transition:
		background-color 0.3s,
		color 0.3s,
		box-shadow 0.3s;
}

.done .circle {
	background: var(--color-win);
	color: var(--color-on-win);
	box-shadow: none;
}

.active .circle {
	background: var(--color-gold);
	color: var(--color-on-gold);
	box-shadow: 0 0 0 4px var(--color-gold-soft);
	animation: breathe 2s ease-in-out infinite;
}

.processing .circle {
	background: var(--color-surface);
	box-shadow: inset 0 0 0 2px var(--color-aqua);
}

.processing .circle::before {
	content: "";
	position: absolute;
	inset: -5px;
	border: 2px solid transparent;
	border-top-color: var(--color-aqua);
	border-radius: 999px;
	animation: spin 1.2s linear infinite;
}

.node-label {
	color: var(--color-muted);
	font-weight: 700;
	font-size: 13px;
}

.done .node-label {
	color: var(--color-win);
}

.active .node-label,
.processing .node-label {
	color: var(--color-ink);
}

.node-sub {
	margin-top: -3px;
	color: var(--color-muted);
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 11px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.done .node-sub {
	color: var(--color-win);
}

.error {
	margin: 0;
	padding: 10px 12px;
	border-radius: var(--radius-tile);
	background: var(--color-loss-soft);
	color: var(--color-loss);
	font-weight: 600;
	font-size: 14px;
}

/* ── Actions ───────────────────────────────────────────────────────── */
.actions {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
}

.secondary {
	color: var(--color-muted);
	font-weight: 600;
	font-size: 13px;
	text-decoration: underline;
	text-underline-offset: 3px;
}

.secondary:hover:not(:disabled) {
	color: var(--color-ink);
}

@keyframes blink {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.3;
	}
}

@keyframes breathe {
	0%,
	100% {
		box-shadow: 0 0 0 4px var(--color-gold-soft);
	}
	50% {
		box-shadow: 0 0 0 7px var(--color-gold-soft);
	}
}

/* ── Design B: bold name, Sophie's line as a speech bubble ─────────── */
:global([data-variant="b"]) .name {
	font-weight: 800;
	font-size: 21px;
	letter-spacing: 0;
	text-transform: none;
}

/* B: the shared `.bubble`; drop A's ruled quote, whose padding would
 * otherwise win over the bubble's. */
:global([data-variant="b"]) .quote {
	padding: 14px 16px;
	border-left: 0;
	font-style: normal;
	font-weight: 500;
}

:global([data-variant="b"]) .node-sub {
	font-family: var(--font-sans);
	letter-spacing: 0;
	text-transform: none;
}

@media (prefers-reduced-motion: reduce) {
	.sophie.thinking::after,
	.status-dot,
	.active .circle,
	.processing .circle::before {
		animation: none;
	}
}
</style>
