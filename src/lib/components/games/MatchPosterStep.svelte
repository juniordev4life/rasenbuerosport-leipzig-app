<script>
import { getTranslate } from "@tolgee/svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import StarRating from "$lib/components/ui/StarRating.svelte";
import TeamLogo from "$lib/components/ui/TeamLogo.svelte";
import { getTeamByName } from "$lib/services/teams.services.js";
import { rollRandomTeams } from "$lib/utils/randomTeams.utils.js";
import RandomTeamPicker from "./RandomTeamPicker.svelte";
import TeamAutocomplete from "./TeamAutocomplete.svelte";

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
/** Local drafts so the manual modal can be cancelled without
 *  overwriting the currently displayed teams. */
let manualHomeDraft = $state("");
let manualAwayDraft = $state("");

function openManuell() {
	manualHomeDraft = homeTeam;
	manualAwayDraft = awayTeam;
	showManuell = true;
}

function saveManuell() {
	homeTeam = manualHomeDraft;
	awayTeam = manualAwayDraft;
	homeTeamData = null;
	awayTeamData = null;
	showManuell = false;
}

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

{#snippet teamBlock(team, players)}
	<div class="relative z-10 flex flex-col items-center justify-center gap-2.5 text-center min-w-0 px-4">
		{#if team}
			<TeamLogo logoUrl={team.logo_url} teamName={team.name} size="lg" />
		{:else}
			<div class="w-14 h-14 rounded-full bg-bg-input animate-pulse"></div>
		{/if}
		<h2 class="text-sm sm:text-base font-bold leading-tight truncate max-w-[200px]">
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

<div class="flex flex-col gap-3">
	{#if rollError}
		<div class="text-center text-xs text-warning">{rollError}</div>
	{/if}

	<!-- Pitch with the two teams in their respective halves — same
	     visual as the player lobby and live-match screens. -->
	<div
		class="relative rounded-2xl border-2 border-border overflow-hidden"
		style="background: linear-gradient(135deg, #0d3320 0%, #0a2516 100%);"
	>
		<svg
			viewBox="0 0 200 280"
			preserveAspectRatio="none"
			class="absolute inset-0 w-full h-full opacity-40 pointer-events-none lg:hidden"
			aria-hidden="true"
		>
			<line x1="0" y1="140" x2="200" y2="140" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="100" cy="140" r="22" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="100" cy="140" r="1.5" fill="#84CC16" />
			<rect x="60" y="0" width="80" height="32" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<rect x="60" y="248" width="80" height="32" fill="none" stroke="#84CC16" stroke-width="0.5" />
		</svg>
		<svg
			viewBox="0 0 320 200"
			preserveAspectRatio="none"
			class="absolute inset-0 w-full h-full opacity-40 pointer-events-none hidden lg:block"
			aria-hidden="true"
		>
			<line x1="160" y1="0" x2="160" y2="200" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="160" cy="100" r="22" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<circle cx="160" cy="100" r="1.5" fill="#84CC16" />
			<rect x="0" y="60" width="36" height="80" fill="none" stroke="#84CC16" stroke-width="0.5" />
			<rect x="284" y="60" width="36" height="80" fill="none" stroke="#84CC16" stroke-width="0.5" />
		</svg>

		<div class="relative grid grid-cols-1 lg:grid-cols-2 grid-rows-2 lg:grid-rows-1 h-[460px] lg:h-[440px]">
			<div class="relative min-h-0 overflow-hidden flex items-center justify-center">
				{@render teamBlock(homeTeamData, homePlayers)}
			</div>
			<div class="absolute inset-x-0 top-1/2 h-px bg-white/10 lg:hidden" aria-hidden="true"></div>
			<div class="hidden lg:block absolute inset-y-0 left-1/2 w-px bg-white/10" aria-hidden="true"></div>
			<div class="relative min-h-0 overflow-hidden flex items-center justify-center">
				{@render teamBlock(awayTeamData, awayPlayers)}
			</div>
		</div>
	</div>

	<!-- Generation info pill -->
	<div class="generation-info-wrap">
		<span class="generation-info">
			<span class="generation-info-dot"></span>
			{$t("new_game.poster.generation_info", { min: minStars, max: maxStars })}
			{#if sameStars && homeTeamData}
				· {$t("new_game.poster.balanced")}
			{/if}
		</span>
	</div>

	<button
		type="button"
		onclick={onAnpfiff}
		disabled={!homeTeam || !awayTeam}
		class="primary-btn"
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			width="14"
			height="14"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
		</svg>
		<span>{$t("new_game.poster.anpfiff_cta")}</span>
	</button>

	<!-- Secondary actions row -->
	<div class="btn-row">
		<button
			type="button"
			onclick={roll}
			disabled={rolling}
			class="secondary-btn"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="13"
				height="13"
				aria-hidden="true"
			>
				<polyline points="1 4 1 10 7 10" />
				<path d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
			</svg>
			<span>{$t("new_game.poster.action_roll")}</span>
		</button>
		<button
			type="button"
			onclick={() => (showAnpassen = true)}
			class="secondary-btn"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="13"
				height="13"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="3" />
				<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
			</svg>
			<span>{$t("new_game.poster.action_customize")}</span>
		</button>
		<button
			type="button"
			onclick={openManuell}
			class="secondary-btn"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="13"
				height="13"
				aria-hidden="true"
			>
				<path d="M18 11V6a2 2 0 00-2-2a2 2 0 00-2 2M14 10V4a2 2 0 00-2-2a2 2 0 00-2 2v2M10 10.5V6a2 2 0 00-2-2a2 2 0 00-2 2v8M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 012.83-2.82L7 15" />
			</svg>
			<span>{$t("new_game.poster.action_manual")}</span>
		</button>
	</div>

	<button type="button" onclick={onBack} class="text-btn">
		← {$t("new_game.back")}
	</button>
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
		class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
		onmousedown={(e) => {
			if (e.target === e.currentTarget) showManuell = false;
		}}
		onkeydown={(e) => e.key === "Escape" && (showManuell = false)}
	>
		<div
			class="bg-bg-secondary border-t border-border rounded-t-2xl sm:rounded-2xl sm:border w-full max-w-lg overflow-y-auto p-5 sm:mx-4"
		>
			<h2 class="text-lg font-bold text-text-primary text-center mb-5">
				{$t("new_game.poster.action_manual")}
			</h2>

			<div class="flex flex-col gap-4 mb-5">
				<div>
					<label class="text-xs font-medium text-accent-red mb-1.5 block tracking-[0.06em] uppercase">
						{$t("new_game.home")}
					</label>
					<TeamAutocomplete bind:value={manualHomeDraft} />
				</div>
				<div>
					<label class="text-xs font-medium text-success mb-1.5 block tracking-[0.06em] uppercase">
						{$t("new_game.away")}
					</label>
					<TeamAutocomplete bind:value={manualAwayDraft} direction="up" />
				</div>
			</div>

			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => (showManuell = false)}
					class="flex-1 rounded-xl border border-border bg-bg-input hover:bg-bg-card text-text-secondary text-sm font-semibold px-4 py-2.5 transition-colors"
				>
					{$t("new_game.cancel")}
				</button>
				<button
					type="button"
					onclick={saveManuell}
					disabled={!manualHomeDraft.trim() || !manualAwayDraft.trim()}
					class="flex-1 rounded-xl bg-accent-red hover:bg-accent-red-hover text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-accent-red/20 disabled:opacity-40 disabled:shadow-none transition-colors"
				>
					{$t("live_match.editor.confirm")}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
.generation-info-wrap {
	display: flex;
	justify-content: center;
}
.generation-info {
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(132, 204, 22, 0.2);
	border-radius: 999px;
	padding: 6px 14px;
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	color: #D1D5DB;
	font-weight: 600;
}
.generation-info-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: #84CC16;
	box-shadow: 0 0 6px rgba(132, 204, 22, 0.6);
}
.primary-btn {
	width: 100%;
	background: linear-gradient(135deg, #E24B4A, #C73E3D);
	color: white;
	border: 0;
	border-radius: 12px;
	padding: 14px;
	font-size: 14px;
	font-weight: 800;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	box-shadow: 0 6px 18px rgba(226, 75, 74, 0.4);
	transition: transform 0.15s, opacity 0.15s;
}
.primary-btn:not(:disabled):hover { transform: translateY(-1px); }
.primary-btn:disabled {
	background: rgba(226, 75, 74, 0.25);
	color: rgba(255, 255, 255, 0.4);
	box-shadow: none;
	cursor: not-allowed;
}
.btn-row {
	display: flex;
	gap: 8px;
}
.secondary-btn {
	flex: 1;
	background: #131822;
	color: #D1D5DB;
	border: 1px solid #1F2937;
	border-radius: 12px;
	padding: 11px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	transition: background-color 0.15s, border-color 0.15s, transform 0.1s;
}
.secondary-btn:hover:not(:disabled) {
	background: #1A1F2A;
	border-color: #2A3142;
}
.secondary-btn:active:not(:disabled) { transform: scale(0.98); }
.secondary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.text-btn {
	width: 100%;
	background: none;
	color: #6B7280;
	border: 0;
	font-size: 12px;
	font-weight: 600;
	padding: 12px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
}
.text-btn:hover { color: #D1D5DB; }
</style>

