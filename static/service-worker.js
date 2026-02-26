const CACHE_NAME = "rbs-v1";

/** Static assets to pre-cache on install */
const PRECACHE_ASSETS = ["/", "/app/dashboard"];

/** Install: pre-cache app shell */
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_ASSETS))
			.then(() => self.skipWaiting()),
	);
});

/** Activate: clean up old caches */
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

/**
 * Fetch strategy: Network-first with cache fallback.
 * - API requests: always network, never cache
 * - Navigation & assets: try network, fall back to cache
 */
self.addEventListener("fetch", (event) => {
	const { request } = event;

	// Skip non-GET requests
	if (request.method !== "GET") return;

	// Skip API calls and Supabase requests – always go to network
	if (
		request.url.includes("/api/") ||
		request.url.includes("supabase") ||
		request.url.includes("tolgee")
	) {
		return;
	}

	event.respondWith(
		fetch(request)
			.then((response) => {
				// Cache successful responses
				if (response.ok) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
				}
				return response;
			})
			.catch(() => {
				// Network failed – try cache
				return caches.match(request);
			}),
	);
});
