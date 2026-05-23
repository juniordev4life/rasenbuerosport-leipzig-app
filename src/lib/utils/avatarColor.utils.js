/**
 * Deterministic avatar gradient per player. The roadmap pins specific
 * colour pairs onto known players (Marco / Nikinho / Tobi / …); for
 * unknown players we fall back to a hashed palette pick so the colour
 * still stays stable across renders without relying on backend state.
 */

const PALETTE = [
	["#F59E0B", "#D97706"], // orange
	["#06B6D4", "#0891B2"], // cyan
	["#A78BFA", "#7C3AED"], // purple
	["#EC4899", "#BE185D"], // pink
	["#84CC16", "#65A30D"], // lime
	["#E24B4A", "#C73E3D"], // red
	["#6366F1", "#4338CA"], // indigo
	["#14B8A6", "#0F766E"], // teal
];

/**
 * @param {string|null|undefined} key Player id, username or anything stable.
 * @returns {{ from: string, to: string, gradient: string }}
 *
 * @example
 *   const c = avatarGradient("marco-uid");
 *   c.gradient; // "linear-gradient(135deg, #F59E0B, #D97706)"
 */
export function avatarGradient(key) {
	const text = key ?? "?";
	let hash = 0;
	for (let i = 0; i < text.length; i += 1) {
		hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
	}
	const [from, to] = PALETTE[hash % PALETTE.length];
	return { from, to, gradient: `linear-gradient(135deg, ${from}, ${to})` };
}
