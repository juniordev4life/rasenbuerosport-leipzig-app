<script>
import { getTranslate } from "@tolgee/svelte";
import { onMount } from "svelte";
import PushBellIcon from "$lib/components/icons/PushBellIcon.svelte";
import {
	getPermissionState,
	isIOSStandalone,
	isPushSupported,
	subscribeForPushNotifications,
} from "$lib/services/push.services.js";

/**
 * Soft-prompt bottom-sheet that asks the user whether they want push
 * notifications BEFORE we trigger the (one-shot) browser permission
 * dialog. Improves accept-rate and lets us re-ask later if the user
 * defers — once the browser's `Notification.permission` is `denied`
 * we can never re-prompt programmatically.
 *
 * Trigger rules (kept simple):
 *  - the browser actually supports push (no point on iOS Safari tab)
 *  - permission is still `default`
 *  - on iOS the app is added to the home screen
 *  - the user has opened the app at least twice
 *  - we haven't asked in the last 14 days
 *  - no existing dismiss flag for this version
 *
 * Three actions:
 *  - "Ja, gerne"   → kicks off `subscribeForPushNotifications`
 *  - "Nein, danke" → 14 d cooldown
 *  - X (close)     → same cooldown
 *
 * Non-modal: a floating card that leaves the page usable. On phones it
 * sits above the bottom navigation (and its raised ball button); from
 * `lg` it docks to the bottom-right corner.
 */

const { t } = getTranslate();

const STORAGE_COUNT = "rbl.appOpenCount";
const STORAGE_DEFERRED_UNTIL = "rbl.pushPromptDeferredUntil";
const COOLDOWN_DAYS = 14;

let visible = $state(false);
let working = $state(false);

function readNumber(key) {
	if (typeof localStorage === "undefined") return 0;
	const raw = localStorage.getItem(key);
	if (!raw) return 0;
	const n = Number.parseInt(raw, 10);
	return Number.isFinite(n) ? n : 0;
}

function defer() {
	const until = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
	localStorage.setItem(STORAGE_DEFERRED_UNTIL, String(until));
	visible = false;
}

function shouldShow() {
	if (!isPushSupported()) return false;
	if (getPermissionState() !== "default") return false;
	if (!isIOSStandalone()) return false;
	const opens = readNumber(STORAGE_COUNT);
	if (opens < 2) return false;
	const deferredUntil = readNumber(STORAGE_DEFERRED_UNTIL);
	if (deferredUntil && Date.now() < deferredUntil) return false;
	return true;
}

onMount(() => {
	if (typeof localStorage === "undefined") return;
	const next = readNumber(STORAGE_COUNT) + 1;
	localStorage.setItem(STORAGE_COUNT, String(next));
	visible = shouldShow();
});

async function accept() {
	working = true;
	try {
		await subscribeForPushNotifications();
		visible = false;
	} catch {
		// User denied in the browser dialog or some other failure —
		// either way, stop nagging for the cooldown window.
		defer();
	} finally {
		working = false;
	}
}
</script>

{#if visible}
	<div
		class="card soft-prompt"
		role="dialog"
		aria-modal="false"
		aria-labelledby="push-soft-prompt-title"
	>
		<div class="head">
			<span class="icon" aria-hidden="true"><PushBellIcon size={22} strokeWidth={2} /></span>
			<div class="flex-1 min-w-0">
				<h2 id="push-soft-prompt-title" class="title">
					{$t("push.soft_prompt.title")}
				</h2>
				<p class="body">{$t("push.soft_prompt.body")}</p>
			</div>
			<button
				type="button"
				onclick={defer}
				class="btn btn-ghost btn-icon close"
				aria-label={$t("common.close")}
			>
				<svg
					viewBox="0 0 24 24"
					width="18"
					height="18"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<div class="actions">
			<button type="button" onclick={defer} class="btn btn-secondary btn-sm">
				{$t("push.soft_prompt.deny")}
			</button>
			<button
				type="button"
				onclick={accept}
				disabled={working}
				class="btn btn-primary btn-sm"
			>
				{$t("push.soft_prompt.accept")}
			</button>
		</div>
	</div>
{/if}

<style>
.soft-prompt {
	position: fixed;
	left: 12px;
	right: 12px;
	/* Clear the bottom nav and the ball button that rises above it. */
	bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
	z-index: 40;
	max-width: 30rem;
	margin-inline: auto;
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
	box-shadow: var(--shadow-raised);
}

.head {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}

.icon {
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius-tile);
	background: var(--color-brand);
	color: var(--color-on-brand);
}

.title {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 17px;
	line-height: 1.15;
	text-transform: var(--label-case);
	letter-spacing: var(--label-tracking);
}

.body {
	margin: 4px 0 0;
	font-size: 13px;
	line-height: 1.4;
	color: var(--color-muted);
}

.close {
	flex-shrink: 0;
	width: 36px;
	height: 36px;
	margin: -6px -8px 0 0;
}

.actions {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

:global([data-variant="b"]) .icon {
	border-radius: 999px;
}

:global([data-variant="b"]) .title {
	font-weight: 800;
	font-size: 19px;
}

@media (min-width: 1024px) {
	.soft-prompt {
		left: auto;
		right: 24px;
		bottom: 24px;
		width: 360px;
		margin: 0;
	}
}
</style>
