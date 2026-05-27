/**
 * Per-feature onboarding flags + intro.js tour driver.
 *
 * The {@link runOnboardingTour} helper centralises every wizard tour
 * in the app: the call site only specifies *which* tour to run and
 * the helper resolves copy through the Tolgee singleton — element
 * selectors, titles and tip bodies live in the tour table below.
 */

import { tolgee } from "$lib/config/i18n.config.js";

const STORAGE_PREFIX = "rbl:onboarding:";

/**
 * Canonical keys for every onboarding flow in the app. Centralised
 * here so the storage namespace stays consistent and we don't grow
 * orphan keys via typos in call sites.
 */
export const ONBOARDING_KEYS = Object.freeze({
	NEW_GAME_LOBBY: "new-game-lobby:v1",
	NEW_GAME_POSTER: "new-game-poster:v1",
	NEW_GAME_LIVE: "new-game-live:v1",
	DASHBOARD: "dashboard:v1",
	PROFILE: "profile:v1",
});

function storageKey(key) {
	return `${STORAGE_PREFIX}${key}`;
}

/**
 * Whether the user has already dismissed the onboarding for `key`.
 * Returns `false` when `localStorage` is unavailable (SSR, private
 * mode) so the onboarding still fires — better to over-show than to
 * silently swallow it.
 *
 * @param {string} key — one of {@link ONBOARDING_KEYS}.
 * @returns {boolean}
 * @example
 * if (!isOnboardingDone(ONBOARDING_KEYS.NEW_GAME_LIVE)) {
 *   runOnboardingTour(ONBOARDING_KEYS.NEW_GAME_LIVE, t);
 * }
 */
export function isOnboardingDone(key) {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(storageKey(key)) === "1";
	} catch {
		return false;
	}
}

/**
 * Persist that the user has dismissed the onboarding for `key`.
 * Silently no-ops when `localStorage` is unavailable so the caller
 * never has to think about it.
 *
 * @param {string} key — one of {@link ONBOARDING_KEYS}.
 * @returns {void}
 * @example
 * markOnboardingDone(ONBOARDING_KEYS.NEW_GAME_LIVE);
 */
export function markOnboardingDone(key) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(storageKey(key), "1");
	} catch {
		// Storage quota or privacy mode — onboarding will reappear next
		// time. That's acceptable for a one-off welcome card.
	}
}

/**
 * Reset every onboarding flag — primarily for QA / dev tooling. Not
 * wired into any UI by default.
 *
 * @returns {void}
 */
export function resetAllOnboardings() {
	if (typeof window === "undefined") return;
	try {
		for (const value of Object.values(ONBOARDING_KEYS)) {
			window.localStorage.removeItem(storageKey(value));
		}
	} catch {
		// Ignore — see note in markOnboardingDone.
	}
}

/**
 * Tour definitions per onboarding key. Each tip points at a DOM
 * element via its `data-onboarding` attribute (added in the wizard
 * step components) and pulls its copy from Tolgee under
 * `new_game.onboarding.<step>.tip_<n>_(title|body)`.
 *
 * Keeping selectors here (instead of inside the steps) lets us
 * change the visual structure of a step without touching the tour
 * logic — only the attribute names are load-bearing.
 */
const TOUR_DEFINITIONS = {
	[ONBOARDING_KEYS.NEW_GAME_LOBBY]: {
		nsKey: "lobby",
		steps: [
			{
				selector: '[data-onboarding="lobby-home"]',
				tip: 1,
				position: "bottom",
			},
			{ selector: '[data-onboarding="lobby-away"]', tip: 2, position: "top" },
			// `position` deliberately omitted — the guest tile lives at the
			// right edge of the pitch on mobile and a forced "bottom" makes
			// intro.js push the tooltip off-screen. Letting it auto-pick
			// keeps the tooltip inside the viewport on every layout.
			{ selector: '[data-onboarding="lobby-guest"]', tip: 3 },
		],
	},
	[ONBOARDING_KEYS.NEW_GAME_POSTER]: {
		nsKey: "poster",
		steps: [
			{
				selector: '[data-onboarding="poster-teams"]',
				tip: 1,
				position: "bottom",
			},
			{
				selector: '[data-onboarding="poster-actions"]',
				tip: 2,
				position: "top",
			},
			{
				selector: '[data-onboarding="poster-anpfiff"]',
				tip: 3,
				position: "top",
			},
		],
	},
	[ONBOARDING_KEYS.NEW_GAME_LIVE]: {
		nsKey: "live",
		// `demoAction` is dispatched through `window.__rblLiveDemo` (set up
		// by LiveMatchStep) right after the matching step is shown — so
		// the editor opens, the goal-type pill flips, the minute slider
		// scrolls, the stoppage slider unlocks, the event pill pops up,
		// all while the tooltip is read. The terminal `reset` in
		// oncomplete/onexit wipes the demo events so nothing leaks into
		// the real saveGame payload.
		//
		// The demo lands on minute 45+3 so we can demonstrate the
		// stoppage-time slider — it only unlocks at the half-time / full-
		// time / extra-time boundaries.
		steps: [
			// Step 1 — orient the user to the line-up + screen layout
			// before anything starts moving. No demo action.
			{
				selector: '[data-onboarding="live-pitch"]',
				tip: 1,
				position: "bottom",
			},
			// Step 2 — pick the scorer; opens the editor in the opposite half.
			{
				selector: '[data-onboarding="live-pitch"]',
				tip: 2,
				position: "bottom",
				demoAction: "select-scorer",
			},
			// Step 3 — highlight the goal-type pill so the user notices
			// it's tappable. No demo action: the type stays on "Spiel"
			// because an own-goal-via-penalty + assist combo would be
			// nonsensical for the demo. The anchor sits inside the
			// editor (visible only after `select-scorer`), so the
			// late-binding lookup in runOnboardingTour resolves it.
			{
				selector: '[data-onboarding="live-goaltype-pill"]',
				tip: 3,
				position: "bottom",
			},
			// Step 4 — assist is picked by tapping a teammate from the
			// same side, before the minute is set.
			{
				selector: '[data-onboarding="live-pitch"]',
				tip: 4,
				position: "bottom",
				demoAction: "select-assister",
			},
			// Step 5 — minute slider lands on 45 (half-time boundary).
			{
				selector: '[data-onboarding="live-pitch"]',
				tip: 5,
				position: "bottom",
				demoAction: "set-minute",
			},
			// Step 6 — stoppage row is now unlocked; we set it to +3.
			{
				selector: '[data-onboarding="live-pitch"]',
				tip: 6,
				position: "bottom",
				demoAction: "set-stoppage",
			},
			// Step 7 — confirm closes the editor and pushes the event
			// into the pill strip.
			{
				selector: '[data-onboarding="live-pitch"]',
				tip: 7,
				position: "bottom",
				demoAction: "confirm",
			},
			{
				selector: '[data-onboarding="live-event-pill"]',
				tip: 8,
				position: "top",
			},
			{ selector: '[data-onboarding="live-footer"]', tip: 9, position: "top" },
			// Final tip has no anchor element — intro.js shows it floating
			// (centred) when `element` is omitted.
			{ selector: null, tip: 10 },
		],
		resetActionOnExit: "reset",
	},
	[ONBOARDING_KEYS.DASHBOARD]: {
		nsKey: "dashboard",
		steps: [
			{
				selector: '[data-onboarding="dashboard-week"]',
				tip: 1,
				position: "bottom",
			},
			{
				selector: '[data-onboarding="dashboard-quickstats"]',
				tip: 2,
				position: "top",
			},
			{
				selector: '[data-onboarding="dashboard-recent"]',
				tip: 3,
				position: "top",
			},
			{
				selector: '[data-onboarding="dashboard-top3"]',
				tip: 4,
				position: "top",
			},
			// Final tip is floating — orientation to the bottom-nav, no
			// specific anchor needed.
			{ selector: null, tip: 5 },
		],
	},
	[ONBOARDING_KEYS.PROFILE]: {
		nsKey: "profile",
		steps: [
			{
				selector: '[data-onboarding="profile-hero"]',
				tip: 1,
				position: "bottom",
			},
			{
				selector: '[data-onboarding="profile-spider"]',
				tip: 2,
				position: "top",
			},
			{
				selector: '[data-onboarding="profile-form"]',
				tip: 3,
				position: "top",
			},
			{
				selector: '[data-onboarding="profile-relations"]',
				tip: 4,
				position: "top",
			},
			{
				selector: '[data-onboarding="profile-awards"]',
				tip: 5,
				position: "top",
			},
		],
	},
};

/**
 * Resolve a tour definition into the intro.js `steps` array plus the
 * parallel demo-action list.
 *
 * Every selectored step keeps its selector around as `_deferredSelector`
 * so we can re-query the anchor each time the tour reaches that step
 * (DOM may have mutated since tour start — e.g. the event pill only
 * appears after the `confirm` demo action fires). intro.js copies the
 * initial steps into an internal `_introItems` list at start time and
 * reads element references from there at render time, so the lookup
 * must update both structures — see {@link runOnboardingTour}.
 *
 * @param {{
 *   nsKey: string,
 *   steps: Array<{ selector: string|null, tip: number, position?: string, demoAction?: string }>,
 * }} def
 * @returns {{
 *   steps: Array<{ element?: Element, title: string, intro: string, position?: string, _deferredSelector?: string }>,
 *   actions: Array<string|null>,
 * }}
 */
function buildIntroSteps(def) {
	const ns = `new_game.onboarding.${def.nsKey}`;
	const steps = [];
	const actions = [];
	for (const step of def.steps) {
		const element = step.selector
			? document.querySelector(step.selector)
			: null;
		steps.push({
			...(element ? { element } : {}),
			title: tolgee.t(`${ns}.tip_${step.tip}_title`),
			intro: tolgee.t(`${ns}.tip_${step.tip}_body`),
			...(step.position ? { position: step.position } : {}),
			...(step.selector ? { _deferredSelector: step.selector } : {}),
		});
		actions.push(step.demoAction ?? null);
	}
	return { steps, actions };
}

/**
 * Run the intro.js tour for the given onboarding key. The CSS and
 * the library itself are imported lazily so first-time-only tours
 * don't grow the main bundle. On completion (or any kind of exit)
 * we mark the key as done so the tour doesn't fire again on this
 * device.
 *
 * Translations resolve through the Tolgee singleton — the caller
 * doesn't need to pass anything. Gate the call with
 * {@link isOnboardingDone} so we don't import intro.js on every
 * wizard mount.
 *
 * @param {string} key — one of {@link ONBOARDING_KEYS}.
 * @returns {Promise<void>}
 * @example
 * if (!isOnboardingDone(ONBOARDING_KEYS.NEW_GAME_LIVE)) {
 *   await runOnboardingTour(ONBOARDING_KEYS.NEW_GAME_LIVE);
 * }
 */
export async function runOnboardingTour(key) {
	if (typeof window === "undefined") return;
	const def = TOUR_DEFINITIONS[key];
	if (!def) return;

	const [{ default: introJs }] = await Promise.all([
		import("intro.js"),
		import("intro.js/introjs.css"),
	]);

	const { steps, actions } = buildIntroSteps(def);
	if (steps.length === 0) {
		// Nothing to anchor to — treat as done so we don't spin forever.
		markOnboardingDone(key);
		return;
	}

	const tour = introJs.tour();
	tour.setOptions({
		steps,
		showProgress: true,
		showBullets: false,
		exitOnOverlayClick: false,
		exitOnEsc: true,
		scrollToElement: true,
		scrollPadding: 80,
		tooltipClass: "rbl-introjs",
		nextLabel: tolgee.t("new_game.onboarding.cta_next"),
		prevLabel: tolgee.t("new_game.onboarding.back"),
		doneLabel: tolgee.t("new_game.onboarding.cta_done"),
	});

	/**
	 * Re-resolve the step's anchor element by selector and write the
	 * resolved DOM node into both intro.js step lists. v8 keeps the
	 * runtime snapshot in `_steps` (older code paths reference
	 * `_introItems`) and reads element references from there at render
	 * time, so only patching the options is not enough — both targets
	 * get the new reference.
	 *
	 * @param {object} self — the intro.js tour instance (`this` inside hooks).
	 * @param {number} index — step index to refresh.
	 */
	function resolveDeferred(self, index) {
		const stepCfg = self._options?.steps?.[index];
		if (!stepCfg?._deferredSelector) return false;
		const el = document.querySelector(stepCfg._deferredSelector);
		if (!el) return false;
		stepCfg.element = el;
		// intro.js v8 uses `_steps`; older paths used `_introItems`.
		// Patch whichever exists.
		const liveSteps = self._steps ?? self._introItems;
		if (Array.isArray(liveSteps) && liveSteps[index]) {
			liveSteps[index].element = el;
		}
		return true;
	}

	// Step-change flow:
	//   1. `onafterchange` of step N runs N's demo action (e.g.
	//      `select-scorer`), which mutates the DOM and may bring step
	//      N+1's anchor into existence (e.g. the goal-type pill inside
	//      the editor that just opened).
	//   2. Same handler then pre-resolves step N+1's deferred selector
	//      and writes the result into *both* `_options.steps[N+1]`
	//      AND `_introItems[N+1]`. intro.js v8 reads from
	//      `_introItems` at render time, so only patching the options
	//      list is not enough.
	//   3. When intro.js advances to step N+1, the highlight + tooltip
	//      lock onto the freshly resolved element.
	//
	// This avoids the timing pitfalls of trying to patch the current
	// step from `onbeforechange` (where intro.js' internal pointer is
	// inconsistent across versions).
	tour.onafterchange(function dispatchDemo() {
		const index = this.currentStep();
		const action = actions[index];
		if (action && typeof window.__rblLiveDemo === "function") {
			try {
				window.__rblLiveDemo(action);
			} catch {
				// Demo failures must never break the tour itself.
			}
		}
		// Pre-resolve the NEXT step's deferred anchor — its DOM node may
		// have just appeared in response to the demo action above.
		resolveDeferred(this, index + 1);
	});

	// intro.js fires both `oncomplete` and `onexit` when the user
	// finishes via the Done button — guard so the demo reset and the
	// localStorage write only happen once per tour run.
	let finished = false;
	const finish = () => {
		if (finished) return;
		finished = true;
		const resetAction = def.resetActionOnExit;
		if (resetAction && typeof window.__rblLiveDemo === "function") {
			try {
				window.__rblLiveDemo(resetAction);
			} catch {
				// Reset is best-effort — see runDemoAction in LiveMatchStep.
			}
		}
		markOnboardingDone(key);
	};
	tour.oncomplete(finish);
	tour.onexit(finish);

	await tour.start();
}
