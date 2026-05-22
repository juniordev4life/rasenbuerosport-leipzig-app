/**
 * Browser-side push-notification helpers. Wraps the Service-Worker /
 * Push API into a small surface the rest of the app can call without
 * touching `navigator.serviceWorker` directly.
 *
 * Flow:
 *   1. `isPushSupported()` gates the UI ("hide the prompt entirely
 *       on browsers without web push")
 *   2. `getPermissionState()` returns 'default'|'granted'|'denied'
 *       so the soft prompt can render contextually
 *   3. `subscribeForPushNotifications()` does the full handshake:
 *       request browser permission → subscribe via the SW → POST the
 *       endpoint + keys to the backend
 *   4. `unsubscribeFromPushNotifications()` reverses step 3
 *   5. `isIOSStandalone()` flags the iOS PWA-or-bust constraint
 */

import { PUBLIC_VAPID_KEY } from "$env/static/public";
import { del, post } from "./api.services.js";

/** True iff the browser exposes the APIs we need. */
export function isPushSupported() {
	if (typeof window === "undefined") return false;
	return (
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window
	);
}

/** "default" | "granted" | "denied" — safe across SSR. */
export function getPermissionState() {
	if (typeof Notification === "undefined") return "default";
	return Notification.permission;
}

/**
 * iOS Safari only delivers web-push notifications when the app has
 * been added to the home screen (PWA / standalone display-mode).
 * Returns true on non-iOS browsers as well so callers can treat
 * "true" as "ready to subscribe".
 */
export function isIOSStandalone() {
	if (typeof window === "undefined") return true;
	const ua = navigator.userAgent;
	const isIOS = /iPhone|iPad|iPod/.test(ua);
	if (!isIOS) return true;
	return (
		window.matchMedia?.("(display-mode: standalone)").matches ||
		// Legacy iOS hint, still set in current versions.
		// biome-ignore lint/suspicious/noExplicitAny: legacy navigator field
		/** @type {any} */ (window.navigator).standalone === true
	);
}

/**
 * Register the SvelteKit-built service worker and wait until it's
 * ready. Returns the registration so callers can subscribe further.
 */
async function ensureServiceWorker() {
	if (!("serviceWorker" in navigator)) throw new Error("no_service_worker");
	let reg = await navigator.serviceWorker.getRegistration("/");
	if (!reg) {
		reg = await navigator.serviceWorker.register("/service-worker.js", {
			type: "module",
			updateViaCache: "none",
		});
	}
	await navigator.serviceWorker.ready;
	return reg;
}

/** Decode the URL-safe base64 VAPID public key into the Uint8Array the Push API expects. */
function urlBase64ToUint8Array(base64String) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
	return out;
}

function arrayBufferToBase64(buffer) {
	if (!buffer) return "";
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i += 1) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Request browser permission and register a subscription. Resolves
 * with `{ id, endpoint }` on success or throws with a stable error
 * code ('permission_denied' | 'unsupported' | 'no_vapid_key' | …) so
 * the UI can map to localised copy.
 *
 * @returns {Promise<{ id: string, endpoint: string }>}
 * @example
 *   const sub = await subscribeForPushNotifications();
 *   console.log("Subscribed", sub.endpoint);
 */
export async function subscribeForPushNotifications() {
	if (!isPushSupported()) throw new Error("unsupported");
	if (!PUBLIC_VAPID_KEY) throw new Error("no_vapid_key");

	const permission = await Notification.requestPermission();
	if (permission !== "granted") throw new Error("permission_denied");

	const reg = await ensureServiceWorker();
	let subscription = await reg.pushManager.getSubscription();
	if (!subscription) {
		subscription = await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
		});
	}

	const payload = {
		endpoint: subscription.endpoint,
		keys: {
			p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
			auth: arrayBufferToBase64(subscription.getKey("auth")),
		},
		userAgent: navigator.userAgent,
	};
	const res = await post("/v1/push/subscribe", payload);
	return { id: res.data?.id, endpoint: subscription.endpoint };
}

/**
 * Drop the local subscription and tell the backend to forget it too.
 * Best-effort: a failure on either side does not throw, just logs.
 */
export async function unsubscribeFromPushNotifications({ id } = {}) {
	if (!("serviceWorker" in navigator)) return;
	const reg = await navigator.serviceWorker.getRegistration("/");
	const subscription = await reg?.pushManager.getSubscription();
	if (subscription) {
		try {
			await subscription.unsubscribe();
		} catch (err) {
			console.warn("subscription.unsubscribe failed", err);
		}
	}
	if (id) {
		try {
			await del(`/v1/push/${id}`);
		} catch (err) {
			console.warn("DELETE /v1/push/:id failed", err);
		}
	}
}
