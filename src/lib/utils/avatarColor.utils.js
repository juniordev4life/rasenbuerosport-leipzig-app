/**
 * Initials avatars: which colour slot and which letters a player gets.
 * The colours themselves are tokens (`--color-avatar-0` … `-5` in
 * app.css): navy for every slot in design A, six distinct colours in B.
 */

const AVATAR_COLOR_SLOTS = 6;

/**
 * Stable 32-bit hash of a string (same input, same number).
 *
 * @param {string} text
 * @returns {number}
 */
function hashText(text) {
	let hash = 0;
	for (let i = 0; i < text.length; i += 1) {
		hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
	}
	return hash;
}

/**
 * The avatar colour class of a player: one of `avatar-c0` … `avatar-c5`
 * from app.css. Stable per key, so a player keeps their colour.
 *
 * @param {string|null|undefined} key Player id, username or anything stable.
 * @returns {string}
 * @example
 *   avatarColorClass("marco-uid"); // "avatar-c3"
 */
export function avatarColorClass(key) {
	return `avatar-c${hashText(key ?? "?") % AVATAR_COLOR_SLOTS}`;
}

/**
 * Letters shown when a player has no picture: names of up to two
 * characters in full ("FS", "AH"), otherwise the first letter.
 *
 * @param {string|null|undefined} name
 * @returns {string}
 * @example
 *   avatarInitials("FS"); // "FS"
 *   avatarInitials("Nikinho"); // "N"
 *   avatarInitials(""); // "?"
 */
export function avatarInitials(name) {
	const text = (name ?? "").trim();
	if (!text) return "?";
	if (text.length <= 2) return text.toUpperCase();
	return text.charAt(0).toUpperCase();
}

/**
 * Transitional: the old gradient API, now backed by the avatar tokens so
 * callers render in the active design. Use <PlayerAvatar> instead; this
 * goes once the last caller has moved.
 *
 * @deprecated
 * @param {string|null|undefined} key
 * @returns {{ from: string, to: string, gradient: string }}
 * @example
 *   avatarGradient("marco-uid").gradient; // "var(--color-avatar-3)"
 */
export function avatarGradient(key) {
	const color = `var(--color-avatar-${hashText(key ?? "?") % AVATAR_COLOR_SLOTS})`;
	return { from: color, to: color, gradient: color };
}
