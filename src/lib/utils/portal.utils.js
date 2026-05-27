/**
 * Svelte action that teleports a DOM node out of its current parent
 * and appends it to a target element (defaults to `document.body`).
 * Useful for modals, sheets and tooltips that should escape parent
 * stacking contexts (created by `transform`, `filter`, `opacity < 1`,
 * `will-change`, etc.) and parent CSS inheritance (`text-transform`,
 * `font-weight`, …).
 *
 * @param {HTMLElement} node — the element the action is attached to.
 * @param {HTMLElement|string} [target=document.body] — destination
 *   element or CSS selector. Falls back to `document.body` if absent.
 * @returns {{ destroy: () => void }} Svelte action contract.
 * @example
 * // In any Svelte component:
 * // <div use:portal class="modal-overlay">…</div>
 *
 * // Or with an explicit target:
 * // <div use:portal={'#app-root'} class="modal-overlay">…</div>
 */
export function portal(node, target = undefined) {
	const resolve = (t) => {
		if (typeof t === "string") return document.querySelector(t);
		return t ?? document.body;
	};

	let host = resolve(target);
	if (host) host.appendChild(node);

	return {
		update(newTarget) {
			const next = resolve(newTarget);
			if (next && next !== host) {
				next.appendChild(node);
				host = next;
			}
		},
		destroy() {
			if (node.parentNode === host) host?.removeChild(node);
			else node.remove?.();
		},
	};
}
