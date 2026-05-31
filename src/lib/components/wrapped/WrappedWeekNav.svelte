<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Wrapped-page header — "Wrapped / Die Wochen im Büro" supertitle +
 * the active week label, framed by chevron buttons that step through
 * the list. The newer chevron is disabled when we're on the most
 * recent week (no "future" to point at).
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
	<div class="supertitle">{$t("wrapped.nav.supertitle")}</div>
	<div class="title-row">
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
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="18"
				height="18"
				aria-hidden="true"
			>
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>
		<h1 class="title">{$t("wrapped.nav.title")}</h1>
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
				stroke-width="2"
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
	<div class="range">{weekLabel}</div>
</header>

<style>
	.week-nav {
		padding: 10px 4px 14px;
		text-align: center;
		color: #e5e7eb;
	}
	.supertitle {
		font-size: 10px;
		font-weight: 800;
		color: #fbbf24;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		margin-bottom: 4px;
	}
	.title-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}
	.title {
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: white;
		margin: 0;
	}
	.chev {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.04);
		color: #9ca3af;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.chev:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		color: #e5e7eb;
	}
	.chev:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.range {
		font-size: 12px;
		color: #9ca3af;
		margin-top: 6px;
		font-variant-numeric: tabular-nums;
	}
</style>
