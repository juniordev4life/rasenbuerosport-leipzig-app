<script>
import { getTranslate } from "@tolgee/svelte";
import OvrBadge from "$lib/components/ui/OvrBadge.svelte";
import PlayerAvatar from "$lib/components/ui/PlayerAvatar.svelte";
import Sheet from "$lib/components/ui/Sheet.svelte";
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
 * star-range dialog or open the manual sheet, where both teams are
 * typed into autocomplete fields and applied only on confirm. The
 * big red CTA forwards to onAnpfiff, which transitions the wizard
 * into the live-match step without bumping the visible stepper.
 *
 * Design A: one white card, home above "VS" above away (side by side
 * from `lg`). Design B: the teams stand on a small chalked pitch with
 * the "VS" badge on the halfway line.
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
const uid = $props.id();

const GUEST_ID = "__guest__";
const DEFAULT_MIN = 4;
const DEFAULT_MAX = 5;

let minStars = $state(DEFAULT_MIN);
let maxStars = $state(DEFAULT_MAX);

/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let homeTeamData = $state(null);
/** @type {import('$lib/services/teams.services.js').TeamData|null} */
let awayTeamData = $state(null);

/**
 * Star range the shown pair was rolled in (auto-roll, "Würfeln" or
 * "Anpassen"); null once the teams were typed in by hand, or when the
 * step opens with teams already set.
 * @type {{ minStars: number, maxStars: number }|null}
 */
let rolledRange = $state(null);

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
	rolledRange = null;
	showManuell = false;
}

/**
 * "balanced" | "uneven" once both teams' star ratings are known. Rolled
 * pairs always share their rating, so "uneven" only comes from a
 * manual pick.
 */
const starBalance = $derived.by(() => {
	const home = homeTeamData?.star_rating;
	const away = awayTeamData?.star_rating;
	if (home == null || away == null) return null;
	return home === away ? "balanced" : "uneven";
});

/** Line under the poster: how the pair was picked and its star balance. */
const pairInfo = $derived(
	[
		rolledRange &&
			$t("new_game.poster.generation_info", {
				min: rolledRange.minStars,
				max: rolledRange.maxStars,
			}),
		starBalance === "balanced" && $t("new_game.poster.balanced"),
		starBalance === "uneven" && $t("new_game.poster.imbalanced"),
	]
		.filter(Boolean)
		.join(" · "),
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
		rolledRange = { minStars, maxStars };
	} catch (err) {
		// Catalogue unreachable: say so; "Manuell" still works without it.
		console.error("Failed to roll teams:", err);
		rollError = $t("teams.error_loading");
	} finally {
		rolling = false;
	}
}

/**
 * @param {string} home
 * @param {string} away
 * @param {{ minStars: number, maxStars: number }} range - the picker's star range
 */
function onAnpassenConfirm(home, away, range) {
	homeTeam = home;
	awayTeam = away;
	homeTeamData = null;
	awayTeamData = null;
	rolledRange = range;
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

/** "vs." → "vs": the badge sets it in capitals without the dot. */
const versus = $derived($t("new_game.random_vs").replace(/\.$/, ""));
</script>

{#snippet playerChip(id)}
	{@const p = getPlayer(id)}
	<li class="player-chip">
		<PlayerAvatar player={p} size={24} />
		<span class="truncate">{p.username}</span>
	</li>
{/snippet}

{#snippet teamBlock(team, name, players, side)}
	<div class="team team-{side}">
		<div class="team-main">
			<span class="crest">
				{#if team || name}
					<TeamLogo logoUrl={team?.logo_url} teamName={team?.name ?? name} size="md" />
				{:else}
					<span class="crest-skeleton animate-pulse"></span>
				{/if}
			</span>
			<div class="team-info">
				<h2 class="team-name">{team?.name ?? (name || "—")}</h2>
				{#if team?.overall_rating != null || team?.star_rating != null}
					<div class="ratings">
						{#if team.overall_rating != null}
							<OvrBadge rating={team.overall_rating} size="sm" />
						{/if}
						{#if team.star_rating != null}
							<StarRating rating={team.star_rating} size="sm" />
						{/if}
					</div>
				{/if}
			</div>
		</div>
		<ul class="players">
			{#each players as id (id)}
				{@render playerChip(id)}
			{/each}
		</ul>
	</div>
{/snippet}

<div class="poster">
	{#if rollError}
		<p class="roll-error">{rollError}</p>
	{/if}

	<!-- Both teams with their players — a card in A, a chalked pitch in B. -->
	<div data-onboarding="poster-teams" class="versus">
		<div class="lines" aria-hidden="true">
			<span class="box box-home"><span class="goal-box"></span></span>
			<span class="box box-away"><span class="goal-box"></span></span>
		</div>
		{@render teamBlock(homeTeamData, homeTeam, homePlayers, "home")}
		<div class="vs" aria-hidden="true">
			<span class="vs-badge">{versus}</span>
		</div>
		{@render teamBlock(awayTeamData, awayTeam, awayPlayers, "away")}
	</div>

	{#if pairInfo}
		<p class="gen-info">
			<span class="gen-dot" aria-hidden="true"></span>
			<span>{pairInfo}</span>
		</p>
	{/if}

	<div class="cta-block">
		<button
			type="button"
			onclick={onAnpfiff}
			disabled={!homeTeam || !awayTeam}
			data-onboarding="poster-anpfiff"
			class="btn btn-primary btn-lg w-full kickoff"
		>
			<!-- Whistle (design B only) -->
			<svg class="kickoff-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true">
				<path d="M3 13a6 6 0 1 0 12 0 6 6 0 0 0-1-3.3L21 7V4h-9.5A6 6 0 0 0 3 13z" />
				<circle cx="9" cy="13" r="2" />
			</svg>
			<span>{$t("new_game.poster.anpfiff_cta")}</span>
		</button>

		<div class="actions" data-onboarding="poster-actions">
			<button type="button" onclick={roll} disabled={rolling} class="btn btn-secondary act">
				<!-- Dice -->
				<svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true">
					<rect x="4" y="4" width="16" height="16" rx="3" />
					<circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
					<circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" />
					<circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none" />
					<circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none" />
				</svg>
				<span class="truncate">{$t("new_game.poster.action_roll")}</span>
			</button>
			<button type="button" onclick={() => (showAnpassen = true)} class="btn btn-secondary act">
				<!-- Sliders -->
				<svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18" aria-hidden="true">
					<path d="M4 7h9M19 7h1M4 17h3M13 17h7" />
					<circle cx="16" cy="7" r="2.5" />
					<circle cx="10" cy="17" r="2.5" />
				</svg>
				<span class="truncate">{$t("new_game.poster.action_customize")}</span>
			</button>
			<button type="button" onclick={openManuell} class="btn btn-secondary act">
				<!-- Hand -->
				<svg class="act-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
					<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.9-2.6L3 14.5a1.5 1.5 0 0 1 2.4-1.8L8 15" />
				</svg>
				<span class="truncate">{$t("new_game.poster.action_manual")}</span>
			</button>
		</div>

		<button type="button" onclick={onBack} class="back-link">
			<span aria-hidden="true">←</span>
			{$t("new_game.back")}
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
	<Sheet title={$t("new_game.poster.action_manual")} onClose={() => (showManuell = false)}>
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-home" class="label manual-label">
					<span class="manual-dot home" aria-hidden="true"></span>
					{$t("new_game.home")}
				</label>
				<TeamAutocomplete id="{uid}-home" bind:value={manualHomeDraft} />
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="{uid}-away" class="label manual-label">
					<span class="manual-dot away" aria-hidden="true"></span>
					{$t("new_game.away")}
				</label>
				<TeamAutocomplete id="{uid}-away" bind:value={manualAwayDraft} direction="up" />
			</div>
		</div>

		<div class="grid grid-cols-2 gap-2 mt-5">
			<button type="button" onclick={() => (showManuell = false)} class="btn btn-secondary">
				{$t("new_game.cancel")}
			</button>
			<button
				type="button"
				onclick={saveManuell}
				disabled={!manualHomeDraft.trim() || !manualAwayDraft.trim()}
				class="btn btn-primary"
			>
				{$t("live_match.editor.confirm")}
			</button>
		</div>
	</Sheet>
{/if}

<style>
.poster {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.roll-error {
	align-self: center;
	margin: 0;
	padding: 6px 12px;
	border-radius: var(--radius-control);
	background: var(--color-loss-soft);
	color: var(--color-loss);
	font-size: 13px;
	font-weight: 700;
	text-align: center;
}

/* ── Design A: one white card, home · VS · away ─────────────────────── */
.versus {
	position: relative;
	display: grid;
	grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
	gap: 14px;
	padding: 16px;
	background: var(--color-surface);
	color: var(--color-ink);
	border-radius: var(--radius-card);
	box-shadow: var(--shadow-card);
}

.team {
	--team: var(--color-home);
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-width: 0;
}

.team-away {
	--team: var(--color-away);
}

.team-main {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
}

.crest {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 56px;
	flex-shrink: 0;
	overflow: hidden;
	background: var(--color-sunken);
	border-radius: var(--radius-avatar);
}

.crest-skeleton {
	width: 40px;
	height: 40px;
	border-radius: var(--radius-avatar);
	background: var(--color-line);
}

.team-info {
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
}

.team-name {
	margin: 0;
	overflow: hidden;
	font-size: 18px;
	font-weight: 700;
	line-height: 1.2;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ratings {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.players {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.player-chip {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	max-width: 100%;
	padding: 3px 10px 3px 3px;
	border: 1px solid var(--color-line);
	border-radius: var(--radius-badge);
	font-size: 13px;
	font-weight: 700;
}

/* "VS" between the teams: a red word between two hairlines. */
.vs {
	display: flex;
	align-items: center;
	gap: 12px;
}

.vs::before,
.vs::after {
	content: "";
	flex: 1;
	height: 1px;
	background: var(--color-line);
}

.vs-badge {
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 20px;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--color-brand);
}

.lines {
	display: none;
}

/* ── Footer: generation note, kick-off, actions ─────────────────────── */
.gen-info {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	color: var(--color-on-page);
	text-shadow: var(--on-page-shadow);
	font-size: 13px;
}

.gen-dot {
	width: 8px;
	height: 8px;
	flex-shrink: 0;
	border-radius: var(--radius-badge);
	background: var(--color-brand);
}

.cta-block {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.kickoff-icon,
.act-icon {
	display: none;
	flex-shrink: 0;
}

.actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;
}

.act {
	gap: 6px;
	padding: 0 8px;
	font-size: 14px;
	font-weight: 400;
}

.back-link {
	align-self: center;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 40px;
	padding: 0 12px;
	border: 0;
	background: none;
	color: var(--color-on-page);
	text-shadow: var(--on-page-shadow);
	font-size: 14px;
	cursor: pointer;
}

.back-link:hover {
	text-decoration: underline;
}

.manual-label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: var(--color-ink);
}

.manual-dot {
	width: 10px;
	height: 10px;
	border-radius: var(--radius-badge);
	background: var(--color-home);
}

.manual-dot.away {
	background: var(--color-away);
}

/* ── Design B: the teams on a small chalked pitch ───────────────────── */
:global([data-variant="b"]) .versus {
	--chalk: var(--color-chalk);
	gap: 0;
	padding: 20px 16px;
	overflow: hidden;
	background: var(--color-pitch);
	color: var(--color-on-page);
}

:global([data-variant="b"]) .lines {
	position: absolute;
	inset: 8px;
	display: block;
	border: 3px solid var(--chalk);
	pointer-events: none;
}

.box,
.goal-box {
	position: absolute;
	left: 50%;
	border: 3px solid var(--chalk);
	transform: translateX(-50%);
}

.box {
	width: 52%;
	height: 44px;
}

.goal-box {
	width: 48%;
	height: 18px;
}

.box-home,
.box-home .goal-box {
	top: -3px;
}

.box-away,
.box-away .goal-box {
	bottom: -3px;
}

:global([data-variant="b"]) .team {
	align-items: center;
	gap: 8px;
	padding: 40px 0 24px;
	text-align: center;
}

:global([data-variant="b"]) .team-away {
	padding: 24px 0 40px;
}

:global([data-variant="b"]) .team-main {
	flex-direction: column;
	gap: 6px;
	max-width: 100%;
}

:global([data-variant="b"]) .team-info {
	align-items: center;
	max-width: 100%;
}

:global([data-variant="b"]) .crest {
	background: var(--color-surface);
	box-shadow:
		0 0 0 3px var(--team),
		var(--shadow-raised);
}

:global([data-variant="b"]) .team-name {
	max-width: 100%;
	font-family: var(--font-cond);
	font-weight: 800;
	font-size: 22px;
	text-shadow: var(--on-page-shadow);
}

:global([data-variant="b"]) .ratings {
	padding: 3px 10px 3px 3px;
	border-radius: 999px;
	background: var(--color-surface);
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .players {
	justify-content: center;
}

:global([data-variant="b"]) .player-chip {
	padding-right: 12px;
	border: 0;
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: var(--shadow-control);
}

/* Halfway line and centre circle run through the VS badge. */
:global([data-variant="b"]) .vs {
	position: relative;
	justify-content: center;
	margin: 0 -8px;
}

:global([data-variant="b"]) .vs::before {
	position: absolute;
	left: 0;
	right: 0;
	top: 50%;
	height: 0;
	border-top: 3px solid var(--chalk);
	background: none;
	transform: translateY(-50%);
}

:global([data-variant="b"]) .vs::after {
	position: absolute;
	left: 50%;
	top: 50%;
	flex: none;
	width: 92px;
	height: 92px;
	border: 3px solid var(--chalk);
	border-radius: 50%;
	background: none;
	transform: translate(-50%, -50%);
}

:global([data-variant="b"]) .vs-badge {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border: 3px solid var(--color-surface);
	border-radius: 999px;
	background: var(--color-brand);
	color: var(--color-on-brand);
	font-weight: 800;
	font-size: 16px;
	letter-spacing: 0;
	box-shadow: var(--shadow-raised);
}

:global([data-variant="b"]) .gen-info {
	align-self: center;
	padding: 6px 14px;
	border-radius: 999px;
	background: var(--color-surface);
	color: var(--color-ink);
	text-shadow: none;
	font-size: 12px;
	font-weight: 700;
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .gen-dot {
	background: var(--color-progress);
}

:global([data-variant="b"]) .kickoff {
	box-shadow: var(--shadow-control);
}

:global([data-variant="b"]) .kickoff-icon,
:global([data-variant="b"]) .act-icon {
	display: block;
}

:global([data-variant="b"]) .act {
	font-weight: 700;
}

:global([data-variant="b"]) .back-link {
	font-weight: 700;
}

/* ── Desktop: home and away side by side ────────────────────────────── */
@media (min-width: 1024px) {
	.versus {
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		grid-template-rows: auto;
		align-items: start;
		gap: 24px;
		padding: 24px;
	}

	.vs {
		flex-direction: column;
		align-self: stretch;
	}

	.vs::before,
	.vs::after {
		width: 1px;
		height: auto;
	}

	.gen-info {
		align-self: center;
	}

	.cta-block {
		align-self: center;
		width: min(100%, 32rem);
	}

	:global([data-variant="b"]) .versus {
		align-items: center;
		padding: 24px;
	}

	:global([data-variant="b"]) .team,
	:global([data-variant="b"]) .team-away {
		padding: 24px 56px;
	}

	/* Reach the touchlines (8px inside the card's edge). */
	:global([data-variant="b"]) .vs {
		margin: -16px 0;
		align-self: stretch;
	}

	:global([data-variant="b"]) .vs::before {
		left: 50%;
		right: auto;
		top: 0;
		bottom: 0;
		width: 0;
		height: auto;
		border-top: 0;
		border-left: 3px solid var(--chalk);
		transform: translateX(-50%);
	}

	:global([data-variant="b"]) .vs::after {
		width: 110px;
		height: 110px;
	}

	.box {
		left: auto;
		top: 50%;
		width: 52px;
		height: 50%;
		transform: translateY(-50%);
	}

	.goal-box {
		left: auto;
		top: 50%;
		width: 20px;
		height: 48%;
		transform: translateY(-50%);
	}

	.box-home,
	.box-home .goal-box {
		top: 50%;
		left: -3px;
	}

	.box-away,
	.box-away .goal-box {
		top: 50%;
		bottom: auto;
		right: -3px;
	}
}
</style>
