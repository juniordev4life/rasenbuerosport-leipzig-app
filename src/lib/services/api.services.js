import { PUBLIC_API_URL } from "$env/static/public";
import { supabase } from "$lib/config/supabase.config.js";

/**
 * Makes an authenticated API request to the backend
 * @param {string} endpoint - API endpoint (e.g. '/v1/games')
 * @param {object} [options] - Fetch options
 * @returns {Promise<object>}
 */
export async function apiRequest(endpoint, options = {}) {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const headers = {
		"Content-Type": "application/json",
		...(session?.access_token && {
			Authorization: `Bearer ${session.access_token}`,
		}),
		...options.headers,
	};

	const response = await fetch(`${PUBLIC_API_URL}/api${endpoint}`, {
		...options,
		headers,
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.message || "API request failed");
	}

	return data;
}

/**
 * GET request helper
 * @param {string} endpoint
 * @returns {Promise<object>}
 */
export function get(endpoint) {
	return apiRequest(endpoint, { method: "GET" });
}

/**
 * POST request helper
 * @param {string} endpoint
 * @param {object} body
 * @returns {Promise<object>}
 */
export function post(endpoint, body) {
	return apiRequest(endpoint, {
		method: "POST",
		body: JSON.stringify(body),
	});
}
