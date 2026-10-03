<script>
import { getTranslate } from "@tolgee/svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getAllTeams, searchTeams } from "$lib/services/teams.services.js";

/**
 * @type {{
 *   value?: string,
 *   id?: string,
 *   direction?: "down"|"up",
 *   maxVisible?: number,
 * }}
 */
let {
	value = $bindable(""),
	id,
	direction = "down",
	maxVisible = 3,
} = $props();

/** Approx height of a single suggestion row (px). Used to cap the
 *  dropdown to `maxVisible` items before the list starts scrolling. */
const ROW_PX = 44;

const { t } = getTranslate();

let inputValue = $state(value);
let showSuggestions = $state(false);
let highlightIndex = $state(-1);
let suggestions = $state([]);

// Preload teams cache on mount. Without the catalogue the field still
// takes a typed name; it just offers no suggestions.
$effect(() => {
	getAllTeams().catch((err) => {
		console.warn("Team suggestions unavailable:", err);
	});
});

// Search suggestions when input changes
$effect(() => {
	if (!inputValue || inputValue.length < 1) {
		suggestions = [];
		return;
	}
	searchTeams(inputValue, 8)
		.then((results) => {
			suggestions = results;
		})
		.catch(() => {
			suggestions = [];
		});
});

function selectTeam(team) {
	inputValue = team.name;
	value = team.name;
	showSuggestions = false;
	highlightIndex = -1;
}

function handleInput(e) {
	inputValue = e.target.value;
	value = e.target.value;
	showSuggestions = true;
	highlightIndex = -1;
}

function handleFocus() {
	if (inputValue) {
		showSuggestions = true;
	}
}

function handleBlur() {
	// Delay to allow click on suggestion
	setTimeout(() => {
		showSuggestions = false;
	}, 200);
}

function handleKeydown(e) {
	if (!showSuggestions || suggestions.length === 0) return;

	if (e.key === "ArrowDown") {
		e.preventDefault();
		highlightIndex = Math.min(highlightIndex + 1, suggestions.length - 1);
	} else if (e.key === "ArrowUp") {
		e.preventDefault();
		highlightIndex = Math.max(highlightIndex - 1, 0);
	} else if (e.key === "Enter" && highlightIndex >= 0) {
		e.preventDefault();
		selectTeam(suggestions[highlightIndex]);
	} else if (e.key === "Escape") {
		showSuggestions = false;
	}
}

// Sync external value changes
$effect(() => {
	if (value !== inputValue) {
		inputValue = value;
	}
});
</script>

<div class="relative">
	<input
		{id}
		type="text"
		value={inputValue}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeydown}
		placeholder={$t("new_game.select_team")}
		autocomplete="off"
		class="field"
	/>

	{#if showSuggestions && suggestions.length > 0}
		<ul
			class="suggestions {direction === 'up' ? 'up' : 'down'}"
			style="max-height: {maxVisible * ROW_PX}px;"
		>
			{#each suggestions as team, i (team.name)}
				<li>
					<button
						type="button"
						class="suggestion"
						class:highlighted={i === highlightIndex}
						onmousedown={() => selectTeam(team)}
					>
						<span class="flex items-center gap-2 min-w-0">
							<TeamLogo logoUrl={team.logo_url} teamName={team.name} size="sm" />
							<span class="truncate">{team.name}</span>
						</span>
						<span class="flex items-center gap-1.5 shrink-0">
							<OvrBadge rating={team.overall_rating} size="xs" />
							<StarRating rating={team.star_rating} size="xs" />
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
.suggestions {
	position: absolute;
	z-index: 10;
	left: 0;
	right: 0;
	margin: 0;
	padding: 4px 0;
	list-style: none;
	overflow-y: auto;
	background: var(--color-surface);
	border: 1px solid var(--color-line);
	border-radius: var(--radius-tile);
	box-shadow: var(--shadow-raised);
}

.suggestions.down {
	top: 100%;
	margin-top: 4px;
}

.suggestions.up {
	bottom: 100%;
	margin-bottom: 4px;
}

.suggestion {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	width: 100%;
	min-height: 44px;
	padding: 0 12px;
	border: 0;
	background: transparent;
	color: var(--color-ink);
	font-size: 14px;
	text-align: left;
	cursor: pointer;
}

/* Keyboard highlight: a red marker on the sunken row, so the brand-red
 * stars stay readable. */
.suggestion:hover,
.suggestion.highlighted {
	background: var(--color-sunken);
}

.suggestion.highlighted {
	box-shadow: inset 3px 0 0 var(--color-brand);
}
</style>
