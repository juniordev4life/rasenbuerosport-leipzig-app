/**
 * Constants for the live-match event-entry screen.
 *
 * The values below live in one place so the page, components and the
 * state-machine util all read the same source — touch them here when
 * tuning long-press timing, transition speeds, or default goal types.
 */

/** Tuning knobs for the live-match UX (timings in ms). */
export const LIVE_MATCH = {
	longPressMs: 600,
	hapticDurationMs: 50,
	doubleTapWindowMs: 300,
	editorTransitionMs: 300,
	editorOpenDelayMs: 100,
	assistHintPulseMs: 1600,
};

/** Canonical event types persisted on `score_timeline`. */
export const EVENT_TYPE = Object.freeze({
	GOAL: "goal",
	CARD: "card",
	RED_CARD: "red_card",
	PENALTY_MISSED: "penalty_missed",
});

/** Goal-type values stored on a goal entry's `goal_type` field. */
export const GOAL_TYPE = Object.freeze({
	OPEN_PLAY: "open_play",
	CORNER: "corner",
	FREEKICK: "freekick",
	PENALTY: "penalty",
});

/** State-machine mode names. */
export const MODE = Object.freeze({
	IDLE: "idle",
	GOAL_ENTRY: "goal-entry",
	CARD_AWAITING_PLAYER: "card-awaiting-player",
	CARD_ENTRY: "card-entry",
	PENALTY_MISS_AWAITING_PLAYER: "penalty-miss-awaiting-player",
	PENALTY_MISS_AWAITING_KEEPER: "penalty-miss-awaiting-keeper",
	PENALTY_MISS_ENTRY: "penalty-miss-entry",
});

/** Card colour selectable in the footer toggle. */
export const CARD_COLOR = Object.freeze({
	YELLOW: "yellow",
	RED: "red",
});
