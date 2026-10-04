<script>
import { getTranslate } from "@tolgee/svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";

/**
 * A reporter's full biography on the shared Sheet: photo with a ring in
 * the persona's colour, role title, fact pills, the bio paragraphs and a
 * pull quote. Opened from the reporter's photo on the match report and
 * on Frank's home card; closes on the scrim, Escape or the close button.
 *
 * @type {{
 *   reporter: import('$lib/constants/reporters.constants.js').ReporterPersona,
 *   onClose: () => void,
 * }}
 */
let { reporter, onClose } = $props();

const { t } = getTranslate();
</script>

<Sheet title={reporter.name} {onClose}>
	<div class="bio">
		<div class="intro">
			<img
				src={reporter.imageUrl}
				alt={reporter.name}
				class="photo ring-2 {reporter.ringClass}"
				loading="lazy"
			/>
			<div class="intro-text">
				<p class="role {reporter.accentClass}">{$t(reporter.titleKey)}</p>
				<ul class="pills">
					{#each reporter.pills as pill (pill.labelKey)}
						<li class="pill">{$t(pill.labelKey)}</li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="text">
			{#each reporter.bioKeys as bioKey (bioKey)}
				<p>{$t(bioKey)}</p>
			{/each}
		</div>

		<!-- The persona colour (accentClass) draws the rule; the text stays ink. -->
		<blockquote class="quote {reporter.accentClass}">
			<p>{$t(reporter.quoteKey)}</p>
		</blockquote>
	</div>
</Sheet>

<style>
.bio {
	display: flex;
	flex-direction: column;
	gap: 18px;
}

.intro {
	display: flex;
	align-items: center;
	gap: 16px;
}

.photo {
	width: 88px;
	height: 88px;
	flex-shrink: 0;
	object-fit: cover;
	border-radius: var(--radius-avatar);
	background: var(--color-sunken);
}

.intro-text {
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
}

.role {
	margin: 0;
	font-family: var(--font-label);
	font-weight: var(--label-weight);
	font-size: 14px;
	letter-spacing: var(--label-tracking);
	text-transform: var(--label-case);
}

.pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.pill {
	padding: 3px 10px;
	border-radius: var(--radius-badge);
	background: var(--color-sunken);
	color: var(--color-ink);
	font-weight: 600;
	font-size: 12px;
}

.text {
	display: flex;
	flex-direction: column;
	gap: 12px;
	font-size: 15px;
	line-height: 1.6;
}

.text p {
	margin: 0;
}

.quote {
	margin: 0;
	padding: 12px 14px;
	border-left: 3px solid currentColor;
	background: var(--color-sunken);
}

.quote p {
	margin: 0;
	color: var(--color-ink);
	font-style: italic;
	font-size: 15px;
	line-height: 1.5;
}

/* Design B: the quote as a pale gold speech bubble. */
:global([data-variant="b"]) .quote {
	border-left: 0;
	border-radius: 16px;
	background: var(--color-gold-soft);
}
</style>
