<script>
import { getTranslate } from "@tolgee/svelte";
import ChemistryDonut from "./ChemistryDonut.svelte";
import DuoAvatars from "./DuoAvatars.svelte";
import SophieCard from "./SophieCard.svelte";

/**
 * Top of the duo profile: the two players as one unit (overlapping
 * avatars, both names as the page heading, the archetype), the
 * chemistry donut and Sophie's verdict. A tentative archetype gets
 * "(?)".
 *
 * Design A: the red hero band (a red card from `lg`). Design B: a
 * white card on the pitch.
 *
 * @type {{
 *   player1: object,
 *   player2: object,
 *   archetype: string|null,
 *   archetypeTentative?: boolean,
 *   chemistryScore: number|null,
 *   chemistryTrend?: number|null,
 *   rankInfo?: string|null,
 *   sophieQuote: string,
 * }}
 */
let {
	player1,
	player2,
	archetype,
	archetypeTentative = false,
	chemistryScore,
	chemistryTrend = null,
	rankInfo = null,
	sophieQuote,
} = $props();

const { t } = getTranslate();

const archetypeText = $derived.by(() => {
	if (!archetype) return $t("duo.archetype_placeholder");
	if (archetypeTentative) return `${archetype} (?)`;
	return archetype;
});
</script>

<section class="hero bleed duo-hero">
	<p class="eyebrow">{$t("duo.team_identity")}</p>

	<div class="identity">
		<DuoAvatars {player1} {player2} size={64} />
		<div class="names">
			<h1 class="page-title duo-name">{player1.username} &amp; {player2.username}</h1>
			<p class="duo-type" class:tentative={archetypeTentative}>{archetypeText}</p>
		</div>
	</div>

	<div class="verdict">
		<ChemistryDonut score={chemistryScore} trendDelta={chemistryTrend} {rankInfo} />
		<div class="quote">
			<SophieCard quote={sophieQuote} />
		</div>
	</div>
</section>

<style>
/* ── Design A: the red hero band ────────────────────────────────────── */
.duo-hero {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding-top: 20px;
	padding-bottom: 24px;
}

.eyebrow {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.identity {
	display: flex;
	align-items: center;
	gap: 16px;
}

.names {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.duo-name {
	margin: 0;
	font-size: 32px;
	overflow-wrap: anywhere;
	text-wrap: balance;
}

.duo-type {
	margin: 0;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 15px;
	letter-spacing: 0.02em;
	text-transform: uppercase;
}

.verdict {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 16px;
}

.quote {
	flex: 1 1 200px;
	min-width: 0;
}

/* Desktop: a wide card, the pair left, chemistry and verdict right. */
@media (min-width: 1024px) {
	.duo-hero {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-areas:
			"eyebrow eyebrow"
			"identity verdict";
		align-items: center;
		gap: 18px 40px;
		margin: 0;
		padding: 24px 28px;
		border-radius: var(--radius-card);
	}

	.eyebrow {
		grid-area: eyebrow;
	}

	.identity {
		grid-area: identity;
	}

	.verdict {
		grid-area: verdict;
	}

	.duo-name {
		font-size: 40px;
	}
}

/* ── Design B: a white card on the pitch ────────────────────────────── */
:global([data-variant="b"]) .duo-hero {
	gap: 14px;
	padding: 18px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

:global([data-variant="b"]) .eyebrow {
	font-family: var(--font-sans);
	font-size: 12px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-muted);
}

:global([data-variant="b"]) .duo-name {
	font-size: 30px;
}

:global([data-variant="b"]) .duo-type {
	font-family: var(--font-sans);
	font-weight: 500;
	font-size: 14px;
	letter-spacing: 0;
	text-transform: none;
	color: var(--color-brand-strong);
}

:global([data-variant="b"]) .duo-type.tentative {
	color: var(--color-muted);
}

@media (min-width: 1024px) {
	:global([data-variant="b"]) .duo-hero {
		gap: 14px 40px;
		padding: 24px;
	}
}
</style>
