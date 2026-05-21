<script>
import { getTranslate } from "@tolgee/svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getTeamByName } from "$lib/services/teams.services.js";
import { rollRandomTeams } from "$lib/utils/randomTeams.utils.js";
import RandomTeamPicker from "./RandomTeamPicker.svelte";
import TeamSelectionStep from "./TeamSelectionStep.svelte";

/**
 * Step 2 of the new-game wizard — match poster with the two teams
 * picked for the upcoming match. On mount it auto-rolls a balanced
 * pair (4–5★ default); the three action buttons re-roll, open the
 * star-range dialog or fall back to the manual TeamSelectionStep
 * (autocomplete fields). The big red CTA forwards to onAnpfiff,
 * which transitions the wizard into the ScoreStep without bumping
 * the visible stepper.
 *
 * @type {{
 *   homePlayers: string[],
 *   awayPlayers: string[],
 *   allPlayers: Array<{ id: string, username: string, avatar_url?: string|null }>,
 *   homeTeam: string,
 *   awayTeam: string,
 *   onAnpfiff: () => void,
 *   onBack: () => void,
 * }}
 */
let {
	homePlayers = [],
	awayPlayers = [],
	allPlayers = [],
	homeTeam = $bindable(""),
	awayTeam = $bindable(""),
	onAnpfiff,
	onBack,
} = $props();

const { t } = getTranslate();

const GUEST_ID = "__guest__";
const DEFAULT_MIN = 4;
const DEFAULT_MAX = 5;

let minStars = $state(DEFAULT_MIN);
let maxStars = $state(DEFAULT_MAX);

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

let rolling = $state(false);
let rollError = $state("");
let showAnpassen = $state(false);
let showManuell = $state(false);

const hasTeams = $derived(!!homeTeamData && !!awayTeamData);
const sameStars = $derived(
	homeTeamData?.star_rating === awayTeamData?.star_rating,
);

const playerCount = $derived.by(() => {
	const h = homePlayers.length;
	const a = awayPlayers.length;
	return `${h}v${a}`;
});

/** Initial auto-roll if no team is set yet. Triggered once on mount. */
$effect(() => {
	if (!homeTeam && !awayTeam) {
		roll();
	} else if (homeTeam && !homeTeamData) {
		getTeamByName(homeTeam).then((d) => {
			homeTeamData = d || null;
		});
	}
});

$effect(() => {
	if (awayTeam && !awayTeamData) {
		getTeamByName(awayTeam).then((d) => {
			awayTeamData = d || null;
		});
	}
});

async function roll() {
	rolling = true;
	rollError = "";
	try {
		const pair = await rollRandomTeams({ minStars, maxStars });
		if (!pair) {
			rollError = $t("new_game.random_no_teams");
			return;
		}
		homeTeam = pair.home.name;
		awayTeam = pair.away.name;
		homeTeamData = pair.home;
		awayTeamData = pair.away;
	} finally {
		rolling = false;
	}
}

function onAnpassenConfirm(home, away) {
	homeTeam = home;
	awayTeam = away;
	homeTeamData = null;
	awayTeamData = null;
	showAnpassen = false;
}

function getPlayer(id) {
	if (id.startsWith(GUEST_ID)) {
		return { id, username: $t("new_game.guest"), avatar_url: null };
	}
	return (
		allPlayers.find((p) => p.id === id) ?? {
			id,
			username: "?",
			avatar_url: null,
		}
	);
}

function avatarGradient(id) {
	const palette = [
		["#84CC16", "#65A30D"],
		["#E24B4A", "#C73E3D"],
		["#6366F1", "#4338CA"],
		["#F59E0B", "#D97706"],
		["#06B6D4", "#0891B2"],
		["#A78BFA", "#7C3AED"],
		["#EC4899", "#BE185D"],
		["#14B8A6", "#0F766E"],
	];
	let hash = 0;
	for (let i = 0; i < id.length; i += 1) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	const [a, b] = palette[Math.abs(hash) % palette.length];
	return `linear-gradient(135deg, ${a}, ${b})`;
}
</script>

{#snippet playerChip(id)}
	{@const p = getPlayer(id)}
	<div class="inline-flex items-center gap-1.5 rounded-full bg-bg-input border border-border pl-0.5 pr-2.5 py-0.5 max-w-full">
		{#if p.avatar_url}
			<img src={p.avatar_url} alt={p.username} class="w-5 h-5 rounded-full object-cover" />
		{:else}
			<span
				class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
				style="background: {avatarGradient(id)};"
			>{p.username.charAt(0).toUpperCase()}</span>
		{/if}
		<span class="text-[11px] font-medium text-text-secondary truncate max-w-[120px]">
			{p.username}
		</span>
	</div>
{/snippet}

{#snippet teamBlock(team, side, players)}
	{@const accent = side === "home" ? "text-accent-red" : "text-success"}
	<div class="flex flex-col items-center gap-3 text-center min-w-0">
		<div class="text-[11px] tracking-[0.12em] uppercase font-extrabold {accent}">
			{side === "home" ? `▶ ${$t("new_game.home")}` : `${$t("new_game.away")} ◀`}
		</div>
		{#if team}
			<TeamLogo logoUrl={team.logo_url} teamName={team.name} size="lg" />
		{:else}
			<div class="w-14 h-14 rounded-full bg-bg-input animate-pulse"></div>
		{/if}
		<h2 class="text-sm sm:text-base lg:text-lg font-bold leading-tight truncate max-w-[180px] sm:max-w-[220px]">
			{team?.name ?? "—"}
		</h2>
		{#if team}
			<div class="flex items-center gap-2">
				{#if team.overall_rating != null}
					<OvrBadge rating={team.overall_rating} size="sm" />
				{/if}
				{#if team.star_rating != null}
					<StarRating rating={team.star_rating} size="sm" />
				{/if}
			</div>
		{/if}
		<div class="flex flex-wrap justify-center gap-1.5 mt-1 w-full">
			{#each players as id (id)}
				{@render playerChip(id)}
			{/each}
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-5">
	<div class="flex justify-center">
		<span class="inline-flex items-center gap-2 text-[11px] text-text-muted bg-bg-input border border-border rounded-full px-3 py-1">
			<span class="w-1.5 h-1.5 rounded-full bg-success"></span>
			{$t("new_game.poster.generation_info", { min: minStars, max: maxStars })}
			{#if sameStars && homeTeamData}
				· {$t("new_game.poster.balanced")}
			{/if}
		</span>
	</div>

	{#if rollError}
		<div class="text-center text-xs text-warning">{rollError}</div>
	{/if}

	<div class="rounded-2xl border border-border bg-bg-card p-5 lg:p-8">
		<div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-6 lg:gap-4">
			{@render teamBlock(homeTeamData, "home", homePlayers)}

			<div class="flex flex-col items-center gap-2 lg:px-3">
				<div class="flex items-center gap-3 lg:flex-col">
					<div class="h-px w-12 bg-border lg:h-12 lg:w-px"></div>
					<div class="w-14 h-14 rounded-full bg-bg-input border-2 border-border flex items-center justify-center text-sm font-bold text-text-primary tabular-nums">
						VS
					</div>
					<div class="h-px w-12 bg-border lg:h-12 lg:w-px"></div>
				</div>
				{#if hasTeams}
					<span class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full {sameStars ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}">
						{sameStars ? "⚖" : "⚠"}
						{sameStars
							? $t("new_game.poster.balanced")
							: $t("new_game.poster.imbalanced")}
					</span>
				{/if}
			</div>

			{@render teamBlock(awayTeamData, "away", awayPlayers)}
		</div>
	</div>

	<div class="grid grid-cols-3 gap-2.5">
		<button
			type="button"
			onclick={roll}
			disabled={rolling}
			class="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-input px-3 py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary disabled:opacity-50"
		>
			<span aria-hidden="true">🎲</span>
			<span>{$t("new_game.poster.action_roll")}</span>
		</button>
		<button
			type="button"
			onclick={() => (showAnpassen = true)}
			class="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-input px-3 py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
		>
			<span aria-hidden="true">⚙️</span>
			<span>{$t("new_game.poster.action_customize")}</span>
		</button>
		<button
			type="button"
			onclick={() => (showManuell = true)}
			class="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-input px-3 py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
		>
			<span aria-hidden="true">✋</span>
			<span>{$t("new_game.poster.action_manual")}</span>
		</button>
	</div>

	<button
		type="button"
		onclick={onAnpfiff}
		disabled={!homeTeam || !awayTeam}
		class="w-full rounded-2xl bg-gradient-to-br from-accent-red to-accent-red-hover px-5 py-4 lg:py-5 text-base lg:text-lg font-bold text-white shadow-xl shadow-accent-red/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
	>
		<span aria-hidden="true" class="text-xl">⚽</span>
		<span>{$t("new_game.poster.anpfiff_cta")}</span>
	</button>

	<div class="flex justify-center">
		<button
			type="button"
			onclick={onBack}
			class="text-xs text-text-muted hover:text-text-primary px-3 py-2 rounded-lg"
		>
			← {$t("new_game.back")}
		</button>
	</div>
</div>

{#if showAnpassen}
	<RandomTeamPicker
		onClose={() => (showAnpassen = false)}
		onConfirm={onAnpassenConfirm}
	/>
{/if}

{#if showManuell}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 sm:p-4"
		onclick={() => (showManuell = false)}
	>
		<div
			class="bg-bg-secondary border border-border w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[90vh] sm:rounded-2xl overflow-y-auto p-5"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-base font-bold">{$t("new_game.poster.action_manual")}</h3>
				<button
					type="button"
					onclick={() => (showManuell = false)}
					class="w-8 h-8 rounded-full bg-bg-input text-text-secondary text-lg flex items-center justify-center hover:bg-bg-card"
					aria-label={$t("common.close")}
				>×</button>
			</div>
			<TeamSelectionStep
				{homePlayers}
				{awayPlayers}
				{allPlayers}
				bind:homeTeam
				bind:awayTeam
				onNext={() => {
					showManuell = false;
					homeTeamData = null;
					awayTeamData = null;
				}}
				onBack={() => (showManuell = false)}
			/>
		</div>
	</div>
{/if}
