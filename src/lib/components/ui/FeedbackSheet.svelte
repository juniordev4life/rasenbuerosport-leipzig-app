<script>
import { getTranslate } from "@tolgee/svelte";
import { cubicOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import { page } from "$app/state";
import { post } from "$lib/services/api.services.js";
import { portal } from "$lib/utils/portal.utils.js";

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
 * Same portal + slide-up pattern as InfoSheet so the overlay escapes
 * section stacking contexts and the BottomNav.
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
 * Submission lifecycle:
 *   - "idle"        → form is editable
 *   - "submitting"  → request in flight, button shows spinner
 *   - "success"     → confirmation shown, auto-close after delay
 *   - "error"       → error message shown, user can edit + retry
 */
let submitState = $state("idle");
let errorMessage = $state("");

function handleKeydown(event) {
	if (event.key === "Escape") onClose();
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

const successMessageKey = $derived(
	kind === "general"
		? "feedback.success_general"
		: kind === "bug"
			? "feedback.success_bug"
			: "feedback.success_feature",
);
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	use:portal
	in:fade={{ duration: 150 }}
	out:fade={{ duration: 150 }}
	class="feedback-overlay fixed inset-0 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="feedback-title"
	onclick={onClose}
>
	<div
		in:fly={{ y: 280, duration: 260, easing: cubicOut }}
		out:fly={{ y: 280, duration: 200, easing: cubicOut }}
		class="feedback-sheet w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="feedback-handle" aria-hidden="true"></div>

		<div class="feedback-header">
			<h3 id="feedback-title" class="feedback-title">
				{$t("feedback.title")}
			</h3>
			<button
				type="button"
				onclick={onClose}
				class="feedback-close"
				aria-label={$t("feedback.close")}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					width="20"
					height="20"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		{#if submitState === "success"}
			<div class="feedback-success" role="status" aria-live="polite">
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
				<p class="feedback-success-text">
					{$t(successMessageKey)}
				</p>
			</div>
		{:else}
			<p class="feedback-intro">
				{$t("feedback.intro")}
			</p>

			<div class="feedback-tabs" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={kind === "general"}
					class="feedback-tab"
					class:active={kind === "general"}
					onclick={() => (kind = "general")}
				>
					{$t("feedback.kind_general")}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={kind === "bug"}
					class="feedback-tab"
					class:active={kind === "bug"}
					onclick={() => (kind = "bug")}
				>
					{$t("feedback.kind_bug")}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={kind === "feature"}
					class="feedback-tab"
					class:active={kind === "feature"}
					onclick={() => (kind = "feature")}
				>
					{$t("feedback.kind_feature")}
				</button>
			</div>

			<label class="feedback-field">
				<span class="feedback-label">
					{$t("feedback.label_title")}
					{#if titleRequired}<span class="required">*</span>{/if}
				</span>
				<input
					type="text"
					bind:value={title}
					maxlength="120"
					class="feedback-input"
					placeholder={$t(
						kind === "bug"
							? "feedback.placeholder_title_bug"
							: kind === "feature"
								? "feedback.placeholder_title_feature"
								: "feedback.placeholder_title_general",
					)}
				/>
			</label>

			<label class="feedback-field">
				<span class="feedback-label">
					{$t("feedback.label_description")}<span class="required">*</span>
				</span>
				<textarea
					bind:value={description}
					rows="6"
					maxlength="4000"
					class="feedback-textarea"
					placeholder={$t(
						kind === "bug"
							? "feedback.placeholder_body_bug"
							: kind === "feature"
								? "feedback.placeholder_body_feature"
								: "feedback.placeholder_body_general",
					)}
				></textarea>
			</label>

			<p class="feedback-route-hint">
				{$t("feedback.route_hint", {
					route: page.url?.pathname ?? "",
				})}
			</p>

			{#if submitState === "error" && errorMessage}
				<div class="feedback-error" role="alert">
					<span class="feedback-error-title">
						{$t("feedback.error_title")}
					</span>
					<span class="feedback-error-body">{errorMessage}</span>
				</div>
			{/if}

			<button
				type="button"
				class="feedback-submit"
				disabled={!canSubmit || submitState === "submitting"}
				onclick={handleSubmit}
			>
				{#if submitState === "submitting"}
					<span class="feedback-spinner" aria-hidden="true"></span>
				{/if}
				{$t(submitLabelKey)}
			</button>
		{/if}
	</div>
</div>

<style>
.feedback-overlay {
	z-index: 100;
}

.feedback-sheet {
	background: #131822;
	border: 1px solid #1f2937;
	border-radius: 22px 22px 0 0;
	padding: 8px 22px 22px;
	box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.55);
	text-transform: none;
	letter-spacing: normal;
	font-weight: 400;
	font-style: normal;
	padding-bottom: max(env(safe-area-inset-bottom, 0px), 22px);
}
@media (min-width: 640px) {
	.feedback-sheet {
		border-radius: 18px;
		padding: 22px 22px 22px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
	}
}

.feedback-handle {
	display: block;
	width: 36px;
	height: 4px;
	border-radius: 2px;
	background: rgba(255, 255, 255, 0.18);
	margin: 6px auto 14px;
}
@media (min-width: 640px) {
	.feedback-handle {
		display: none;
	}
}

.feedback-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 6px;
}
.feedback-title {
	font-size: 20px;
	font-weight: 800;
	letter-spacing: -0.01em;
	color: #f0f2f5;
	margin: 0;
}
.feedback-close {
	flex-shrink: 0;
	background: none;
	border: none;
	color: #6b7280;
	padding: 4px;
	margin: -4px;
	cursor: pointer;
	border-radius: 8px;
	transition: color 0.15s, background-color 0.15s;
}
.feedback-close:hover {
	color: #f0f2f5;
	background: rgba(255, 255, 255, 0.05);
}
.feedback-intro {
	font-size: 12.5px;
	line-height: 1.5;
	color: #9ca3af;
	margin: 0 0 14px;
}

.feedback-tabs {
	display: flex;
	gap: 6px;
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid #1f2937;
	border-radius: 10px;
	padding: 4px;
	margin-bottom: 16px;
}
.feedback-tab {
	flex: 1;
	background: none;
	border: 0;
	padding: 8px 10px;
	border-radius: 7px;
	font-size: 12px;
	font-weight: 700;
	color: #9ca3af;
	cursor: pointer;
	transition: background-color 0.15s, color 0.15s;
}
.feedback-tab:hover { color: #e5e7eb; }
.feedback-tab.active {
	background: linear-gradient(135deg, #e24b4a, #c73e3d);
	color: white;
	box-shadow: 0 2px 8px rgba(226, 75, 74, 0.3);
}

.feedback-field {
	display: block;
	margin-bottom: 12px;
}
.feedback-label {
	display: block;
	font-size: 11px;
	font-weight: 700;
	color: #9ca3af;
	margin-bottom: 6px;
}
.required {
	color: #e24b4a;
	margin-left: 2px;
}
.feedback-input,
.feedback-textarea {
	width: 100%;
	background: #1a1f2a;
	border: 1px solid #2a3142;
	border-radius: 10px;
	padding: 10px 12px;
	font-size: 13px;
	color: #f0f2f5;
	font-family: inherit;
}
.feedback-input:focus,
.feedback-textarea:focus {
	outline: none;
	border-color: rgba(226, 75, 74, 0.6);
	box-shadow: 0 0 0 3px rgba(226, 75, 74, 0.12);
}
.feedback-textarea {
	resize: vertical;
	line-height: 1.5;
}

.feedback-route-hint {
	font-size: 10px;
	color: #6b7280;
	margin: 0 0 14px;
}

.feedback-error {
	background: rgba(226, 75, 74, 0.08);
	border: 1px solid rgba(226, 75, 74, 0.4);
	border-radius: 10px;
	padding: 10px 12px;
	margin-bottom: 12px;
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.feedback-error-title {
	font-size: 11px;
	font-weight: 800;
	color: #fca5a5;
}
.feedback-error-body {
	font-size: 12px;
	color: #fda4af;
	line-height: 1.4;
	overflow-wrap: anywhere;
}

.feedback-submit {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 100%;
	background: linear-gradient(135deg, #e24b4a, #c73e3d);
	color: white;
	border: 0;
	border-radius: 12px;
	padding: 13px;
	font-size: 14px;
	font-weight: 800;
	cursor: pointer;
	box-shadow: 0 6px 18px rgba(226, 75, 74, 0.4);
	transition: transform 0.15s, opacity 0.15s;
}
.feedback-submit:not(:disabled):hover {
	transform: translateY(-1px);
}
.feedback-submit:disabled {
	opacity: 0.4;
	cursor: not-allowed;
	box-shadow: none;
}

.feedback-spinner {
	width: 14px;
	height: 14px;
	border: 2px solid rgba(255, 255, 255, 0.5);
	border-top-color: white;
	border-radius: 50%;
	animation: feedback-spin 0.8s linear infinite;
}

@keyframes feedback-spin {
	to {
		transform: rotate(360deg);
	}
}

.feedback-success {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px 8px 12px;
	color: #34d399;
}
.feedback-success-text {
	font-size: 14px;
	font-weight: 700;
	color: #f0f2f5;
	text-align: center;
	margin: 0;
	line-height: 1.4;
}
</style>
