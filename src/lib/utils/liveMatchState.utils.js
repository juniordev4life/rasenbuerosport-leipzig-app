/**
 * Pure state-machine for the live-match event-entry flow.
 *
 * The page component owns a single `$state(initialLiveMatchState(...))`
 * object and dispatches actions through these reducers. All reducers
 * are total functions of (state, payload) → new state — no side effects,
 * no Svelte deps — which makes the transitions trivial to reason about
 * and unit-test.
 *
 * See `docs/live-match.md` (spec section 2) for the canonical
 * transition diagram.
 */

import {
	CARD_COLOR,
	GOAL_TYPE,
	MODE,
} from "$lib/constants/liveMatch.constants.js";

/** @typedef {"home"|"away"} Side */

/**
 * @typedef {object} LiveMatchState
 * @property {string} mode - one of MODE.*
 * @property {string|null} playerId - scorer / offender / shooter (mode-dependent)
 * @property {Side|null} playerSide - side of the active player
 * @property {string|null} assisterId - only for goals
 * @property {string|null} keeperId - only for missed penalties (opposing keeper)
 * @property {number} minute - 1..120
 * @property {number|null} stoppageMinutes - null when not in stoppage; otherwise 1..10
 * @property {string} goalType - one of GOAL_TYPE.*
 * @property {string|null} pendingCardColor - one of CARD_COLOR.* when in a card mode
 * @property {boolean} isOwnGoal
 * @property {number} scoreHome - aggregated score derived from saved events
 * @property {number} scoreAway
 * @property {Array<object>} events - committed events (score_timeline rows)
 */

/** Minutes at which the stoppage picker becomes enabled. */
export const STOPPAGE_TRIGGER_MINUTES = [45, 90, 120];

/**
 * Build a fresh state with the score and event-log reset. Used both on
 * page mount and after every successful save.
 *
 * @returns {LiveMatchState}
 */
export function initialLiveMatchState() {
	return {
		mode: MODE.IDLE,
		playerId: null,
		playerSide: null,
		assisterId: null,
		keeperId: null,
		minute: 1,
		stoppageMinutes: null,
		goalType: GOAL_TYPE.OPEN_PLAY,
		pendingCardColor: null,
		isOwnGoal: false,
		scoreHome: 0,
		scoreAway: 0,
		events: [],
	};
}

/**
 * Lowest selectable BASE minute for the next event. If the previous
 * event happened during stoppage time the floor stays on the same
 * base minute (so the user can still record another goal at e.g.
 * 90+5 after a 90+3); the stoppage-side floor is computed separately
 * via `getMinAllowedStoppage`.
 *
 * @param {Array<object>} events
 * @returns {number}
 * @example
 *   getMinAllowedMinute([])                              // → 1
 *   getMinAllowedMinute([{ minute: 23, stoppage: 0 }])   // → 24
 *   getMinAllowedMinute([{ minute: 45, stoppage: 3 }])   // → 45 (more stoppage possible)
 */
export function getMinAllowedMinute(events) {
	if (!events || events.length === 0) return 1;
	const last = events[events.length - 1];
	const lastMinute = last.minute ?? 0;
	const lastStoppage = last.stoppage ?? 0;
	if (lastStoppage > 0) return lastMinute;
	return Math.min(120, lastMinute + 1);
}

/**
 * Lowest selectable stoppage value when the picker's primary is at
 * `currentMinute`. Returns `1` unless the previous event happened in
 * stoppage of that same base minute — then the next event must use a
 * higher stoppage to preserve event ordering.
 *
 * @param {Array<object>} events
 * @param {number} currentMinute
 * @returns {number}
 * @example
 *   getMinAllowedStoppage([{ minute: 45, stoppage: 3 }], 45) // → 4
 *   getMinAllowedStoppage([{ minute: 45, stoppage: 3 }], 90) // → 1
 */
export function getMinAllowedStoppage(events, currentMinute) {
	if (!events || events.length === 0) return 1;
	const last = events[events.length - 1];
	if ((last.minute ?? 0) === currentMinute && (last.stoppage ?? 0) > 0) {
		return Math.min(10, last.stoppage + 1);
	}
	return 1;
}

/**
 * Reset only the per-event fields (mode, selected player, minute,…)
 * while keeping the committed score and event log untouched. The
 * minute floor reflects the next allowed minute given the events log,
 * so the next event starts on the first legal value rather than 1.
 */
function clearEntry(state) {
	const minute = getMinAllowedMinute(state.events);
	// If the events log ended in stoppage of the same base minute, the
	// next entry pre-selects the bumped stoppage value so the picker
	// opens at a legal floor instead of forcing the user to scroll.
	const stoppageFloor = getMinAllowedStoppage(state.events, minute);
	const stoppageMinutes = stoppageFloor > 1 ? stoppageFloor : null;
	return {
		...state,
		mode: MODE.IDLE,
		playerId: null,
		playerSide: null,
		assisterId: null,
		keeperId: null,
		minute,
		stoppageMinutes,
		goalType: GOAL_TYPE.OPEN_PLAY,
		pendingCardColor: null,
		isOwnGoal: false,
	};
}

/**
 * Toggle the card-entry mode from the footer.
 * - idle           → card-awaiting-player with the new colour
 * - awaiting (same colour)  → idle (cancel)
 * - awaiting (other colour) → awaiting with switched colour
 * - any other mode → unchanged (mode is locked)
 *
 * @param {LiveMatchState} state
 * @param {"yellow"|"red"} color
 * @returns {LiveMatchState}
 */
export function toggleCardMode(state, color) {
	if (state.mode === MODE.IDLE) {
		return {
			...state,
			mode: MODE.CARD_AWAITING_PLAYER,
			pendingCardColor: color,
		};
	}
	if (state.mode === MODE.CARD_AWAITING_PLAYER) {
		if (state.pendingCardColor === color) return clearEntry(state);
		return { ...state, pendingCardColor: color };
	}
	return state;
}

/**
 * Toggle the missed-penalty mode from the footer (single button).
 *
 * @param {LiveMatchState} state
 * @returns {LiveMatchState}
 */
export function togglePenaltyMissMode(state) {
	if (state.mode === MODE.IDLE) {
		return { ...state, mode: MODE.PENALTY_MISS_AWAITING_PLAYER };
	}
	if (state.mode === MODE.PENALTY_MISS_AWAITING_PLAYER)
		return clearEntry(state);
	return state;
}

/**
 * Handle a player tap, dispatched from `PitchPlayer`. The behaviour
 * depends on the current mode — see the comments inside.
 *
 * @param {LiveMatchState} state
 * @param {{ playerId: string, side: Side }} payload
 * @returns {LiveMatchState}
 */
export function selectPlayer(state, { playerId, side }) {
	// Card-entry intercepts: a tap on any player commits the card
	// to that player and opens the minute editor.
	if (state.mode === MODE.CARD_AWAITING_PLAYER) {
		return { ...state, mode: MODE.CARD_ENTRY, playerId, playerSide: side };
	}
	// Missed penalty: first tap names the shooter, second tap names
	// the keeper (which must be on the OPPOSING team — guarded here so
	// a stray tap on the shooter's own teammate doesn't slip through).
	if (state.mode === MODE.PENALTY_MISS_AWAITING_PLAYER) {
		return {
			...state,
			mode: MODE.PENALTY_MISS_AWAITING_KEEPER,
			playerId,
			playerSide: side,
		};
	}
	if (state.mode === MODE.PENALTY_MISS_AWAITING_KEEPER) {
		if (side === state.playerSide) return state;
		return { ...state, mode: MODE.PENALTY_MISS_ENTRY, keeperId: playerId };
	}

	if (state.mode === MODE.IDLE) {
		return {
			...state,
			mode: MODE.GOAL_ENTRY,
			playerId,
			playerSide: side,
			isOwnGoal: false,
		};
	}

	if (state.mode === MODE.GOAL_ENTRY) {
		// Tap on the scorer again → deselect (back to idle)
		if (state.playerId === playerId) return clearEntry(state);
		// Tap on the current assister → drop the assist
		if (state.assisterId === playerId) return { ...state, assisterId: null };
		// Tap on a same-team partner → assign as assister
		// (skipped on own-goal — own goals have no assister)
		if (side === state.playerSide && !state.isOwnGoal) {
			return { ...state, assisterId: playerId };
		}
		// Tap on an opposing player while a goal is in progress is
		// ignored (the editor overlay sits over their half anyway).
		return state;
	}

	return state;
}

/**
 * Long-press on a player avatar starts an own-goal entry. Only valid
 * from idle — `awaiting-player` / `entry` modes ignore long-press.
 *
 * @param {LiveMatchState} state
 * @param {{ playerId: string, side: Side }} payload
 * @returns {LiveMatchState}
 */
export function longPressPlayer(state, { playerId, side }) {
	if (state.mode !== MODE.IDLE) return state;
	return {
		...state,
		mode: MODE.GOAL_ENTRY,
		playerId,
		playerSide: side,
		isOwnGoal: true,
	};
}

/** Set the primary minute. When the user scrolls off a stoppage trigger
 *  minute (45/90/120) the stoppage value is dropped so the resulting
 *  event has a single coherent time. */
export function setMinute(state, minute) {
	const stillEligible = STOPPAGE_TRIGGER_MINUTES.includes(minute);
	return {
		...state,
		minute,
		stoppageMinutes: stillEligible ? state.stoppageMinutes : null,
	};
}

/** Set the stoppage value. `null` clears it. */
export function setStoppage(state, stoppageMinutes) {
	return { ...state, stoppageMinutes };
}

export function setGoalType(state, goalType) {
	return { ...state, goalType };
}

/** Reset the in-progress entry (cancel from any non-idle mode). */
export function cancelEntry(state) {
	return clearEntry(state);
}

/**
 * Persist the current entry into the local event log and update the
 * scoreboard. Returns the new state with the entry cleared. Calling
 * this on `idle` is a no-op so the page can safely route all confirms
 * through one function.
 *
 * @param {LiveMatchState} state
 * @returns {LiveMatchState}
 */
export function confirmEntry(state) {
	if (state.mode === MODE.GOAL_ENTRY) {
		// Own goals count for the opposing team. The event still
		// records the scorer + their side; only the score increments
		// on the receiving side.
		const credit = state.isOwnGoal
			? state.playerSide === "home"
				? "away"
				: "home"
			: state.playerSide;
		const next = {
			...state,
			scoreHome: state.scoreHome + (credit === "home" ? 1 : 0),
			scoreAway: state.scoreAway + (credit === "away" ? 1 : 0),
		};
		const event = {
			event_type: "goal",
			scored_by: state.playerId,
			assist_by: state.assisterId,
			team: credit,
			home: next.scoreHome,
			away: next.scoreAway,
			goal_type: state.goalType,
			period: state.minute > 90 ? "extra_time" : "first_half",
			minute: state.minute,
			stoppage: state.stoppageMinutes ?? 0,
			is_own_goal: state.isOwnGoal,
		};
		return clearEntry({ ...next, events: [...state.events, event] });
	}

	if (state.mode === MODE.CARD_ENTRY) {
		const isRed = state.pendingCardColor === CARD_COLOR.RED;
		const event = {
			event_type: isRed ? "red_card" : "card",
			card_type: state.pendingCardColor,
			player_id: state.playerId,
			team: state.playerSide,
			period: state.minute > 90 ? "extra_time" : "first_half",
			minute: state.minute,
			stoppage: state.stoppageMinutes ?? 0,
		};
		return clearEntry({ ...state, events: [...state.events, event] });
	}

	if (state.mode === MODE.PENALTY_MISS_ENTRY) {
		const event = {
			event_type: "penalty_missed",
			shooter_id: state.playerId,
			keeper_id: state.keeperId,
			team: state.playerSide,
			period: state.minute > 90 ? "extra_time" : "first_half",
			minute: state.minute,
			stoppage: state.stoppageMinutes ?? 0,
		};
		return clearEntry({ ...state, events: [...state.events, event] });
	}

	return state;
}

/**
 * Remove the event at `index` from the events log and recompute the
 * scoreboard from scratch. Goal events store their running score on
 * the event itself; we walk the remaining list, increment the per-side
 * counter on each goal (own goals credit the opposite side), and
 * patch the stored `home` / `away` values so the timeline stays
 * coherent if the user re-opens the editor.
 *
 * @param {LiveMatchState} state
 * @param {number} index
 * @returns {LiveMatchState}
 * @example
 *   removeEventAt(state, 2) // drops the third event and rescores
 */
export function removeEventAt(state, index) {
	if (!state.events[index]) return state;
	const next = [];
	let home = 0;
	let away = 0;
	for (let i = 0; i < state.events.length; i += 1) {
		if (i === index) continue;
		const e = state.events[i];
		if (e.event_type === "goal") {
			const credit = e.is_own_goal
				? e.team === "home"
					? "away"
					: "home"
				: e.team;
			if (credit === "home") home += 1;
			else away += 1;
			next.push({ ...e, home, away });
		} else {
			next.push(e);
		}
	}
	return {
		...state,
		events: next,
		scoreHome: home,
		scoreAway: away,
	};
}

/** Helper used by the page to decide whether an event is in progress. */
export function isAwaitingPlayer(mode) {
	return (
		mode === MODE.CARD_AWAITING_PLAYER ||
		mode === MODE.PENALTY_MISS_AWAITING_PLAYER ||
		mode === MODE.PENALTY_MISS_AWAITING_KEEPER
	);
}

export function isEntryMode(mode) {
	return (
		mode === MODE.GOAL_ENTRY ||
		mode === MODE.CARD_ENTRY ||
		mode === MODE.PENALTY_MISS_ENTRY
	);
}
