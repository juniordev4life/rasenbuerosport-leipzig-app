import { supabase } from "$lib/config/supabase.config.js";

const ALLOWED_EMAIL_DOMAIN = "redbulls.com";

/**
 * Registers a new user (restricted to @redbulls.com emails)
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.username
 * @returns {Promise<{user: object, session: object}>}
 */
export async function register({ email, password, username }) {
	const domain = email.split("@")[1]?.toLowerCase();
	if (domain !== ALLOWED_EMAIL_DOMAIN) {
		throw new Error("EMAIL_DOMAIN_NOT_ALLOWED");
	}

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: { username },
		},
	});

	if (error) throw error;
	return data;
}

/**
 * Logs in a user with email and password
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{user: object, session: object}>}
 */
export async function login({ email, password }) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) throw error;
	return data;
}

/**
 * Signs out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}

/**
 * Gets the current session
 * @returns {Promise<object|null>}
 */
export async function getSession() {
	const {
		data: { session },
	} = await supabase.auth.getSession();
	return session;
}
