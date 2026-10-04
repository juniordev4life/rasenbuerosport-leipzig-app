<script>
import { getTranslate } from "@tolgee/svelte";
import { onMount } from "svelte";
import CheckIcon from "$lib/components/icons/CheckIcon.svelte";
import PushBellIcon from "$lib/components/icons/PushBellIcon.svelte";
import { get } from "$lib/services/api.services.js";
import {
	getPermissionState,
	isIOSStandalone,
	isPushSupported,
	subscribeForPushNotifications,
	unsubscribeFromPushNotifications,
} from "$lib/services/push.services.js";

/**
 * Settings card for managing push-notification opt-in. The heading comes
 * from the surrounding section (Settings → push.title).
 *
 * Renders three states:
 *  - Browser doesn't support push → small notice, nothing actionable.
 *  - Permission is `default` → "Aktivieren" CTA.
 *  - Permission is `granted` and we have a subscription → green
 *    "Aktiv" indicator + "Deaktivieren" CTA.
 *  - Permission is `denied` → instructions to re-enable in browser
 *    settings (we can't re-prompt programmatically).
 */

const { t } = getTranslate();

let supported = $state(false);
let permission = $state("default");
let pwaInstalled = $state(true);
let activeSubscriptionId = $state(null);
let working = $state(false);
let error = $state("");

async function refresh() {
	supported = isPushSupported();
	if (!supported) return;
	permission = getPermissionState();
	pwaInstalled = isIOSStandalone();
	try {
		const res = await get("/v1/push/subscriptions");
		const list = res.data ?? [];
		activeSubscriptionId = list[0]?.id ?? null;
	} catch {
		activeSubscriptionId = null;
	}
}

onMount(refresh);

async function activate() {
	error = "";
	working = true;
	try {
		const sub = await subscribeForPushNotifications();
		activeSubscriptionId = sub.id;
		permission = getPermissionState();
	} catch (err) {
		const code = err?.message;
		if (code === "permission_denied") error = $t("push.error_denied");
		else if (code === "unsupported") error = $t("push.error_unsupported");
		else error = $t("push.error_generic");
		permission = getPermissionState();
	} finally {
		working = false;
	}
}

async function deactivate() {
	working = true;
	try {
		await unsubscribeFromPushNotifications({ id: activeSubscriptionId });
		activeSubscriptionId = null;
	} finally {
		working = false;
	}
}
</script>

<div class="card push">
	<div class="head">
		<p class="lead">{$t("push.subtitle")}</p>
		{#if activeSubscriptionId && permission === "granted"}
			<span class="chip chip-win state">
				<CheckIcon size={12} strokeWidth={3} />
				{$t("push.state_active")}
			</span>
		{/if}
	</div>

	{#if !supported}
		<p class="note">{$t("push.unsupported")}</p>
	{:else if !pwaInstalled}
		<p class="note">{$t("push.ios_install_hint")}</p>
	{:else if permission === "denied"}
		<p class="note warn">{$t("push.denied_hint")}</p>
	{:else if activeSubscriptionId && permission === "granted"}
		<button
			type="button"
			onclick={deactivate}
			disabled={working}
			class="btn btn-secondary btn-sm action"
		>
			{$t("push.deactivate")}
		</button>
	{:else}
		<button
			type="button"
			onclick={activate}
			disabled={working}
			class="btn btn-primary btn-sm action"
		>
			<PushBellIcon size={18} strokeWidth={2} />
			{$t("push.activate")}
		</button>
	{/if}

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
.push {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 14px;
	padding: 16px;
}

.head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	align-self: stretch;
}

.lead {
	margin: 0;
	font-size: 14px;
	line-height: 1.4;
}

.state {
	flex-shrink: 0;
	padding: 3px 9px;
	font-size: 12px;
}

.note {
	margin: 0;
	padding: 10px 12px;
	border-radius: var(--radius-tile);
	background: var(--color-sunken);
	font-size: 13px;
	line-height: 1.4;
	/* Ink, not muted: muted on the sunken grey of A misses 4.5:1. */
	color: var(--color-ink);
}

/* Blocked in the browser: the user has to act, so it reads stronger. */
.note.warn {
	background: var(--color-loss-soft);
	color: var(--color-loss);
	font-weight: 500;
}

.error {
	margin: 0;
	font-size: 13px;
	font-weight: 500;
	color: var(--color-loss);
}
</style>
