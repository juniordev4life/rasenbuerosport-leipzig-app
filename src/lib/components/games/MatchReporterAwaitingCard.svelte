<script>
import { getTranslate } from "@tolgee/svelte";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "$lib/config/firebase.config.js";
import { post } from "$lib/services/api.services.js";
import { resizeImage } from "$lib/utils/image.utils.js";

/**
 * Sophie's awaiting / processing card. Replaces the previous
 * three-separate-uploads UI with a single flow: the user picks up to
 * three FC26 screenshots in one go (camera or gallery), and the
 * component uploads + extracts them sequentially. Each step on the
 * stats stepper transitions through `active` → `processing` → `done`
 * so the user can see the AI working.
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
	const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
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
		const resized = await resizeImage(file);
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
</script>

<input
	bind:this={pickerEl}
	type="file"
	accept="image/*"
	capture="environment"
	multiple
	style="display: none;"
	onchange={handleFiles}
/>

<div class="card">
	<div class="header">
		<div class="avatar" class:thinking={!!processingSlot}>
			<img src="/images/reporter/sophie.webp" alt="Sophie" />
		</div>
		<div class="info">
			<div class="name">Sophie</div>
			<div class="role">
				<span class="role-dot"></span>
				<span>{statusLine}</span>
			</div>
		</div>
	</div>

	{#if toast}
		<div class="toast">
			<div class="toast-icon">
				<svg viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			</div>
			<div class="toast-text">
				<strong>{toast.label}</strong>
				{$t("awaiting_report.toast_extracted")}
			</div>
		</div>
	{/if}

	<div class="quote">{quoteText}</div>

	<div class="stats-section">
		<div class="stats-label">
			<span>{$t("awaiting_report.screenshots_label")}</span>
			<span class="stats-counter">
				{doneCount} / {SLOTS.length}
				<span class="counter-suffix">{$t("awaiting_report.counter_suffix")}</span>
			</span>
		</div>
		<div class="stepper">
			<div class="line"></div>
			<div class="line-fill" style="width: {(fillPercent / 100) * 72}%;"></div>
			{#each SLOTS as slot (slot)}
				{@const state = nodeState(slot)}
				<div class="node">
					<div class="circle {state}">
						{#if state === "done"}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="11" height="11" aria-hidden="true">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{:else}
							{SLOTS.indexOf(slot) + 1}
						{/if}
					</div>
					<div class="label {state}">{$t(`awaiting_report.slots.${slot}.label`)}</div>
					<div class="sub {state}">{subLabel(state)}</div>
				</div>
			{/each}
		</div>
	</div>

	{#if errorMsg}
		<div class="error">{errorMsg}</div>
	{/if}

	{#if !allDone}
		<button type="button" class="primary" onclick={openPicker}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
				<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
				<circle cx="12" cy="13" r="4" />
			</svg>
			<span>{primaryLabel}</span>
		</button>
		<button type="button" class="secondary" onclick={openPicker}>
			{anyUploaded
				? $t("awaiting_report.secondary_reupload")
				: $t("awaiting_report.secondary_gallery")}
		</button>
	{/if}
</div>

<style>
.card {
	position: relative;
	background: radial-gradient(ellipse at top right, rgba(147, 197, 253, 0.08) 0%, transparent 55%),
		#131822;
	border: 1px solid #1F2937;
	border-left: 3px solid #93C5FD;
	border-radius: 18px;
	padding: 16px;
	overflow: hidden;
}
.header {
	display: flex; align-items: center; gap: 12px;
	margin-bottom: 14px;
}
.avatar {
	position: relative;
	width: 44px; height: 44px;
	border-radius: 50%;
	overflow: visible;
	flex-shrink: 0;
	box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.4);
}
.avatar img {
	width: 100%; height: 100%;
	border-radius: 50%;
	object-fit: cover;
}
.avatar.thinking::after {
	content: '';
	position: absolute;
	inset: -4px;
	border-radius: 50%;
	border: 2px solid transparent;
	border-top-color: rgba(147, 197, 253, 0.6);
	animation: thinkingSpin 1.8s linear infinite;
}
@keyframes thinkingSpin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
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
	color: #FBBF24;
	font-weight: 600;
	display: inline-flex; align-items: center; gap: 5px;
}
.role-dot {
	width: 5px; height: 5px;
	border-radius: 50%;
	background: #FBBF24;
	animation: rolePulse 1.5s ease-in-out infinite;
}
@keyframes rolePulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}
.quote {
	font-size: 13px;
	line-height: 1.6;
	color: #D1D5DB;
	background: rgba(147, 197, 253, 0.04);
	border-left: 2px solid rgba(147, 197, 253, 0.25);
	padding: 10px 12px;
	border-radius: 0 8px 8px 0;
	margin-bottom: 14px;
	font-style: italic;
}
.toast {
	background: rgba(132, 204, 22, 0.1);
	border: 1px solid rgba(132, 204, 22, 0.3);
	border-radius: 10px;
	padding: 10px 12px;
	margin-bottom: 14px;
	display: flex; align-items: center; gap: 10px;
	font-size: 11px;
	color: #84CC16;
}
.toast-icon {
	width: 22px; height: 22px;
	border-radius: 50%;
	background: rgba(132, 204, 22, 0.2);
	display: flex; align-items: center; justify-content: center;
	flex-shrink: 0;
}
.toast-text { flex: 1; line-height: 1.3; }
.toast-text strong { color: #FFFFFF; font-weight: 700; }
.stats-section { margin-bottom: 14px; }
.stats-label {
	display: flex; justify-content: space-between;
	align-items: center;
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	font-weight: 700;
	color: #9CA3AF;
	margin-bottom: 10px;
}
.stats-counter {
	color: #93C5FD;
	font-variant-numeric: tabular-nums;
}
.counter-suffix { color: #6B7280; font-weight: 500; }
.stepper {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 0;
	position: relative;
	padding: 0 4px;
}
.line {
	position: absolute;
	top: 14px;
	left: 14%; right: 14%;
	height: 2px;
	background: rgba(255,255,255,0.05);
	z-index: 0;
}
.line-fill {
	position: absolute;
	top: 14px;
	left: 14%;
	height: 2px;
	background: linear-gradient(90deg, #84CC16, #65A30D);
	border-radius: 1px;
	z-index: 1;
	transition: width 0.4s ease;
}
.node {
	display: flex; flex-direction: column;
	align-items: center; gap: 6px;
	position: relative;
	z-index: 2;
}
.circle {
	width: 30px; height: 30px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 11px;
	font-weight: 800;
	border: 2px solid #2A3142;
	background: #1A1F2A;
	color: #6B7280;
	transition: background 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.3s;
}
.circle.done {
	background: linear-gradient(135deg, #84CC16, #65A30D);
	color: white;
	border-color: rgba(132, 204, 22, 0.4);
	box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.12), 0 4px 10px rgba(132, 204, 22, 0.3);
}
.circle.processing {
	position: relative;
	background: rgba(147, 197, 253, 0.15);
	color: #93C5FD;
	border-color: rgba(147, 197, 253, 0.4);
}
.circle.processing::before {
	content: '';
	position: absolute;
	inset: -4px;
	border-radius: 50%;
	border: 2px solid transparent;
	border-top-color: rgba(147, 197, 253, 0.7);
	animation: thinkingSpin 1.2s linear infinite;
}
.circle.active {
	background: rgba(245, 158, 11, 0.18);
	color: #FBBF24;
	border-color: rgba(245, 158, 11, 0.5);
	box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
	animation: activeBreath 2s ease-in-out infinite;
}
@keyframes activeBreath {
	0%, 100% { box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12); }
	50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.05); }
}
.label {
	font-size: 10px;
	font-weight: 700;
	color: #6B7280;
	text-align: center;
}
.label.done { color: #84CC16; }
.label.processing { color: #93C5FD; }
.label.active { color: #FBBF24; }
.sub {
	font-size: 8px;
	color: #4B5563;
	text-align: center;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-weight: 600;
	margin-top: -2px;
}
.sub.done { color: #65A30D; }
.sub.processing { color: #60A5FA; }
.sub.active { color: #D97706; }
.error {
	background: rgba(226, 75, 74, 0.12);
	border: 1px solid rgba(226, 75, 74, 0.3);
	color: #E24B4A;
	font-size: 11px;
	padding: 8px 10px;
	border-radius: 8px;
	margin-bottom: 10px;
}
.primary {
	width: 100%;
	background: linear-gradient(135deg, #93C5FD, #60A5FA);
	color: #0F1419;
	border: 0;
	border-radius: 12px;
	padding: 13px;
	font-size: 13px;
	font-weight: 800;
	cursor: pointer;
	display: flex; align-items: center; justify-content: center;
	gap: 8px;
	box-shadow: 0 4px 14px rgba(147, 197, 253, 0.3);
	margin-bottom: 8px;
	transition: transform 0.15s, opacity 0.15s;
}
.primary:hover:not(:disabled) { transform: translateY(-1px); }
.secondary {
	width: 100%;
	background: none;
	border: 0;
	color: #6B7280;
	font-size: 11px;
	font-weight: 600;
	padding: 8px;
	cursor: pointer;
	display: flex; align-items: center; justify-content: center;
	gap: 5px;
	text-decoration: underline;
	text-underline-offset: 3px;
	text-decoration-color: rgba(107, 114, 128, 0.4);
}
.secondary:hover { color: #D1D5DB; }
</style>
