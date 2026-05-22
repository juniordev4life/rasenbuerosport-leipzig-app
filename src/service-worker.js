/// <reference lib="webworker" />

/**
 * Service worker for web-push delivery. SvelteKit picks this file up
 * via the `src/service-worker.js` convention and ships it as
 * `/service-worker.js` at the site root.
 *
 * Two listeners only — keeping the worker as small as possible since
 * we don't (yet) need any offline caching:
 *  - `push`: render the notification with the payload the backend sent
 *  - `notificationclick`: focus an existing window or open the target
 *    URL the payload pointed to
 */

const sw = /** @type {ServiceWorkerGlobalScope & typeof globalThis} */ (
	/** @type {unknown} */ (self)
);

sw.addEventListener("push", (event) => {
	let payload = {};
	try {
		payload = event.data ? event.data.json() : {};
	} catch (_err) {
		payload = { title: "RasenBürosport", body: event.data?.text?.() ?? "" };
	}

	const title = payload.title ?? "RasenBürosport";
	const options = {
		body: payload.body ?? "",
		icon: "/favicon.png",
		badge: "/favicon.png",
		tag: payload.tag,
		data: {
			url: payload.url ?? "/app/dashboard",
			type: payload.type ?? null,
		},
		requireInteraction: false,
	};

	event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const targetUrl = event.notification.data?.url ?? "/app/dashboard";

	event.waitUntil(
		sw.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((windowClients) => {
				// Reuse an open window if one is already showing the app.
				for (const client of windowClients) {
					if ("focus" in client) {
						client.focus();
						if ("navigate" in client) client.navigate(targetUrl);
						return;
					}
				}
				if (sw.clients.openWindow) return sw.clients.openWindow(targetUrl);
				return undefined;
			}),
	);
});
