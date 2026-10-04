<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Wrapped-page header — "Wrapped" eyebrow, the page title and the
 * active week label, framed by chevron buttons that step through the
 * list. The newer chevron is disabled when we're on the most recent
 * week (no "future" to point at). It sits in the page hero: white on
 * the red band in design A; on the pitch in design B, with the week
 * switcher as a white sticker pill.
 *
 * @type {{
 *   weekLabel: string,
 *   canGoOlder: boolean,
 *   canGoNewer: boolean,
 *   onOlder: () => void,
 *   onNewer: () => void,
 * }}
 */
let {
	weekLabel,
	canGoOlder = false,
	canGoNewer = false,
	onOlder = () => {},
	onNewer = () => {},
} = $props();

const { t } = getTranslate();
</script>

<header class="week-nav">
	<p class="eyebrow">{$t("wrapped.nav.supertitle")}</p>
	<h1 class="page-title title">{$t("wrapped.nav.title")}</h1>
	<div class="pager">
		<button
			type="button"
			class="chev"
			disabled={!canGoOlder}
			onclick={onOlder}
			aria-label={$t("wrapped.nav.older")}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="18"
				height="18"
				aria-hidden="true"
			>
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>
		<p class="range" aria-live="polite">{weekLabel}</p>
		<button
			type="button"
			class="chev"
			disabled={!canGoNewer}
			onclick={onNewer}
			aria-label={$t("wrapped.nav.newer")}
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="18"
				height="18"
				aria-hidden="true"
			>
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</button>
	</div>
</header>

<style>
/* ── Design A: white on the red hero band ───────────────────────────── */
.week-nav {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
}

.eyebrow {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.title {
	margin: 0;
	font-size: 40px;
	text-wrap: balance;
	text-shadow: var(--on-page-shadow);
}

.pager {
	display: flex;
	align-items: center;
	gap: 12px;
	align-self: stretch;
	margin-top: 6px;
}

.range {
	flex: 1;
	min-width: 0;
	min-height: 1.2em;
	margin: 0;
	text-align: center;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 17px;
	line-height: 1.2;
	letter-spacing: 0.02em;
	font-variant-numeric: tabular-nums;
}

.chev {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: inherit;
	box-shadow: inset 0 0 0 1px currentColor;
	cursor: pointer;
	transition: background-color 120ms;
}

.chev:hover:not(:disabled) {
	background: var(--color-brand-strong);
}

.chev:disabled {
	opacity: 0.4;
	cursor: default;
}

/* White ring on the red band (the default navy ring would vanish). */
.chev:focus-visible {
	outline-color: currentColor;
}

@media (min-width: 1024px) {
	.title {
		font-size: 52px;
	}

	.pager {
		align-self: flex-start;
		width: min(100%, 28rem);
	}
}

/* ── Design B: title on the pitch, a white sticker pill to switch weeks ─ */
:global([data-variant="b"]) .eyebrow {
	padding: 3px 12px;
	border-radius: 999px;
	background: var(--color-gold);
	color: var(--color-on-gold);
	box-shadow: var(--shadow-control);
	font-size: 13px;
	letter-spacing: 0;
	text-transform: none;
}

:global([data-variant="b"]) .title {
	font-size: 34px;
}

:global([data-variant="b"]) .pager {
	gap: 8px;
	padding: 4px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .range {
	font-family: var(--font-sans);
	font-size: 14px;
	letter-spacing: 0;
}

:global([data-variant="b"]) .chev {
	width: 36px;
	height: 36px;
	background: var(--color-navy);
	color: var(--color-on-navy);
	box-shadow: none;
}

:global([data-variant="b"]) .chev:hover:not(:disabled) {
	background: var(--color-brand);
}

:global([data-variant="b"]) .chev:disabled {
	background: var(--color-sunken);
	color: var(--color-muted);
	opacity: 1;
}

:global([data-variant="b"]) .chev:focus-visible {
	outline-color: var(--color-navy);
}

@media (min-width: 1024px) {
	:global([data-variant="b"]) .title {
		font-size: 44px;
	}
}
</style>
