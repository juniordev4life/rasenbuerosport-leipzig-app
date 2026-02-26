<script>
	import { getTranslate } from "@tolgee/svelte";
	import { FOOTBALL_TEAMS, getCountryFlag } from "$lib/constants/teams.constants.js";

	let { value = $bindable("") } = $props();

	const { t } = getTranslate();

	let inputValue = $state(value);
	let showSuggestions = $state(false);
	let highlightIndex = $state(-1);

	const suggestions = $derived.by(() => {
		if (!inputValue || inputValue.length < 1) return [];
		const query = inputValue.toLowerCase();
		return FOOTBALL_TEAMS.filter(
			(team) =>
				team.name.toLowerCase().includes(query) ||
				team.league.toLowerCase().includes(query),
		).slice(0, 8);
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
		type="text"
		value={inputValue}
		oninput={handleInput}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={handleKeydown}
		placeholder={$t("new_game.select_team")}
		autocomplete="off"
		class="w-full bg-bg-input border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-red"
	/>

	{#if showSuggestions && suggestions.length > 0}
		<ul
			class="absolute z-10 w-full mt-1 bg-bg-secondary border border-border rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto"
		>
			{#each suggestions as team, i (team.name)}
				<li>
					<button
						type="button"
						class="w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2 {i === highlightIndex ? 'bg-accent-red text-white' : 'text-text-primary hover:bg-bg-input'}"
						onmousedown={() => selectTeam(team)}
					>
						<span class="truncate">{getCountryFlag(team.country)} {team.name}</span>
						<span class="text-[10px] shrink-0 {i === highlightIndex ? 'text-white/70' : 'text-text-secondary'}">
							{team.league}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
