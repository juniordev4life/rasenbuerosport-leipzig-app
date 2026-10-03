<script>
import { getTranslate } from "@tolgee/svelte";

/**
 * Shell of the public auth pages (login, callback, setup): no app chrome.
 * The crest leads in a hero — a red band in design A, straight on the
 * pitch in B (the root layout paints the pitch) — and each page renders
 * into the white card below it.
 */

let { children } = $props();

const { t } = getTranslate();
</script>

<div class="auth">
	<div class="hero auth-hero">
		<img src="/logo.png" alt="RasenBürosport Leipzig" class="crest" width="315" height="318" />
	</div>

	<main class="auth-main">
		<div class="card auth-card">
			{@render children()}
		</div>

		<footer class="on-page auth-footer">
			{$t("footer.copyright", { year: new Date().getFullYear() })}
		</footer>
	</main>
</div>

<style>
.auth {
	min-height: 100dvh;
	display: flex;
	flex-direction: column;
}

/* A: red band behind the crest; the card overlaps its lower edge. */
.auth-hero {
	display: flex;
	justify-content: center;
	padding: calc(env(safe-area-inset-top, 0px) + 32px) 24px 72px;
}

.crest {
	width: 132px;
	height: auto;
}

.auth-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24px;
	padding: 0 16px 32px;
}

.auth-card {
	width: 100%;
	max-width: 24rem;
	margin-top: -44px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18px;
	padding: 28px 24px 24px;
	text-align: center;
}

.auth-footer {
	margin-top: auto;
	font-size: 12px;
}

/* B: the crest stands on the pitch, the card follows it; the copyright
 * is a white sticker so its small type stays readable on the grass. */
:global([data-variant="b"]) .auth-hero {
	padding-bottom: 20px;
}

:global([data-variant="b"]) .auth-card {
	margin-top: 0;
}

:global([data-variant="b"]) .auth-footer {
	padding: 4px 12px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-muted);
	text-shadow: none;
	box-shadow: var(--shadow-control);
}

@media (min-width: 640px) {
	.crest {
		width: 156px;
	}

	.auth-card {
		padding: 32px;
	}
}
</style>
