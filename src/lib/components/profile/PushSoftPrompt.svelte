<script>
import { getTranslate } from "@tolgee/svelte";
import { onMount } from "svelte";
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
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4 lg:left-auto lg:right-4 lg:bottom-4 lg:w-[360px]"
		role="dialog"
		aria-modal="false"
		aria-labelledby="push-soft-prompt-title"
	>
		<div class="bg-bg-secondary border border-border rounded-2xl shadow-2xl p-4">
			<div class="flex items-start gap-3">
				<span class="w-10 h-10 rounded-full bg-accent-red/15 text-accent-red flex items-center justify-center text-lg shrink-0" aria-hidden="true">🔔</span>
				<div class="flex-1 min-w-0">
					<h3 id="push-soft-prompt-title" class="text-sm font-bold">
						{$t("push.soft_prompt.title")}
					</h3>
					<p class="text-xs text-text-secondary mt-1">
						{$t("push.soft_prompt.body")}
					</p>
				</div>
				<button
					type="button"
					onclick={defer}
					class="shrink-0 w-7 h-7 rounded-full bg-bg-input text-text-secondary text-sm flex items-center justify-center hover:bg-bg-card"
					aria-label={$t("common.close")}
				>×</button>
			</div>

			<div class="flex gap-2 mt-4">
				<button
					type="button"
					onclick={defer}
					class="flex-1 rounded-lg border border-border bg-bg-input hover:bg-bg-card text-text-secondary text-sm font-semibold px-3 py-2"
				>
					{$t("push.soft_prompt.deny")}
				</button>
				<button
					type="button"
					onclick={accept}
					disabled={working}
					class="flex-1 rounded-lg bg-accent-red hover:bg-accent-red-hover text-white text-sm font-semibold px-3 py-2 shadow-md shadow-accent-red/20 disabled:opacity-50"
				>
					{$t("push.soft_prompt.accept")}
				</button>
			</div>
		</div>
	</div>
{/if}
