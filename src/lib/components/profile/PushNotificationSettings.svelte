<script>
import { getTranslate } from "@tolgee/svelte";
import { onMount } from "svelte";
import { get } from "$lib/services/api.services.js";
import {
	getPermissionState,
	isIOSStandalone,
	isPushSupported,
	subscribeForPushNotifications,
	unsubscribeFromPushNotifications,
} from "$lib/services/push.services.js";

/**
 * Settings tile for managing push-notification opt-in.
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

<div class="rounded-xl bg-bg-input border border-border p-4">
	<div class="flex items-center justify-between gap-3 mb-2">
		<div class="leading-tight">
			<div class="text-sm font-semibold text-text-primary">
				{$t("push.title")}
			</div>
			<div class="text-xs text-text-secondary mt-0.5">
				{$t("push.subtitle")}
			</div>
		</div>
		{#if activeSubscriptionId && permission === "granted"}
			<span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full">
				<span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
				{$t("push.state_active")}
			</span>
		{/if}
	</div>

	{#if !supported}
		<p class="text-xs text-text-muted">{$t("push.unsupported")}</p>
	{:else if !pwaInstalled}
		<p class="text-xs text-text-muted">{$t("push.ios_install_hint")}</p>
	{:else if permission === "denied"}
		<p class="text-xs text-warning">{$t("push.denied_hint")}</p>
	{:else if activeSubscriptionId && permission === "granted"}
		<button
			type="button"
			onclick={deactivate}
			disabled={working}
			class="mt-1 inline-flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
		>
			{$t("push.deactivate")}
		</button>
	{:else}
		<button
			type="button"
			onclick={activate}
			disabled={working}
			class="mt-1 inline-flex items-center gap-2 rounded-lg bg-accent-red hover:bg-accent-red-hover text-white text-xs font-semibold px-3 py-2 shadow-md shadow-accent-red/20 disabled:opacity-50 transition-colors"
		>
			🔔 {$t("push.activate")}
		</button>
	{/if}

	{#if error}
		<p class="mt-2 text-[11px] text-error">{error}</p>
	{/if}
</div>
