<script>
import { getTranslate } from "@tolgee/svelte";
import { page } from "$app/state";
import { post } from "$lib/services/api.services.js";
import SegmentedControl from "./SegmentedControl.svelte";
import Sheet from "./Sheet.svelte";

/**
 * Bottom-sheet feedback form with three kinds:
 *   - "general"  → backend forwards as email
 *   - "bug"      → backend opens a GitHub issue with label "bug"
 *   - "feature"  → backend opens a GitHub issue with label "enhancement"
 *
 * All submissions go through `POST /v1/feedback`. The backend owns
 * recipient address, GitHub repo, secrets and rate-limiting — the
 * client only sends `{ kind, title?, description, route? }` and shows
 * the resulting success/error state inline. No mailto, no GitHub login.
 *
 * Rendered in the shared {@link Sheet}.
 *
 * @type {{ onClose: () => void }}
 */
let { onClose } = $props();

const { t } = getTranslate();

/** Active feedback kind. */
let kind = $state("general");
let title = $state("");
let description = $state("");

/**
 * Optional screenshot for bug reports. Stored as a `data:image/...;
 * base64,...` URL so it slots straight into the JSON post body the
 * backend already validates.
 *
 * Hard cap matches the backend's ~5 MB binary ceiling (the schema's
 * `screenshot.maxLength` is the inner gate; we surface the limit to
 * the user up front so they don't waste an upload trip).
 */
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
let screenshotDataUrl = $state(null);
let screenshotName = $state("");
let screenshotError = $state("");
let fileInputEl = $state(null);

/**
 * Submission lifecycle:
 *   - "idle"        → form is editable
 *   - "submitting"  → request in flight, button shows spinner
 *   - "success"     → confirmation shown, auto-close after delay
 *   - "error"       → error message shown, user can edit + retry
 */
let submitState = $state("idle");
let errorMessage = $state("");

/**
 * Read the picked file as a base64 data URL into local state.
 * Validates MIME (image/*) and size (≤5 MB) up front so the user
 * gets immediate feedback instead of a backend rejection later.
 */
function handleFileChange(event) {
	const input = /** @type {HTMLInputElement} */ (event.target);
	const file = input.files?.[0];
	if (!file) return;
	if (!file.type.startsWith("image/")) {
		screenshotError = $t("feedback.screenshot_error_type");
		input.value = "";
		return;
	}
	if (file.size > MAX_SCREENSHOT_BYTES) {
		screenshotError = $t("feedback.screenshot_error_size");
		input.value = "";
		return;
	}
	screenshotError = "";
	const reader = new FileReader();
	reader.onload = () => {
		screenshotDataUrl = String(reader.result ?? "");
		screenshotName = file.name;
	};
	reader.onerror = () => {
		screenshotError = $t("feedback.screenshot_error_read");
	};
	reader.readAsDataURL(file);
}

function removeScreenshot() {
	screenshotDataUrl = null;
	screenshotName = "";
	screenshotError = "";
	if (fileInputEl) fileInputEl.value = "";
}

async function handleSubmit() {
	if (!canSubmit || submitState === "submitting") return;
	submitState = "submitting";
	errorMessage = "";

	try {
		await post("/v1/feedback", {
			kind,
			title: title.trim() || undefined,
			description: description.trim(),
			route: page.url?.pathname ?? undefined,
			// Only bug reports carry a screenshot — the backend ignores
			// the field on the other kinds anyway, but skipping it here
			// keeps the JSON body smaller and the contract obvious.
			screenshot:
				kind === "bug" && screenshotDataUrl ? screenshotDataUrl : undefined,
		});
		submitState = "success";
		setTimeout(() => {
			onClose();
		}, 1800);
	} catch (err) {
		submitState = "error";
		errorMessage = err?.message ?? $t("feedback.error_generic");
	}
}

const titleRequired = $derived(kind !== "general");

const canSubmit = $derived.by(() => {
	if (description.trim() === "") return false;
	if (titleRequired && title.trim() === "") return false;
	return true;
});

const submitLabelKey = $derived.by(() => {
	if (submitState === "submitting") return "feedback.submitting";
	if (kind === "general") return "feedback.submit_general";
	if (kind === "bug") return "feedback.submit_bug";
	return "feedback.submit_feature";
});

const kindOptions = $derived([
	{ value: "general", label: $t("feedback.kind_general") },
	{ value: "bug", label: $t("feedback.kind_bug") },
	{ value: "feature", label: $t("feedback.kind_feature") },
]);

const successMessageKey = $derived(
	kind === "general"
		? "feedback.success_general"
		: kind === "bug"
			? "feedback.success_bug"
			: "feedback.success_feature",
);
</script>

<Sheet title={$t("feedback.title")} {onClose}>
	{#if submitState === "success"}
		<div class="success" role="status" aria-live="polite">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="42"
				height="42"
				aria-hidden="true"
			>
				<path d="M5 13l4 4L19 7" />
			</svg>
			<p class="m-0 text-[15px] font-bold text-ink">{$t(successMessageKey)}</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			<p class="m-0 text-sm leading-relaxed text-muted">{$t("feedback.intro")}</p>

			<SegmentedControl
				options={kindOptions}
				value={kind}
				onChange={(next) => (kind = next)}
				ariaLabel={$t("feedback.title")}
				tone="brand"
			/>

			<label class="flex flex-col gap-1.5">
				<span class="text-sm font-bold">
					{$t("feedback.label_title")}
					{#if titleRequired}<span class="text-brand">*</span>{/if}
				</span>
				<input
					type="text"
					bind:value={title}
					maxlength="120"
					class="field"
					placeholder={$t(
						kind === "bug"
							? "feedback.placeholder_title_bug"
							: kind === "feature"
								? "feedback.placeholder_title_feature"
								: "feedback.placeholder_title_general",
					)}
				/>
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="text-sm font-bold">
					{$t("feedback.label_description")}<span class="text-brand">*</span>
				</span>
				<textarea
					bind:value={description}
					rows="6"
					maxlength="4000"
					class="field textarea"
					placeholder={$t(
						kind === "bug"
							? "feedback.placeholder_body_bug"
							: kind === "feature"
								? "feedback.placeholder_body_feature"
								: "feedback.placeholder_body_general",
					)}
				></textarea>
			</label>

			{#if kind === "bug"}
				<div class="flex flex-col gap-1.5">
					<span class="text-sm font-bold">{$t("feedback.label_screenshot")}</span>

					{#if screenshotDataUrl}
						<div class="tile flex items-center gap-3 p-2">
							<img src={screenshotDataUrl} alt={screenshotName} class="thumb" />
							<span class="flex-1 min-w-0 text-sm truncate">{screenshotName}</span>
							<button type="button" class="btn btn-ghost btn-sm" onclick={removeScreenshot}>
								{$t("feedback.screenshot_remove")}
							</button>
						</div>
					{:else}
						<label class="picker">
							<input
								type="file"
								accept="image/png,image/jpeg,image/webp,image/heic"
								bind:this={fileInputEl}
								onchange={handleFileChange}
								class="sr-only"
							/>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								width="16"
								height="16"
								aria-hidden="true"
							>
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
								<circle cx="8.5" cy="8.5" r="1.5" />
								<polyline points="21 15 16 10 5 21" />
							</svg>
							<span>{$t("feedback.screenshot_add")}</span>
						</label>
					{/if}

					{#if screenshotError}
						<p class="m-0 text-[13px] text-loss" role="alert">{screenshotError}</p>
					{:else}
						<p class="m-0 text-[13px] text-muted">{$t("feedback.screenshot_hint")}</p>
					{/if}
				</div>
			{/if}

			<p class="m-0 text-[13px] text-muted">
				{$t("feedback.route_hint", { route: page.url?.pathname ?? "" })}
			</p>

			{#if submitState === "error" && errorMessage}
				<div class="error" role="alert">
					<span class="font-bold">{$t("feedback.error_title")}</span>
					<span>{errorMessage}</span>
				</div>
			{/if}

			<button
				type="button"
				class="btn btn-primary btn-lg w-full"
				disabled={!canSubmit || submitState === "submitting"}
				onclick={handleSubmit}
			>
				{#if submitState === "submitting"}
					<span class="spinner spinner-sm submitting" aria-hidden="true"></span>
				{/if}
				{$t(submitLabelKey)}
			</button>
		</div>
	{/if}
</Sheet>

<style>
.textarea {
	min-height: 140px;
	padding-block: 10px;
	resize: vertical;
	line-height: 1.45;
}

.thumb {
	width: 56px;
	height: 56px;
	flex-shrink: 0;
	object-fit: cover;
	border-radius: var(--radius-tile);
}

/* The hidden file input stays focusable; show its focus on the label. */
.picker {
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	gap: 8px;
	min-height: 44px;
	padding: 0 16px;
	border: 1px dashed var(--color-muted);
	border-radius: var(--radius-tile);
	color: var(--color-ink);
	font-size: 14px;
	font-weight: 700;
	cursor: pointer;
}

.picker:hover {
	background: var(--color-sunken);
}

.picker:focus-within {
	outline: 2px solid var(--color-navy);
	outline-offset: 2px;
}

.error {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 10px 12px;
	border-radius: var(--radius-tile);
	background: var(--color-loss-soft);
	color: var(--color-loss);
	font-size: 14px;
}

.submitting {
	--spinner-color: currentColor;
}

.success {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px 0 8px;
	text-align: center;
	color: var(--color-win);
}
</style>
