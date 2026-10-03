<script>
import { getTranslate } from "@tolgee/svelte";
import { untrack } from "svelte";
import { goto, replaceState } from "$app/navigation";
import ModeTabs from "$lib/components/compare/ModeTabs.svelte";
import PlayerSlot from "$lib/components/compare/PlayerSlot.svelte";
import SelectionGrid from "$lib/components/compare/SelectionGrid.svelte";
import { get } from "$lib/services/api.services.js";
import { user } from "$lib/stores/auth.stores.js";
import { buildEloHistory } from "$lib/utils/eloHistory.utils.js";

const { t } = getTranslate();

let players = $state([]);
let games = $state([]);
let loading = $state(true);
let mode = $state("players");
let opponentId = $state(initialOpponentId());
let toast = $state(null);

const userId = $derived($user?.uid ?? null);
const userAvatar = $derived($user?.user_metadata?.avatar_url ?? null);

function initialOpponentId() {
	if (typeof window === "undefined") return null;
	return new URL(window.location.href).searchParams.get("opp");
}

$effect(() => {
	let aborted = false;
	(async () => {
		try {
			const [playersRes, gamesRes] = await Promise.all([
				get("/v1/players"),
				get("/v1/games?limit=200"),
			]);
			if (aborted) return;
			players = playersRes.data ?? [];
			games = gamesRes.data ?? [];
		} catch (err) {
			console.error("Compare load failed:", err);
		} finally {
			if (!aborted) loading = false;
		}
	})();
	return () => {
		aborted = true;
	};
});

$effect(() => {
	const id = opponentId;
	untrack(() => {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		if (id) url.searchParams.set("opp", id);
		else url.searchParams.delete("opp");
		if (url.search !== window.location.search) replaceState(url, {});
	});
});

const eloHistory = $derived(buildEloHistory(games, { mode: "all" }));

const playerList = $derived.by(() =>
	(players ?? []).map((p) => {
		const entry = eloHistory.get(p.id);
		return {
			id: p.id,
			username: p.username,
			avatarUrl: p.avatar_url ?? null,
			elo: entry?.currentRating ?? p.current_rating ?? null,
		};
	}),
);

const me = $derived(playerList.find((p) => p.id === userId));

const selectedOpponent = $derived(
	opponentId ? (playerList.find((p) => p.id === opponentId) ?? null) : null,
);

const pageTitle = $derived($t("compare.ready_title"));
const pageSub = $derived($t("compare.pick_sub_empty"));
const startLabel = $derived(
	opponentId ? $t("compare.start_btn") : $t("compare.start_btn_disabled"),
);

function pickOpponent(id) {
	opponentId = id === opponentId ? null : id;
}

function clearOpponent() {
	opponentId = null;
}

function showSoonToast() {
	toast = $t("compare.duo_soon_toast");
	setTimeout(() => {
		toast = null;
	}, 2400);
}

function startCompare() {
	if (!userId || !opponentId) return;
	goto(`/app/compare/h2h/${userId}/${opponentId}`);
}
</script>

<svelte:head>
	<title>RasenBürosport - {$t("compare.title")}</title>
</svelte:head>

<!-- Phone: the pairing in the hero band, the picker below, the start
     button pinned above the bottom nav. Desktop: the picker fills the
     main column, the pairing and the start button form a sticky rail. -->
<div class="cmp stack">
	<header class="hero bleed cmp-hero">
		<div class="cmp-intro">
			<h1 class="page-title cmp-title">{pageTitle}</h1>
			<p class="cmp-sub">{pageSub}</p>
		</div>

		<ModeTabs value={mode} onSelect={(v) => (mode = v)} onDuoTap={showSoonToast} />

		<div class="slots">
			<PlayerSlot
				state="locked"
				accent="self"
				player={me
					? {
							id: me.id,
							username: me.username,
							avatarUrl: userAvatar ?? me.avatarUrl,
							initials: (me.username ?? "?").charAt(0).toUpperCase(),
							elo: me.elo,
						}
					: null}
			/>
			<span class="vs">VS</span>
			<PlayerSlot
				state={selectedOpponent ? "filled" : "empty"}
				accent="opponent"
				player={selectedOpponent
					? {
							id: selectedOpponent.id,
							username: selectedOpponent.username,
							avatarUrl: selectedOpponent.avatarUrl,
							initials: (selectedOpponent.username ?? "?").charAt(0).toUpperCase(),
							elo: selectedOpponent.elo,
						}
					: null}
				onClear={clearOpponent}
			/>
		</div>

		<button type="button" class="btn btn-lg btn-accent start-rail" disabled={!opponentId} onclick={startCompare}>
			{startLabel}
		</button>
	</header>

	<div class="cmp-picker">
		{#if loading}
			<div class="flex justify-center py-12">
				<span class="spinner" role="status" aria-label={$t("common.loading")}></span>
			</div>
		{:else}
			<SelectionGrid
				players={playerList}
				currentUserId={userId}
				selectedId={opponentId}
				onSelect={pickOpponent}
			/>
		{/if}
	</div>
</div>

<div class="cta-bar">
	<button type="button" class="btn btn-lg btn-primary cta" disabled={!opponentId} onclick={startCompare}>
		{startLabel}
	</button>
</div>

<!-- The live region stays mounted so screen readers announce the toast. -->
<div role="status" aria-live="polite">
	{#if toast}
		<div class="toast">{toast}</div>
	{/if}
</div>

<style>
/* Room for the pinned start button above the bottom nav. */
.cmp {
	padding-bottom: 6rem;
}

/* ── Hero: red band in A, text on the pitch in B ────────────────────── */
.cmp-hero {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding-top: 22px;
	padding-bottom: 24px;
}

.cmp-intro {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.cmp-title {
	margin: 0;
	font-size: 36px;
	text-shadow: var(--on-page-shadow);
}

.cmp-sub {
	margin: 0;
	font-size: 15px;
	text-shadow: var(--on-page-shadow);
}

.slots {
	display: flex;
	align-items: center;
	gap: 8px;
}

.vs {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	border-radius: 999px;
	box-shadow: inset 0 0 0 1px currentColor;
	font-family: var(--font-cond);
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.04em;
}

/* Desktop-only start button in the rail; phones use the pinned bar. */
.start-rail {
	display: none;
}

.cta-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: calc(env(safe-area-inset-bottom) + 130px);
	z-index: 30;
	display: flex;
	justify-content: center;
	padding: 0 var(--page-gutter, 1rem);
	pointer-events: none;
}

.cta {
	min-width: 260px;
	box-shadow: var(--shadow-raised);
	pointer-events: auto;
}

.toast {
	position: fixed;
	left: 50%;
	bottom: calc(env(safe-area-inset-bottom) + 200px);
	z-index: 40;
	max-width: calc(100vw - 32px);
	padding: 10px 16px;
	transform: translateX(-50%);
	border-radius: var(--radius-control);
	background: var(--color-navy);
	color: var(--color-on-navy);
	box-shadow: var(--shadow-raised);
	font-weight: 700;
	font-size: 13px;
	text-align: center;
}

:global([data-variant="b"]) .cmp-hero {
	gap: 12px;
	padding: 0;
}

:global([data-variant="b"]) .cmp-title {
	font-size: 34px;
	line-height: 1.1;
}

:global([data-variant="b"]) .cmp-sub {
	font-weight: 700;
	font-size: 16px;
}

:global([data-variant="b"]) .vs {
	background: var(--color-navy);
	color: var(--color-on-navy);
	box-shadow: var(--shadow-control);
	text-shadow: none;
}

/* ── Desktop: picker left, sticky pairing rail right ────────────────── */
@media (min-width: 1024px) {
	.cmp {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		column-gap: 32px;
		align-items: start;
		padding-bottom: 2rem;
	}

	.cmp-hero {
		grid-column: 2;
		grid-row: 1;
		position: sticky;
		top: 92px;
		margin: 0;
		padding: 24px;
		border-radius: var(--radius-card);
	}

	/* The top bar carries the page title on desktop. */
	.cmp-title {
		display: none;
	}

	.cmp-picker {
		grid-column: 1;
		grid-row: 1;
	}

	.start-rail {
		display: inline-flex;
		width: 100%;
	}

	.cta-bar {
		display: none;
	}

	.toast {
		bottom: 32px;
	}
}
</style>
