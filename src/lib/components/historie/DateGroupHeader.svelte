<script>
/**
 * Heading above one date bucket of the Historie list ("Gestern —
 * 2 Matches"), placed straight on the page: red condensed caps in
 * design A, white sentence case on the pitch in B. The bucket's ELO
 * change only shows under the "Meine Spiele" filter and always carries
 * its sign, so it never relies on colour.
 *
 * `partial` marks a bucket that may continue on the next page: its count
 * reads "8+" and its incomplete ELO change is left out.
 *
 * @type {{
 *   label: string,
 *   matchCount: number,
 *   partial?: boolean,
 *   eloDelta?: number|null,
 *   matchesLabel?: string,
 * }}
 */
let {
	label,
	matchCount,
	partial = false,
	eloDelta = null,
	matchesLabel = "Matches",
} = $props();

// Bucket labels arrive in caps ("DIESE WOCHE"). Lower-case them so each
// design sets the case in CSS: caps in A, capitalised words in B.
const when = $derived((label ?? "").toLowerCase());

const eloText = $derived.by(() => {
	if (eloDelta == null || partial) return null;
	if (eloDelta > 0) return `+${eloDelta} ELO`;
	if (eloDelta < 0) return `−${Math.abs(eloDelta)} ELO`;
	return "±0 ELO";
});

const tone = $derived(
	eloDelta == null || eloDelta === 0 ? "draw" : eloDelta > 0 ? "win" : "loss",
);
</script>

<div class="group-head">
	<h2 class="section-title on-page title">
		<span class="when">{when}</span>
		<span class="sep" aria-hidden="true"></span>
		{matchCount}{partial ? "+" : ""}
		{matchesLabel}
	</h2>
	{#if eloText}
		<span class="delta delta-{tone}">{eloText}</span>
	{/if}
</div>

<style>
.group-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
}

.title {
	margin: 0;
	min-width: 0;
}

.sep::before {
	content: "—";
}

/* The ELO change is the shared `.delta`: coloured text in A. */
.delta {
	flex-shrink: 0;
	font-size: 15px;
}

/* Design B: white sentence case on the pitch (`.on-page`), the ELO change
 * as a white sticker pill instead of the shared tint — small coloured
 * text cannot sit on the grass. */
:global([data-variant="b"]) .group-head {
	align-items: center;
}

:global([data-variant="b"]) .title {
	font-size: 20px;
}

:global([data-variant="b"]) .when {
	text-transform: capitalize;
}

:global([data-variant="b"]) .sep::before {
	content: "·";
}

:global([data-variant="b"]) .delta {
	background: var(--color-surface);
	box-shadow: var(--shadow-control);
	font-size: 13px;
}
</style>
